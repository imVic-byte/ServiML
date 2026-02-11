import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createTransport } from "npm:nodemailer@6.9.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { emailCliente, nombreCliente, apellidoCliente, urlPdf, folio } = await req.json();
    const nombreFinal = `${nombreCliente} ${apellidoCliente}`.trim() || 'Cliente';

    if (!emailCliente || !urlPdf) {
      throw new Error('Faltan datos (email o URL)');
    }

    const transporter = createTransport({
      host: "mail.serviml.cl",
      port: 465,
      secure: true,
      auth: {
        user: Deno.env.get("SMTP_USER"),
        pass: Deno.env.get("SMTP_PASS"),
      },
    });

    const asunto = `Presupuesto Confirmado - Folio ${folio || '---'}`;
    
    const cuerpoHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>¡Hola ${nombreFinal}!</h2>
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

    const info = await transporter.sendMail({
      from: `"ServiML Soporte" <${Deno.env.get("SMTP_USER")}>`,
      to: emailCliente,
      subject: asunto,
      html: cuerpoHtml,
    });

    console.log("Correo enviado: %s", info.messageId);

    return new Response(
      JSON.stringify({ success: true, message: 'Correo enviado exitosamente' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("Error enviando correo:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});