<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import navbar from '../../components/componentes/navbar.vue'
import { useInterfaz } from '../../stores/interfaz.js'
import { supabase } from '../../lib/supabaseClient.js'

const interfaz = useInterfaz()
const route = useRoute()
const router = useRouter()

const cliente = ref(null)
const clienteBackup = ref(null)
const editando = ref(false)
const vehiculos = ref([])
const totalOT = ref(0)
const totalPresupuestos = ref(0)

const camelCase = (texto) => {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

const iniciales = (nombre, apellido) => {
  return ((nombre?.[0] || '') + (apellido?.[0] || '')).toUpperCase()
}

const obtenerCliente = async () => {
  const { data, error } = await supabase
    .from('cliente')
    .select('*')
    .eq('id', route.params.id)
    .single()
  if (error) {
    console.error('Error al obtener cliente:', error)
    return
  }
  cliente.value = data
}

const obtenerVehiculos = async () => {
  const { data, error } = await supabase
    .from('vehiculo')
    .select('*')
    .eq('id_cliente', route.params.id)
  if (error) {
    console.error('Error al obtener vehículos:', error)
    return
  }
  if (data) vehiculos.value = data
}

const contarOT = async () => {
  const { count, error } = await supabase
    .from('orden_trabajo')
    .select('id', { count: 'exact', head: true })
    .eq('cliente_id', route.params.id)
  if (error) {
    console.error('Error al contar OT:', error)
    return
  }
  totalOT.value = count || 0
}

const contarPresupuestos = async () => {
  const { count, error } = await supabase
    .from('presupuesto')
    .select('id', { count: 'exact', head: true })
    .eq('id_cliente', route.params.id)
  if (error) {
    console.error('Error al contar presupuestos:', error)
    return
  }
  totalPresupuestos.value = count || 0
}

const iniciarEdicion = () => {
  clienteBackup.value = JSON.parse(JSON.stringify(cliente.value))
  editando.value = true
}
const cancelarEdicion = () => {
  cliente.value = JSON.parse(JSON.stringify(clienteBackup.value))
  editando.value = false
}
const guardarCliente = async () => {
  const { error } = await supabase
    .from('cliente')
    .update({
      nombre: cliente.value.nombre,
      apellido: cliente.value.apellido,
      email: cliente.value.email,
      telefono: cliente.value.telefono,
    })
    .eq('id', route.params.id)
  if (error) {
    console.error('Error al guardar cliente:', error)
    return
  }
  editando.value = false
}

onMounted(async () => {
  interfaz.showLoading()
  await obtenerCliente()
  await obtenerVehiculos()
  await contarOT()
  await contarPresupuestos()
  interfaz.hideLoading()
})
</script>

<template>
  <navbar class="navbar" titulo="ServiML" subtitulo="Detalle de Cliente" />

  <div v-if="cliente" class="bg-gray-50 min-h-screen pb-24">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 pt-4">

      <!-- Botón volver -->
      <button @click="router.push({ name: 'listado-clientes' })" class="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver al listado
      </button>

      <div class="flex flex-col lg:flex-row gap-6">
        <div class="lg:w-1/3 space-y-6">
          <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="servi-blue p-6 flex flex-col items-center relative">
              <div class="w-20 h-20 rounded-full servi-adapt-bg/20 flex items-center justify-center servi-yellow-font text-2xl font-bold mb-3">
                {{ iniciales(cliente.nombre, cliente.apellido) }}
              </div>
              <h1 class="text-xl font-bold servi-yellow-font text-center">
                {{ camelCase(cliente.nombre) }} {{ camelCase(cliente.apellido) }}
              </h1>
              <!-- Botón editar / guardar / cancelar -->
              <div class="absolute top-4 right-4 flex gap-2">
                <template v-if="!editando">
                  <button @click="iniciarEdicion" class="p-2 servi-adapt-bg/20 hover:servi-adapt-bg/30 rounded-lg transition cursor-pointer" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </template>
                <template v-else>
                  <button @click="guardarCliente" class="p-2 servi-yellow rounded-lg transition cursor-pointer hover:translate-y-1" title="Guardar">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button @click="cancelarEdicion" class="p-2 rounded-lg transition cursor-pointer hover:translate-y-1" title="Cancelar">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </template>
              </div>
            </div>

            <div class="p-6 space-y-4">
              <!-- Nombre -->
              <div class="flex items-start gap-3">
                <div class="p-2 bg-gray-100 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-gray-400 uppercase font-semibold">Nombre</p>
                  <input v-if="editando" v-model="cliente.nombre" type="text" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <p v-else class="text-sm text-gray-800">{{ camelCase(cliente.nombre) || '—' }}</p>
                </div>
              </div>

              <!-- Apellido -->
              <div class="flex items-start gap-3">
                <div class="p-2 bg-gray-100 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-gray-400 uppercase font-semibold">Apellido</p>
                  <input v-if="editando" v-model="cliente.apellido" type="text" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <p v-else class="text-sm text-gray-800">{{ camelCase(cliente.apellido) || '—' }}</p>
                </div>
              </div>

              <!-- Email -->
              <div class="flex items-start gap-3">
                <div class="p-2 bg-blue-50 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-gray-400 uppercase font-semibold">Email</p>
                  <input v-if="editando" v-model="cliente.email" type="email" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <p v-else class="text-sm text-gray-800 break-all">{{ cliente.email || '—' }}</p>
                </div>
              </div>

              <!-- Teléfono -->
              <div class="flex items-start gap-3">
                <div class="p-2 bg-green-50 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-gray-400 uppercase font-semibold">Teléfono</p>
                  <input v-if="editando" v-model="cliente.telefono" type="text" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <p v-else class="text-sm text-gray-800">{{ cliente.telefono ? '+' + (cliente.codigo_pais || '56') + ' ' + cliente.telefono : '—' }}</p>
                </div>
              </div>

              <!-- RUT (solo lectura) -->
              <div v-if="cliente.rut && !editando" class="flex items-start gap-3">
                <div class="p-2 bg-purple-50 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-gray-400 uppercase font-semibold">RUT</p>
                  <p class="text-sm text-gray-800">{{ cliente.rut }}</p>
                </div>
              </div>

              <!-- Dirección (solo lectura) -->
              <div v-if="cliente.direccion && !editando" class="flex items-start gap-3">
                <div class="p-2 bg-orange-50 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-gray-400 uppercase font-semibold">Dirección</p>
                  <p class="text-sm text-gray-800">{{ cliente.direccion }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Estadísticas -->
          <div class="grid grid-cols-2 gap-3">
            <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p class="text-3xl font-bold servi-blue-font">{{ totalOT }}</p>
              <p class="text-xs text-gray-500 mt-1 uppercase font-semibold">Órdenes de Trabajo</p>
            </div>
            <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p class="text-3xl font-bold servi-blue-font">{{ totalPresupuestos }}</p>
              <p class="text-xs text-gray-500 mt-1 uppercase font-semibold">Presupuestos</p>
            </div>
            <div class="col-span-2 servi-adapt-bg rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p class="text-3xl font-bold servi-blue-font">{{ vehiculos.length }}</p>
              <p class="text-xs text-gray-500 mt-1 uppercase font-semibold">Vehículos Registrados</p>
            </div>
          </div>
        </div>

        <!-- Columna derecha: Vehículos -->
        <div class="lg:w-2/3">
          <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h2 class="font-bold text-gray-900">Vehículos del Cliente</h2>
              <span class="text-xs text-gray-400 font-semibold">{{ vehiculos.length }} registrado{{ vehiculos.length !== 1 ? 's' : '' }}</span>
            </div>

            <!-- Tabla (desktop) -->
            <div class="hidden md:block overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patente</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Marca</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Modelo</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody class="servi-adapt-bg divide-y divide-gray-200">
                  <tr
                    v-for="v in vehiculos"
                    :key="v.id"
                    class="hover:bg-gray-50 transition-colors cursor-pointer"
                    @click="router.push({ name: 'ver-vehiculo', params: { id: v.id } })"
                  >
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 bg-yellow-100 text-yellow-800 font-bold rounded text-xs">{{ v.patente || 'S/P' }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">{{ v.marca || '—' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-gray-600">{{ v.modelo || '—' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span v-if="v.en_taller" class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">En taller</span>
                      <span v-else class="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">Fuera</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Cards (mobile) -->
            <div class="md:hidden divide-y divide-gray-100">
              <div
                v-for="v in vehiculos"
                :key="v.id"
                class="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                @click="router.push({ name: 'ver-vehiculo', params: { id: v.id } })"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="px-2 py-1 bg-yellow-100 text-yellow-800 font-bold rounded text-xs">{{ v.patente || 'S/P' }}</span>
                  <span v-if="v.en_taller" class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">En taller</span>
                  <span v-else class="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">Fuera</span>
                </div>
                <p class="font-semibold text-gray-900 text-sm">{{ v.marca || '—' }} {{ v.modelo || '—' }}</p>
              </div>
            </div>

            <div v-if="vehiculos.length === 0" class="p-10 text-center">
              <p class="text-gray-500 font-medium">No hay vehículos registrados para este cliente</p>
            </div>
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