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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) throw new Error('No autorizado')

    const { data: perfilGerente } = await supabaseAdmin
      .from('trabajadores')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!perfilGerente || perfilGerente.rol !== 'Gerente') {
      throw new Error('Solo los gerentes pueden invitar trabajadores')
    }

    const { email, nombre, apellido, rut, telefono, rol } = await req.json()

    const origin = req.headers.get('origin') || 'http://localhost:5173'
    const redirectUrl = `${origin}/crear-contraseña`

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: `${nombre} ${apellido}` },
      redirectTo: redirectUrl,
    })

    if (inviteError) throw inviteError

    const { error: dbError } = await supabaseAdmin
      .from('trabajadores')
      .insert([{
        id: inviteData.user.id,
        nombre,
        apellido,
        rut,
        email,
        telefono,
        rol
      }])

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(inviteData.user.id)
      throw dbError
    }

    return new Response(JSON.stringify({ message: 'Invitación enviada correctamente' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})