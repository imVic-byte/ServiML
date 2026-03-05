<script setup>
import { ref, defineEmits } from 'vue'

const emit = defineEmits(['update'])

const archivosSeleccionados = ref([])

const manejarSubida = (event) => {
  const nuevosArchivos = Array.from(event.target.files)
  archivosSeleccionados.value = [...archivosSeleccionados.value, ...nuevosArchivos]
  emit('update', archivosSeleccionados.value)
}

const eliminarArchivo = (index) => {
  archivosSeleccionados.value.splice(index, 1)
  emit('update', archivosSeleccionados.value)
}
</script>
<template>
  <div class="space-y-2 px-6">
    <label class="block text-sm font-bold servi-grey-font">Documentos Adjuntos (Opcionales)</label>
    
    <div class="flex items-center justify-center w-full">
      <label for="subir-archivo" class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-100 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors servi-adapt-bg">
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <svg aria-hidden="true" class="w-8 h-8 mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p class="mb-2 text-sm servi-grey-font"><span class="font-bold">Haz clic para subir</span> o arrastra y suelta los documentos</p>
          <p class="text-xs servi-grey-font">PDF, JPG, PNG o Excel</p>
        </div>
        <input id="subir-archivo" type="file" multiple class="hidden" @change="manejarSubida" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv" />
      </label>
    </div>

    <div v-if="archivosSeleccionados.length > 0" class="mt-4 space-y-2">
      <p class="text-sm font-bold servi-grey-font">Archivos seleccionados:</p>
      <ul class="space-y-1">
        <li v-for="(archivo, index) in archivosSeleccionados" :key="index" class="flex items-center justify-between bg-white border border-gray-200 p-2 rounded text-sm">
          <span class="truncate pr-4 text-gray-600">{{ archivo.name }}</span>
          <button @click="eliminarArchivo(index)" type="button" class="text-red-500 hover:text-red-700 font-bold px-2">
            X
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>