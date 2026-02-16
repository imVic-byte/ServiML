<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const props = defineProps({
  servicios: {
    type: Array,
    required: true
  }
})

const irADetalle = (id) => {
  router.push({ name: 'ver-presupuesto', params: { id: id } })
}

const formatearFecha = (fechaString) => {
  if (!fechaString) return '---'
  const fecha = new Date(fechaString)
  return fecha.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })
}

const formatearDinero = (monto) => {
  if (!monto) return '$0'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto)
}

const camelCase = (texto) => {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

const claseEstado = (estado) => {
  switch (estado) {
    case 2: return {clase: 'bg-green-100 text-green-800 border-green-200', texto: 'Confirmado'}
    case 3: return {clase: 'bg-red-100 text-red-800 border-red-200', texto: 'Descartado'}
    case 1: return {clase: 'bg-yellow-100 text-yellow-800 border-yellow-200', texto: 'En espera'}
    default: return {clase: 'bg-gray-100 text-gray-800 border-gray-200', texto: 'Cerrado'}
  }
}
</script>

<template>
  <div class="hidden md:block servi-adapt-bg rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="servi-blue servi-yellow-font text-xs uppercase tracking-wider border-b border-gray-100">
          <th class="p-4 font-semibold">Folio</th>
          <th class="p-4 font-semibold">Cliente</th>
          <th class="p-4 font-semibold">Vehículo</th>
          <th class="p-4 font-semibold">Diagnóstico</th>
          <th class="p-4 font-semibold text-center">Emisión</th>
          <th class="p-4 font-semibold text-right">Monto Total</th>
          <th class="p-4 font-semibold text-center">Estado</th>
          <th class="p-4 font-semibold text-center">Vencimiento</th>
          <th class="p-4 font-semibold text-center">Acción</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="item in servicios" :key="item.id" class="hover:bg-gray-50 transition-colors cursor-pointer"
          @click="irADetalle(item.id)">
          <td class="p-4 font-medium text-gray-900">#{{ item.numero_folio }}</td>
          <td class="p-4 text-gray-700">
            <div class="font-medium">{{ camelCase(item.cliente?.nombre) }} {{ camelCase(item.cliente?.apellido) }}</div>
            <div class="text-xs text-gray-400">{{ item.cliente?.email }}</div>
          </td>
          <td class="p-4 text-gray-700">
            <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold">{{ item.vehiculo?.patente
              }}</span>
            <div class="text-xs text-gray-500 mt-1">{{ item.vehiculo?.marca }} {{ item.vehiculo?.modelo }}</div>
          </td>
          <td class="p-4 text-gray-700">
            <span class="block max-w-[200px] truncate" :title="item.diagnostico">{{ camelCase(item.diagnostico)
              }}</span>
          </td>
          <td class="p-4 text-center whitespace-nowrap">
            <span class="text-gray-400">{{ formatearFecha(item.created_at) }}</span>
          </td>
          <td class="p-4 text-right font-bold servi-blue-font">
            {{ formatearDinero(item.total_final) }}
          </td>
          <td class="p-4 text-center">
            <span :class="['px-3 py-1 rounded-full text-xs font-medium border', claseEstado(item.estado).clase]">
              {{ claseEstado(item.estado).texto }}
            </span>
          </td>
          <td class="p-4 text-center">
            <span v-if="item.estado === 1" class="text-gray-400 hover:text-blue-600 transition-colors">
              {{ formatearFecha(item.vencimiento) }}
            </span>
            <span v-else class="text-gray-400 hover:text-blue-600 transition-colors">
              ---
            </span>
          </td>
          <td class="p-4 text-center">
            <button class="text-gray-400 hover:text-blue-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="servicios.length === 0" class="servi-adapt-bg rounded-xl p-10 text-center shadow-sm border border-gray-100">
        <div class="text-gray-400 mb-2">
          <p class="text-gray-500 text-lg">No se encontraron presupuestos</p>
          <p class="text-sm text-gray-400">Intenta cambiar el filtro de búsqueda o crea uno nuevo.</p>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
  </div>
</template>