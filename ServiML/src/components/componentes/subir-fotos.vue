<script setup>
import { ref} from 'vue';
import { useRoute } from 'vue-router'
import { comprimirImagen } from '../../js/comprimirFotos';
import { subirFotos } from '../../js/subirFotos';
const fotosTomadas = ref([]);
const idOrden = ref(useRoute().params.id)
const inputCamara = ref(null);

const emit = defineEmits(['loading','completado']);

const activarCamara = () => {
  inputCamara.value.click();
};
const procesarCaptura = async (event) => {
  const archivo = event.target.files[0];
  if (!archivo) return;

  emit('loading', true);

  try {
    const archivoComprimido = await comprimirImagen(archivo);
    
    fotosTomadas.value.push({
      file: archivoComprimido, 
      url: URL.createObjectURL(archivoComprimido), 
      nombre: archivo.name
    });
    emit('completado', fotosTomadas.value);
  } catch (error) {
    console.error("Error al procesar foto:", error);
    alert("Hubo un error al procesar la imagen.");
  } finally {
    event.target.value = ''; 
  }
};

const eliminarFoto = (index) => {
  URL.revokeObjectURL(fotosTomadas.value[index].url);
  URL.revokeObjectURL(fotosTomadas.value[index].url);
  fotosTomadas.value.splice(index, 1);
};

const guardarFotos = async () => {
  if (fotosTomadas.value.length === 0) {
    alert('No hay fotos para subir')
    return
  }
  try {
    const resultado = await subirFotos(idOrden.value, fotosTomadas.value)
    
    if (resultado.exito) {
      alert('Fotos subidas correctamente')
    } else {
      alert('Hubo un error al subir las fotos')
    }
    recargarTodo()
  } catch (error) {
    console.error("Error al subir fotos:", error);
    alert("Hubo un error al subir las fotos.");
  } finally {
  }
}

const obtenerFotos = () => {
  return fotosTomadas.value.map(f => f.file);
};

defineExpose({ obtenerFotos });
</script>
<template>
  <div class="servi-yellow-font servi-blue p-5 rounded-xl space-y-4">
      <div v-if="fotosTomadas.length > 0" class="grid grid-cols-2 gap-3">
        <div v-for="(foto, index) in fotosTomadas" :key="index" class="relative group ">
          
          <img 
            :src="foto.url" 
            class="w-full h-32 object-cover rounded-lg border-2 servi-yellow-border shadow-sm"
          />
          
          <button 
            @click="eliminarFoto(index)"
            type="button"
            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md z-10"
          >
            ✕
          </button>
          
          <span class="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
            {{ (foto.file.size / 1024).toFixed(0) }} KB
          </span>
        </div>
    </div>    
    <button 
      @click="activarCamara"
      type="button"
      class="w-full servi-yellow servi-blue-font text-white p-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-transform transform active:scale-95"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span class="text-lg font-bold">Tomar Foto</span>
    </button>
    <button @click="guardarFotos" class="w-full text-lg font-bold servi-yellow servi-blue-font text-white p-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-transform transform active:scale-95">
      Guardar
    </button>
    <input 
      ref="inputCamara"
      type="file" 
      accept="image/*" 
      capture="environment"
      class="hidden"
      @change="procesarCaptura"
    />
  </div>
</template>
