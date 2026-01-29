import { supabase } from '../lib/supabaseClient'

const WORKER_URL = 'https://upload-pdf.soporte-serviml.workers.dev/' 

export const subirFacturas = async (id_presupuesto, pdf) => {
    if (!pdf || !id_presupuesto) {
        return { exito: false, error: 'Faltan datos' }
    }
    try {
        const { data:existe, error: errorPDF } = await supabase
        .from('PresupuestoPDF')
        .select('id')
        .eq('id_presupuesto', id_presupuesto)
        .maybeSingle()
        if (errorPDF) {
            return { exito: false, error: 'Error al buscar la factura' }
        }
        if (existe) {
            return { exito: false, error: 'El presupuesto ya tiene una factura' }
        }
        const { data: presupuesto, error: errorPresupuesto } = await supabase
        .from('presupuesto')
        .select('numero_folio')
        .eq('id', id_presupuesto)
        .maybeSingle()
        if (errorPresupuesto) {
            return { exito: false, error: 'Error al buscar el presupuesto' }
        }
        if (!presupuesto) {
            return { exito: false, error: 'Presupuesto no encontrado' }
        }
        const formData = new FormData()
        formData.append('file', pdf, 'factura_presupuesto.pdf')
        formData.append('numero_folio', presupuesto.numero_folio)
        const res = await fetch(WORKER_URL, {
            method: 'POST',
            body: formData
        })
        if (!res.ok) {
            const textoError = await res.text()
            throw new Error(`Worker respondió: ${res.status} ${res.statusText} - ${textoError}`)
        }
        const data = await res.json()
        const { error: error2 } = await supabase
        .from('PresupuestoPDF')
        .insert({
            id_presupuesto: id_presupuesto,
            url: data.url,
            nombre: data.key,
        })
        if (error2) {
            throw error2
        }
        return { exito: true, url: data.url }
    } catch (error) {
        return { exito: false, error: error.message }
    }
}