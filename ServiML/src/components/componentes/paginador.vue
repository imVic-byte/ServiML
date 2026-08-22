<script setup>
import { computed } from 'vue';

const props = defineProps({
  paginaActual: {
    type: Number,
    default: 1
  },
  totalItems: {
    type: Number,
    required: true
  },
  itemsPorPagina: {
    type: Number,
    default: 10
  }
});

const emit = defineEmits(['update:paginaActual', 'cambiarPagina']);

const totalPaginas = computed(() => Math.max(1, Math.ceil(props.totalItems / props.itemsPorPagina)));

const cambiarPagina = (nuevaPagina) => {
  if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas.value && nuevaPagina !== props.paginaActual) {
    emit('update:paginaActual', nuevaPagina);
    emit('cambiarPagina', nuevaPagina);
  }
};
</script>

<template>
  <div v-if="totalPaginas > 1" class="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 px-2 mt-4 border-t border-gray-100 servi-grey-font">
    <span class="text-sm">
      Mostrando página <span class="font-bold">{{ paginaActual }}</span> de <span class="font-bold">{{ totalPaginas }}</span> ({{ totalItems }} registros)
    </span>
    
    <div class="flex items-center gap-2">
      <button 
        @click="cambiarPagina(paginaActual - 1)" 
        :disabled="paginaActual === 1"
        class="px-3 py-1.5 rounded-lg border border-gray-200 servi-adapt-bg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Anterior</span>
      </button>

      <span class="px-3 py-1.5 text-sm font-semibold">
        {{ paginaActual }} / {{ totalPaginas }}
      </span>

      <button 
        @click="cambiarPagina(paginaActual + 1)" 
        :disabled="paginaActual === totalPaginas"
        class="px-3 py-1.5 rounded-lg border border-gray-200 servi-adapt-bg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center gap-1"
      >
        <span>Siguiente</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
</style>
