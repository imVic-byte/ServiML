import { supabase } from '../lib/supabaseClient'

const WORKER_URL = 'https://upload.soporte-serviml.workers.dev/' 

export const subirFotos = async (idOrden,archivos) => {

  if (!archivos || archivos.length === 0) {
    return { exito: true, mensaje: 'Sin fotos' }
  }

  try {
    const { data: ordenTrabajo } = await supabase
      .from('orden_trabajo')
      .select('*,presupuesto(numero_folio)')
      .eq('id', idOrden)
      .single()
    
    if (!ordenTrabajo) {
      throw new Error('Orden de trabajo no encontrada')
    }
    const numeroFolio = ordenTrabajo.presupuesto.numero_folio
    const promesas = archivos.map(async (archivo, index) => {
      const archivoReal = archivo.file || archivo
      const formData = new FormData()
      const nombreLimpio = archivoReal.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const nombreUnico = `OT-${idOrden}-${Date.now()}-${nombreLimpio}` 
      formData.append('file', archivoReal, nombreUnico)
      formData.append('numero_folio', numeroFolio)

      try {
        const res = await fetch(WORKER_URL, {
          method: 'POST',
          body: formData
        })

        if (!res.ok) {
          const textoError = await res.text()
          throw new Error(`Worker respondió: ${res.status} ${res.statusText} - ${textoError}`)
        }

        const data = await res.json()
        return { url: data.url, key: data.key }

      } catch (fetchError) {
        throw fetchError
      }
    })

    const resultados = await Promise.all(promesas)

    const registros = resultados.map(data => ({
      id_orden_trabajo: idOrden,
      url: data.url,
      nombre: data.key
    }))

    const { error } = await supabase
      .from('imagenes')
      .insert(registros)

    if (error) {
      throw error
    }
    
    return { exito: true }

  } catch (err) {
    return { exito: false, error: err.message }
  }
}