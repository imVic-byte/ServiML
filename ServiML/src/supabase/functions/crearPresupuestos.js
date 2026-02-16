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
    
    const { patente, marca, modelo, nombre, apellido, codigoPais, telefono, email, vencimiento, diagnostico, detalles, ...presupuestoData } = await req.json()

    let clienteId = null

    if (nombre && apellido) {
      const { data } = await supabase
        .from('cliente')
        .select('id')
        .eq('nombre', nombre.toUpperCase())
        .eq('apellido', apellido.toUpperCase())
        .maybeSingle()
      
      if (data) clienteId = data.id
    }

    if (!clienteId) {
      const { data, error } = await supabase
        .from('cliente')
        .insert({ 
          nombre: nombre, 
          apellido: apellido, 
          codigo_pais: codigoPais, 
          telefono: telefono, 
          email: email 
        })
        .select('id')
        .single()

      if (error) throw error
      clienteId = data.id
    }

    let { data: vehiculoData } = await supabase
      .from('vehiculo')
      .select('id')
      .eq('id_cliente', clienteId)
      .eq('patente', patente)
      .maybeSingle()

    if (!vehiculoData) {
      const { data: nuevoVehiculo, error } = await supabase
        .from('vehiculo')
        .insert({ patente: patente.toUpperCase(), marca: marca.toUpperCase(), modelo: modelo.toUpperCase(), id_cliente: clienteId })
        .select('id')
        .single()
      if (error) throw error
      vehiculoData = nuevoVehiculo
    }

    const { data: nuevoPresupuesto, error: errorPresupuesto } = await supabase
      .from('presupuesto')
      .insert({
        ...presupuestoData,
        id_cliente: clienteId,
        id_vehiculo: vehiculoData.id,
        diagnostico: diagnostico,
        vencimiento: vencimiento
      })
      .select()
      .single()

    if (errorPresupuesto) throw errorPresupuesto

    if (detalles?.length > 0) {
      const detallesConId = detalles.map((d) => ({
        id_presupuesto: nuevoPresupuesto.id,
        descripcion: d.descripcion,
        monto: d.monto
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