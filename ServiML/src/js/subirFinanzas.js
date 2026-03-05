import { supabase } from '../lib/supabaseClient'

const WORKER_URL = 'https://finanzas.soporte-serviml.workers.dev/' 

export const subirFinanzas = async (transaccion, pdf) => {
    if (!pdf || !transaccion) {
        return { exito: false, error: 'Faltan datos' }
    }
    try {
        const { data: presupuesto, error: errorPresupuesto } = await supabase
        .from('transacciones')
        .select('id')
        .eq('id', transaccion)
        .maybeSingle()
        if (errorPresupuesto) {
            return { exito: false, error: 'Error al buscar la transaccion' }
        }
        if (!presupuesto) {
            return { exito: false, error: 'Transaccion no encontrada' }
        }
        const formData = new FormData()
        formData.append('file', pdf)
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
        .from('transacciones_detalle')
        .insert({
            id_transaccion: transaccion,
            url: data.url
        })
        if (error2) {
            throw error2
        }
        return { exito: true, url: data.url }
    } catch (error) {
        return { exito: false, error: error.message }
    }
}