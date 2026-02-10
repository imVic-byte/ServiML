import { supabase } from '../lib/supabaseClient'

const WORKER_URL = 'https://upload.soporte-serviml.workers.dev/' 

export const subirFotos = async (idOrden, numeroFolio, archivos) => {

  if (!archivos || archivos.length === 0) {
    return { exito: true, mensaje: 'Sin fotos' }
  }

  try {
    const { data: OT_bitacora } = await supabase
      .from('OT_bitacora')
      .select('*')
      .eq('id', idOrden)
      .single()
    
    if (!OT_bitacora) {
      throw new Error('Orden de trabajo no encontrada')
    }
    const promesas = archivos.map(async (archivo, index) => {
      const archivoReal = archivo.file || archivo
      const formData = new FormData()
      const nombreLimpio = archivoReal.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const nombreUnico = `OT-${numeroFolio}-${Date.now()}-${nombreLimpio}` 
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
      id_OT_bitacora: idOrden,
      url: data.url
    }))

    const { error } = await supabase
      .from('OT_Fotos')
      .insert(registros)

    if (error) {
      throw error
    }
    
    return { exito: true }

  } catch (err) {
    return { exito: false, error: err.message }
  }
}