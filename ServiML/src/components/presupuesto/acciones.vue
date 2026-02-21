<script setup>
import { ref, computed } from 'vue'

const confirm = ref(false)
const discard = ref(false)

const emit = defineEmits(['descartar', 'confirmar', 'pdf', 'ir-a-ot', 'confirmar-editar', 'descartar-editar'])

const ejecutarConfirmacion = () => {
  emit('confirmar')
  confirm.value = false
}

const ejecutarIrAOT = () => {
  emit('ir-a-ot')
}

const ejecutarDescarte = () => {
  emit('descartar')
  discard.value = false
}

const ejecutarPdf = () => {
  emit('pdf')
}

const editarPresupuesto = () => {
  emit('editar')
}

const ejecutarConfirmacionEdit = () => {
  emit('confirmar-editar')
}

const ejecutarDescarteEdit = () => {
  emit('descartar-editar')
}

const props = defineProps({
    estado: Number,
    editado: Boolean
})

const showButtons = computed(() => {
    return props.estado === 1
})

const ShowOt = computed(() => {
    return props.estado === 2
})

</script>

<template>
  <div class="flex flex-col gap-4 justify-center">
    <button v-if="showButtons && !editado" @click="confirm = true" class="servi-blue px-4 py-2 rounded-lg text-white cursor-pointer hover:scale-105 transition-all">
      <p>Confirmar</p>
    </button>

    <button v-if="showButtons && !editado" @click="discard = true" class="bg-red-800 px-4 py-2 rounded-lg text-white cursor-pointer hover:scale-105 transition-all">
      <p>Descartar</p>
    </button>
    
    <button v-if="editado" @click="ejecutarConfirmacionEdit" class="servi-blue px-4 py-2 rounded-lg text-white cursor-pointer hover:scale-105 transition-all">
      <p>Confirmar</p>
    </button>
    <button v-if="editado" @click="ejecutarDescarteEdit" class="bg-red-800 px-4 py-2 rounded-lg text-white cursor-pointer hover:scale-105 transition-all">
      <p>Descartar</p>
    </button>

    <button @click="ejecutarPdf" class="servi-yellow px-4 py-2 rounded-lg text-white cursor-pointer hover:scale-105 transition-all">
      PDF
    </button>
    <button v-if="ShowOt" @click="ejecutarIrAOT" class="servi-yellow px-4 py-2 rounded-lg text-white cursor-pointer hover:scale-105 transition-all">
      Ir a OT 
    </button>
    <button v-if="ShowOt" @click="editarPresupuesto" class="servi-yellow px-4 py-2 rounded-lg text-white cursor-pointer hover:scale-105 transition-all flex items-center gap-2 justify-center">
      <svg class="w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
        <path fill-rule="evenodd" d="M11.32 6.176H5c-1.105 0-2 .949-2 2.118v10.588C3 20.052 3.895 21 5 21h11c1.105 0 2-.948 2-2.118v-7.75l-3.914 4.144A2.46 2.46 0 0 1 12.81 16l-2.681.568c-1.75.37-3.292-1.263-2.942-3.115l.536-2.839c.097-.512.335-.983.684-1.352l2.914-3.086Z" clip-rule="evenodd"/>
        <path fill-rule="evenodd" d="M19.846 4.318a2.148 2.148 0 0 0-.437-.692 2.014 2.014 0 0 0-.654-.463 1.92 1.92 0 0 0-1.544 0 2.014 2.014 0 0 0-.654.463l-.546.578 2.852 3.02.546-.579a2.14 2.14 0 0 0 .437-.692 2.244 2.244 0 0 0 0-1.635ZM17.45 8.721 14.597 5.7 9.82 10.76a.54.54 0 0 0-.137.27l-.536 2.84c-.07.37.239.696.588.622l2.682-.567a.492.492 0 0 0 .255-.145l4.778-5.06Z" clip-rule="evenodd"/>
      </svg>
      <p>Editar</p>
    </button>
  </div>

  <div v-if="confirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div class="relative w-full max-w-md servi-adapt-bg rounded-lg shadow p-6 text-center">
      <h3 class="mb-5 text-lg font-normal servi-grey-font">¿Estás seguro de confirmar el presupuesto?</h3>
      <div class="flex justify-center gap-3">
        <button @click="ejecutarConfirmacion" class="servi-blue px-4 py-2 rounded text-white cursor-pointer hover:scale-105 transition-all">
          Sí, confirmar
        </button>
        <button @click="confirm = false" class="bg-gray-500 px-4 py-2 rounded text-white cursor-pointer hover:scale-105 transition-all">
          Cancelar
        </button>
      </div>
    </div>
  </div>

  <div v-if="discard" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div class="relative w-full max-w-md servi-adapt-bg rounded-lg shadow p-6 text-center">
      <h3 class="mb-5 text-lg font-normal servi-grey-font">¿Estás seguro de descartar el presupuesto?</h3>
      <div class="flex justify-center gap-3">
        <button @click="ejecutarDescarte" class="bg-red-800 px-4 py-2 rounded text-white cursor-pointer hover:scale-105 transition-all">
          Sí, descartar
        </button>
        <button @click="discard = false" class="bg-gray-500 px-4 py-2 rounded text-white cursor-pointer hover:scale-105 transition-all">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>