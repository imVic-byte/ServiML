import { ref } from 'vue';
import { comprimirImagen } from '../js/comprimirFotos';
import { subirFotos } from '../js/subirFotos';

export function useGestionFotos(idOrden, emit) {
  const fotosTomadas = ref([]);
  const procesando = ref(false);

  const procesarCaptura = async (event) => {
    const archivo = event.target.files[0];
    if (!archivo) return;
    procesando.value = true;
    try {
      const archivoComprimido = await comprimirImagen(archivo);
      fotosTomadas.value.push({
        file: archivoComprimido,
        url: URL.createObjectURL(archivoComprimido),
        nombre: archivo.name
      });
    } catch (error) {
      console.error("Error al procesar foto:", error);
      alert("Error al procesar la imagen.");
    } finally {
      procesando.value = false;
      event.target.value = '';
    }
  };

  const eliminarFoto = (index) => {
    URL.revokeObjectURL(fotosTomadas.value[index].url);
    fotosTomadas.value.splice(index, 1);
  };

  const guardar = async () => {
    if (fotosTomadas.value.length === 0) return alert('No hay fotos');
    
    emit('loading', true);
    try {
      const resultado = await subirFotos(idOrden, fotosTomadas.value);
      if (resultado.exito) {
        alert('Subida exitosa');
        // Limpiamos el componente después de subir
        fotosTomadas.value.forEach(f => URL.revokeObjectURL(f.url));
        fotosTomadas.value = [];
        emit('recargarFotos', resultado.fotos);
      }
    } catch (error) {
      alert("Error en la subida.");
    } finally {
      emit('loading', false);
    }
  };

  return { fotosTomadas, procesando, procesarCaptura, eliminarFoto, guardar };
}