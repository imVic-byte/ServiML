const WORKER_URL = 'https://subir-imagenes.soporte-serviml.workers.dev/' 

export const subirFotosGeneral = async (archivos) => {

  if (!archivos || !archivos.length) {
    return { exito: true, mensaje: 'Sin archivo', fotos: [] }
  }
  try {
    const promesas = archivos.map(async (archivo, index) => {
      const archivoReal = archivo.file || archivo
      const formData = new FormData()
      const nombreLimpio = archivoReal.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const nombreUnico = `${Date.now()}-${nombreLimpio}` 
      formData.append('file', archivoReal, nombreUnico)
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
      url: data.url
    }))
    return { exito: true, fotos: registros}

  } catch (err) {
    return { exito: false, error: err.message }
  }
}