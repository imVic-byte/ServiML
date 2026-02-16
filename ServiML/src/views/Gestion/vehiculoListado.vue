<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import navbar from '../../components/componentes/navbar.vue'
import { useInterfaz } from '../../stores/interfaz.js'
import { supabase } from '../../lib/supabaseClient.js'

const router = useRouter()
const interfaz = useInterfaz()
const vehiculos = ref([])
const busqueda = ref('')

const vehiculosFiltrados = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  if (!q) return vehiculos.value
  return vehiculos.value.filter(v =>
    (v.patente || '').toLowerCase().includes(q) ||
    (v.marca || '').toLowerCase().includes(q) ||
    (v.modelo || '').toLowerCase().includes(q) ||
    (v.cliente_nombre || '').toLowerCase().includes(q)
  )
})

const obtenerVehiculos = async () => {
  const { data, error } = await supabase
    .from('vehiculo')
    .select('*, cliente(nombre, apellido)')
    .order('patente', { ascending: true })
  if (error) {
    console.error('Error al obtener vehículos:', error)
    return
  }
  if (data) {
    vehiculos.value = data.map(v => ({
      ...v,
      cliente_nombre: v.cliente ? (v.cliente.nombre + ' ' + v.cliente.apellido) : ''
    }))
  }
}

const camelCase = (texto) => {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

const verVehiculo = (id) => {
  router.push({ name: 'ver-vehiculo', params: { id } })
}

onMounted(async () => {
  interfaz.showLoading()
  await obtenerVehiculos()
  interfaz.hideLoading()
})
</script>

<template>
  <div class="servi-white min-h-screen">
    <navbar class="navbar" titulo="ServiML" subtitulo="Vehículos" />

    <div class="servi-white min-h-screen pb-24">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-4">

      <!-- Header -->
      <div class="mb-6 hidden sm:block">
        <h1 class="text-2xl font-bold servi-grey-font">Listado de Vehículos</h1>
        <p class="text-sm servi-grey-font mt-1">{{ vehiculos.length }} vehículos registrados</p>
      </div>

      <!-- Buscador -->
      <div class="mb-5">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 servi-grey-font" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar por patente, marca, modelo o dueño..."
            class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-800 servi-adapt-bg servi-grey-font text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      <!-- Tabla (pantallas grandes) -->
      <div class="hidden md:block servi-adapt-bg rounded-xl shadow-sm border border-gray-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="servi-blue servi-yellow-font">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Patente</th>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Marca</th>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Modelo</th>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Dueño</th>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Estado</th>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="servi-adapt-bg divide-y divide-gray-100">
              <tr v-for="v in vehiculosFiltrados" :key="v.id" class="hover:opacity-80 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-yellow-100 text-yellow-800 font-bold rounded text-xs">{{ v.patente || 'S/P' }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap servi-grey-font font-medium">{{ v.marca || '—' }}</td>
                <td class="px-6 py-4 whitespace-nowrap servi-grey-font">{{ v.modelo || '—' }}</td>
                <td class="px-6 py-4 whitespace-nowrap servi-grey-font max-w-[150px] truncate">{{ camelCase(v.cliente?.nombre) }} {{ camelCase(v.cliente?.apellido) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span v-if="v.en_taller" class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">En taller</span>
                  <span v-else class="px-2 py-1 servi-adapt-bg servi-grey-font rounded-full text-xs font-semibold">Fuera</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <button @click="verVehiculo(v.id)" class="servi-blue servi-yellow-font px-2 py-1 rounded-full hover:opacity-90 transition cursor-pointer">
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="vehiculosFiltrados.length === 0" class="p-10 text-center">
          <p class="servi-grey-font font-medium">{{ busqueda ? 'No se encontraron resultados' : 'No hay vehículos registrados' }}</p>
        </div>
      </div>

      <!-- Cards (pantallas pequeñas) -->
      <div class="md:hidden space-y-3">
        <div
          v-for="v in vehiculosFiltrados"
          :key="v.id"
          class="servi-adapt-bg rounded-xl shadow-sm border border-gray-800 p-4 cursor-pointer"
          @click="verVehiculo(v.id)"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="px-2 py-1 bg-yellow-100 text-yellow-800 font-bold rounded text-xs">{{ v.patente || 'S/P' }}</span>
            <span v-if="v.en_taller" class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">En taller</span>
            <span v-else class="px-2 py-1 servi-adapt-bg servi-grey-font rounded-full text-xs font-semibold">Fuera</span>
          </div>
          <p class="font-semibold servi-grey-font text-sm">{{ v.marca || '—' }} {{ v.modelo || '—' }}</p>
          <div class="space-y-1 text-sm mt-2 border-t border-gray-800 pt-2">
            <div class="flex items-center gap-2 servi-grey-font">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 servi-grey-font shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="truncate">{{ camelCase(v.cliente?.nombre) }} {{ camelCase(v.cliente?.apellido) || '—' }}</span>
            </div>
          </div>
          <button class="servi-blue mt-2 w-full servi-grey-font px-2 py-1 rounded-xl hover:opacity-90 transition">
            Ver Vehículo
          </button>
        </div>
        <div v-if="vehiculosFiltrados.length === 0" class="servi-adapt-bg rounded-xl shadow-sm border border-gray-800 p-10 text-center">
          <p class="servi-grey-font font-medium">{{ busqueda ? 'No se encontraron resultados' : 'No hay vehículos registrados' }}</p>
        </div>
      </div>

    </div>
  </div>
</div>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 40;
}
</style>