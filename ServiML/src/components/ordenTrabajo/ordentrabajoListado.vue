<script setup>
import Fila from './Fila.vue'
import {ref, watch} from 'vue'
const props = defineProps({
    ordenes: {
        type: Array,
        required: true
    },
    estados: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(['actualizar'])

const ordenesListado = ref(props.ordenes)
const handleEstados = (id) => {
    if(id === 9 ) {
        return { estado: 'Estacionado', color: '#9966ff'}
    }
    if(id === 4) {
        return { estado: 'Repuesto', color: '#FAF17F'}
    }
  return props.estados.find((estado) => estado.id === id) || { estado: 'Desconocido', color: '#9966ff' };
} 

watch(() => props.ordenes, (nuevoValor) => {
    ordenesListado.value = nuevoValor;
})
</script>
<template>
    <div class="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="servi-blue servi-yellow-font text-xs uppercase tracking-wider border-b border-gray-100">
                    <th class="p-4 font-semibold">Nro.</th>
                    <th class="p-4 font-semibold">Vehículo</th>
                    <th class="p-4 font-semibold">Diágnostico inicial</th>
                    <th class="p-4 font-semibold text-center">Ingreso</th>
                    <th class="p-4 font-semibold text-center">Estado Actual</th>
                    <th class="p-4 font-semibold text-center">Encargado</th>
                    <th class="p-4 font-semibold text-center">Acción</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                <Fila 
                    v-for="orden in ordenesListado" 
                    :key="orden.id" 
                    :orden="orden"
                    :estado="handleEstados(orden.estado_actual_id)"
                    @asignacion-exitosa="$emit('actualizar')"
                />
            </tbody>
        </table>
        <div v-if="ordenesListado.length === 0" class="bg-white rounded-xl p-10 text-center shadow-sm border border-gray-100">
        <div class="text-gray-400 mb-2">
          <p class="text-gray-500 text-lg">No se encontraron ordenes de trabajo</p>
          <p class="text-sm text-gray-400">Intenta cambiar el filtro de búsqueda o crea uno nuevo.</p>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
  </div>
</template>