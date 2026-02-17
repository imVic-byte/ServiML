import { supabase } from '../lib/supabaseClient'

const WORKER_URL = 'https://upload-pdf.soporte-serviml.workers.dev/' 

export const subirAbonos = async (deuda_id, abono_id, pdf) => {
    if (!pdf || !deuda_id || !abono_id) {
        return { exito: false, error: 'Faltan datos' }
    }
    try {
        const { data:existe, error: errorPDF } = await supabase
        .from('abonos')
        .select('id')
        .eq('id', abono_id)
        .maybeSingle()
        if (errorPDF) {
            return { exito: false, error: 'Error al buscar el abono' }
        }
        if (!existe) {
            return { exito: false, error: 'Abono no encontrado' }
        }
        const { data: deuda, error: errorDeuda } = await supabase
        .from('deudas')
        .select('nombre')
        .eq('id', deuda_id)
        .maybeSingle()
        if (errorDeuda) {
            return { exito: false, error: 'Error al buscar la deuda' }
        }
        if (!deuda) {
            return { exito: false, error: 'Deuda no encontrada' }
        }
        const formData = new FormData()
        formData.append('file', pdf, 'factura_abono.pdf')
        formData.append('numero_folio', deuda.nombre.trim())
        const res = await fetch(WORKER_URL, {
            method: 'POST',
            body: formData  
        })
        if (!res.ok) {
            const textoError = await res.text()
            throw new Error(`Worker respondió: ${res.status} ${res.statusText} - ${textoError}`)
        }
        const data = await res.json()
        const { data: updateData, error: error2 } = await supabase
        .from('abonos')
        .update({
            url: data.url
        })
        .eq('id', abono_id)
        .select()
        if (error2) {
            throw error2
        }
        return { exito: true }
    } catch (error) {
        return { exito: false, error: error.message }
    }
}