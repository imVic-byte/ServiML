// supabase/functions/invite-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Manejo de Preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Crear cliente
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Obtener datos
    const { email, rol, nombre, apellido, rut, telefono } = await req.json()

    // 4. Invitar al usuario
    const { data: userData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'http://localhost:5173/crear-contrasena' 
    })

    if (inviteError) throw inviteError

    // 5. Insertar en trabajadores
    const { error: dbError } = await supabaseAdmin
      .from('trabajadores')
      .insert({
        id: userData.user.id,
        email: email,
        rol: rol,
        nombre: nombre,
        apellido: apellido,
        rut: rut,
        telefono: telefono
      })

    if (dbError) throw dbError

    // 6. Respuesta Exitosa (IMPORTANTE: Incluir corsHeaders aqui)
    return new Response(
      JSON.stringify({ message: 'Usuario invitado y registrado correctamente', user: userData.user }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      }
    )

  } catch (error) {
    // 7. Respuesta de Error (IMPORTANTE: Incluir corsHeaders aqui tambien)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 400 
      }
    )
  }
})