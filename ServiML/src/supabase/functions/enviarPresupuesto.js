import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { emailCliente, nombreCliente, urlPdf, folio } = await req.json()

    if (!emailCliente || !urlPdf) {
      throw new Error('Faltan datos (email o URL)')
    }

    const client = new SmtpClient();
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: Deno.env.get("SMTP_USER"),
      password: Deno.env.get("SMTP_PASS"),
    });

    const asunto = `Presupuesto Confirmado - Folio ${folio || '---'}`;
    
    const cuerpoHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>¡Hola ${nombreCliente || 'Cliente'}!</h2>
        <p>Tu presupuesto ha sido confirmado exitosamente.</p>
        <p>Puedes descargar tu comprobante (PDF) en el siguiente enlace:</p>
        <div style="margin: 20px 0;">
            <a href="${urlPdf}" style="background-color: #1f3d64; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Ver Presupuesto PDF
            </a>
        </div>
        <p>Si el botón no funciona, copia y pega este enlace: <br> ${urlPdf}</p>
        <hr>
        <p style="font-size: 12px; color: #666;">ServiML - Servicios Mecánicos</p>
      </div>
    `;

    await client.send({
      from: "ServiML <soporte.serviml@gmail.com>",
      to: emailCliente,
      subject: asunto,
      content: cuerpoHtml,
      html: cuerpoHtml,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: 'Correo enviado' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})