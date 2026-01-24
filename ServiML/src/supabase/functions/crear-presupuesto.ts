import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) throw new Error('Invalid User')
    
    const { patente, cliente, rut, contacto, diagnostico, detalles, ...presupuestoData } = await req.json()
    
    let clienteData = null
    if (rut) {
      let { data: clienteData } = await supabase
        .from('cliente')
        .select('id')
        .eq('rut', rut)
        .maybeSingle()
    }
    else {
      let { data: clienteData } = await supabase
        .from('cliente')
        .select('id')
        .eq('nombre', cliente)
        .maybeSingle()
    }
    if (!clienteData) {
      const { data: nuevoCliente, error } = await supabase
        .from('cliente')
        .insert({ nombre: cliente, rut: rut, telefono: contacto })
        .select('id')
        .single()
      
      if (error) throw error
      clienteData = nuevoCliente
    }

    let { data: vehiculoData } = await supabase
      .from('vehiculo')
      .select('id')
      .eq('patente', patente)
      .maybeSingle()

    if (!vehiculoData) {
      const { data: nuevoVehiculo, error } = await supabase
        .from('vehiculo')
        .insert({ patente, modelo: 'N/A', id_cliente: clienteData.id })
        .select('id')
        .single()

      if (error) throw error
      vehiculoData = nuevoVehiculo
    }

    const { data: nuevoPresupuesto, error: errorPresupuesto } = await supabase
      .from('presupuesto')
      .insert({
        ...presupuestoData,
        id_cliente: clienteData.id,
        id_vehiculo: vehiculoData.id,
        numero_folio: `FOL-${Date.now()}`,
        diagnostico: diagnostico.value
      })
      .select()
      .single()

    if (errorPresupuesto) throw errorPresupuesto

    if (detalles?.length > 0) {
      const detallesConId = detalles.map((d) => ({
        id_presupuesto: nuevoPresupuesto.id,
        descripcion: d.descripcion,
        valor_total: d.monto
      }))
      const { error: errorDetalles } = await supabase
        .from('detalle_presupuesto')
        .insert(detallesConId)

      if (errorDetalles) throw errorDetalles
    }

    return new Response(
      JSON.stringify({ success: true, data: nuevoPresupuesto }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})