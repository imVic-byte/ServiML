<script setup>
import { ref, computed, onMounted } from 'vue'
import navbar from '../../components/componentes/navbar.vue'
import { useInterfaz } from '../../stores/interfaz.js'
import { supabase } from '../../lib/supabaseClient.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const interfaz = useInterfaz()
const clientes = ref([])
const busqueda = ref('')

const clientesFiltrados = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  if (!q) return clientes.value
  return clientes.value.filter(c =>
    (c.nombre + ' ' + c.apellido).toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q) ||
    (c.telefono || '').includes(q)
  )
})

const obtenerClientes = async () => {
  const { data, error } = await supabase
    .from('cliente')
    .select('*')
    .order('nombre', { ascending: true })
  if (error) {
    console.error('Error al obtener clientes:', error)
    return
  }
  if (data) clientes.value = data
}

const iniciales = (nombre, apellido) => {
  return ((nombre?.[0] || '') + (apellido?.[0] || '')).toUpperCase()
}

const camelCase = (texto) => {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

const verCliente = (id) => {
  router.push({ name: 'ver-cliente', params: { id } })
}

onMounted(async () => {
  interfaz.showLoading()
  await obtenerClientes()
  interfaz.hideLoading()
})
</script>

<template>
  <navbar class="navbar" titulo="ServiML" subtitulo="Clientes" />

  <div class="bg-gray-50 min-h-screen pb-24">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-4">

      <!-- Header -->
      <div class="mb-6 hidden sm:block">
        <h1 class="text-2xl font-bold text-gray-900">Listado de Clientes</h1>
        <p class="text-sm text-gray-500 mt-1">{{ clientes.length }} clientes registrados</p>
      </div>

      <!-- Buscador -->
      <div class="mb-5">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 servi-adapt-bg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      <!-- Tabla (pantallas grandes) -->
      <div class="hidden md:block servi-adapt-bg rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="servi-blue servi-yellow-font">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibol uppercase tracking-wider">Cliente</th>
                <th class="px-6 py-3 text-left text-xs font-semibol uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-semibol uppercase tracking-wider">Teléfono</th>
                <th class="px-6 py-3 text-left text-xs font-semibol uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="servi-adapt-bg divide-y divide-gray-200">
              <tr v-for="cliente in clientesFiltrados" :key="cliente.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full servi-blue flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {{ iniciales(cliente.nombre, cliente.apellido) }}
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">{{ camelCase(cliente.nombre) }} {{ camelCase(cliente.apellido) }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-600">{{ cliente.email || '—' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-600">
                  <span v-if="cliente.telefono">+{{ cliente.codigo_pais || '56' }} {{ cliente.telefono }}</span>
                  <span v-else>—</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-600">
                  <button @click="verCliente(cliente.id)" class="servi-blue servi-yellow-font px-2 py-1 rounded-full hover:bg-gray-100 transition-colors">
                    <svg class="w-6 h-6 servi-yellow-font" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="clientesFiltrados.length === 0" class="p-10 text-center">
          <p class="text-gray-500 font-medium">{{ busqueda ? 'No se encontraron resultados' : 'No hay clientes registrados' }}</p>
        </div>
      </div>

      <!-- Cards (pantallas pequeñas) -->
      <div class="md:hidden space-y-3">
        <div
          v-for="cliente in clientesFiltrados"
          :key="cliente.id"
          class="servi-adapt-bg rounded-xl shadow-sm border border-gray-200 p-4"
          @click="verCliente(cliente.id)"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full servi-blue flex items-center justify-center text-white text-sm font-bold shrink-0">
              {{ iniciales(cliente.nombre, cliente.apellido) }}
            </div>
            <div class="min-w-0">
              <p class="font-bold text-gray-900 text-sm truncate">{{ camelCase(cliente.nombre) }} {{ camelCase(cliente.apellido) }}</p>
            </div>
          </div>
          <div class="space-y-1.5 text-sm border-b border-gray-200 pb-2">
            <div class="flex items-center gap-2 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span class="truncate">{{ cliente.email || '—' }}</span>
            </div>
            <div class="flex items-center gap-2 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span v-if="cliente.telefono">+{{ cliente.codigo_pais || '56' }} {{ cliente.telefono }}</span>
              <span v-else>—</span>
            </div>
          </div>
          <button @click="verCliente(cliente.id)" class="servi-blue mt-2 w-full servi-white-font px-2 py-1 rounded-xl hover:bg-gray-100 transition-colors">
            Ver Cliente
          </button>
        </div>
        <div v-if="clientesFiltrados.length === 0" class="servi-adapt-bg rounded-xl shadow-sm border border-gray-200 p-10 text-center">
          <p class="text-gray-500 font-medium">{{ busqueda ? 'No se encontraron resultados' : 'No hay clientes registrados' }}</p>
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