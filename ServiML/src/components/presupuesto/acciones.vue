<script setup>
import { ref } from 'vue'

const confirm = ref(false)
const discard = ref(false)

const emit = defineEmits(['descartar', 'confirmar'])

const ejecutarConfirmacion = () => {
  emit('confirmar')
  confirm.value = false
}

const ejecutarDescarte = () => {
  emit('descartar')
  discard.value = false
}
</script>

<template>
  <div class="flex gap-4">
    <button @click="confirm = true" class="servi-blue px-4 py-2 rounded servi-white-font cursor-pointer hover:scale-105 transition-all">
      Confirmar
    </button>

    <button @click="discard = true" class="bg-red-800 px-4 py-2 rounded servi-white-font cursor-pointer hover:scale-105 transition-all">
      Descartar
    </button>
  </div>

  <div v-if="confirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div class="relative w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
      <h3 class="mb-5 text-lg font-normal servi-blue-font">¿Estás seguro de confirmar el presupuesto?</h3>
      <div class="flex justify-center gap-3">
        <button @click="ejecutarConfirmacion" class="servi-blue px-4 py-2 rounded servi-white-font cursor-pointer hover:scale-105 transition-all">
          Sí, confirmar
        </button>
        <button @click="confirm = false" class="bg-gray-500 px-4 py-2 rounded servi-white-font cursor-pointer hover:scale-105 transition-all">
          Cancelar
        </button>
      </div>
    </div>
  </div>

  <div v-if="discard" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div class="relative w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
      <h3 class="mb-5 text-lg font-normal servi-blue-font">¿Estás seguro de descartar el presupuesto?</h3>
      <div class="flex justify-center gap-3">
        <button @click="ejecutarDescarte" class="bg-red-800 px-4 py-2 rounded servi-white-font cursor-pointer hover:scale-105 transition-all">
          Sí, descartar
        </button>
        <button @click="discard = false" class="bg-gray-500 px-4 py-2 rounded servi-white-font cursor-pointer hover:scale-105 transition-all">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>