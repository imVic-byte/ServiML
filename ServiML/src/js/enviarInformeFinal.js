import {supabase} from "../lib/supabaseClient.js";

const WORKER_URL = "https://upload-informe.soporte-serviml.workers.dev/";

export const enviarInformeFinal = async (informeId, numeroFolio, pdf) => {
    if (!informeId || !numeroFolio || !pdf) {
        return { exito: false, error: 'Faltan datos' }
    }
    console.log(informeId, numeroFolio, pdf);
    try {
        const {data:existe, error:errorExiste} = await supabase
        .from('informe_final')
        .select('*')
        .eq('id', informeId)
        .maybeSingle();
        if (errorExiste) {
            console.log(errorExiste);
        
        }
        const formData = new FormData();
        formData.append('file', pdf, 'Informe.pdf');
        formData.append('numero_folio', numeroFolio);
        console.log(formData.entries());
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            console.log('Error al enviar el informe');
        }
        if (response.ok) {
            console.log('Informe enviado correctamente');
            console.log('ESTA SERÁ LA URL: ', response.url);
        }
        const informe = await response.json();
        console.log(informe);
        const {data:enviado, error:errorEnvio} = await supabase
        .from('informe_final')
        .update({
            url: informe.url
        })  
        .eq('id', informeId)
        .single();
        if (errorEnvio) {
            console.log(errorEnvio);
        }
        const {data:email, error:errorEmail} = await supabase
        .from('presupuesto')
        .select('*,cliente(*)')
        .eq('numero_folio', numeroFolio)
        .single();
        if (errorEmail) {
            console.log(errorEmail);
        }
        if (!email.cliente.email) {
            console.log('El cliente no tiene correo');
            return { exito: false, error: 'El cliente no tiene correo' }
        }
        const clienteEmail = email.cliente.email;
        const {data:dataMail, error:errorMail} = await supabase.functions.invoke('informe-final', {
            body: {
                emailCliente: clienteEmail,
                nombreCliente: email.cliente.nombre,
                apellidoCliente: email.cliente.apellido,
                urlPdf: informe.url,
                folio: numeroFolio
            },
            headers: {
                Authorization: `Bearer ${import.meta.env.SUPABASE_ANON_KEY}`
            }
        })
        if (errorMail) {
            console.log(errorMail);
            return { exito: false, error: 'Error al enviar el correo' }
        }
        return { exito: true, data: dataMail }
    } catch (error) {
        console.error(error);
        return { exito: false, error: 'Error al enviar el informe' }
    }
}