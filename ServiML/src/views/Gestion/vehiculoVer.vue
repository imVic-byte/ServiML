<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import navbar from '../../components/componentes/navbar.vue'
import { useInterfaz } from '../../stores/interfaz.js'
import { supabase } from '../../lib/supabaseClient.js'

const interfaz = useInterfaz()
const route = useRoute()
const router = useRouter()

const vehiculo = ref(null)
const vehiculoBackup = ref(null)
const editando = ref(false)
const totalOT = ref(0)
const totalPresupuestos = ref(0)

const camelCase = (texto) => {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

const obtenerVehiculo = async () => {
  const { data, error } = await supabase
    .from('vehiculo')
    .select('*, cliente(id, nombre, apellido, email, telefono, codigo_pais)')
    .eq('id', route.params.id)
    .single()
  if (error) {
    console.error('Error al obtener vehículo:', error)
    return
  }
  vehiculo.value = data
}

const contarOT = async () => {
  const { count, error } = await supabase
    .from('orden_trabajo')
    .select('id', { count: 'exact', head: true })
    .eq('id_vehiculo', route.params.id)
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
    .eq('id_vehiculo', route.params.id)
  if (error) {
    console.error('Error al contar presupuestos:', error)
    return
  }
  totalPresupuestos.value = count || 0
}

const iniciarEdicion = () => {
  vehiculoBackup.value = JSON.parse(JSON.stringify(vehiculo.value))
  editando.value = true
}
const cancelarEdicion = () => {
  vehiculo.value = JSON.parse(JSON.stringify(vehiculoBackup.value))
  editando.value = false
}
const guardarVehiculo = async () => {
  const { error } = await supabase
    .from('vehiculo')
    .update({
      patente: vehiculo.value.patente,
      marca: vehiculo.value.marca,
      modelo: vehiculo.value.modelo,
    })
    .eq('id', route.params.id)
  if (error) {
    console.error('Error al guardar vehículo:', error)
    return
  }
  editando.value = false
}

onMounted(async () => {
  interfaz.showLoading()
  await obtenerVehiculo()
  await contarOT()
  await contarPresupuestos()
  interfaz.hideLoading()
})
</script>

<template>
  <div class="servi-white min-h-screen">
    <navbar class="navbar" titulo="ServiML" subtitulo="Detalle de Vehículo" />

    <div v-if="vehiculo" class="servi-white min-h-screen pb-24">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 pt-4">

      <!-- Botón volver -->
      <button @click="router.push({ name: 'listado-vehiculos' })" class="mb-4 flex items-center gap-1 text-sm servi-grey-font hover:opacity-80 transition cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver al listado
      </button>

      <div class="flex flex-col lg:flex-row gap-6">

        <!-- Columna izquierda: Info del vehículo -->
        <div class="lg:w-1/3 space-y-6">
          <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-800 overflow-hidden">
            <div class="servi-blue p-6 flex flex-col items-center relative">
              <!-- Icono auto -->
              <div class="w-20 h-20 rounded-full servi-white flex items-center justify-center servi-yellow-font mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.4L21 11M3 11v6a1 1 0 001 1h1a2 2 0 104 0h6a2 2 0 104 0h1a1 1 0 001-1v-6M3 11h18" />
                </svg>
              </div>
              <h1 class="text-xl font-bold servi-yellow-font text-center">
                {{ vehiculo.marca || '—' }} {{ vehiculo.modelo || '—' }}
              </h1>
              <span v-if="vehiculo.patente" class="mt-2 px-3 py-1 bg-yellow-400 text-yellow-900 font-bold rounded text-sm">
                {{ vehiculo.patente }}
              </span>

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
                  <button @click="guardarVehiculo" class="p-2 servi-yellow rounded-lg transition cursor-pointer hover:translate-y-1" title="Guardar">
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
              <!-- Patente -->
              <div class="flex items-start gap-3">
                <div class="p-2 bg-yellow-50 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="text-xs servi-grey-font uppercase font-semibold">Patente</p>
                  <input v-if="editando" v-model="vehiculo.patente" type="text" class="mt-1 block w-full rounded-lg border border-gray-800 servi-adapt-bg servi-white-font px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase" />
                  <p v-else class="text-sm servi-white-font font-bold">{{ vehiculo.patente || '—' }}</p>
                </div>
              </div>

              <!-- Marca -->
              <div class="flex items-start gap-3">
                <div class="p-2 bg-blue-50 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="text-xs servi-grey-font uppercase font-semibold">Marca</p>
                  <input v-if="editando" v-model="vehiculo.marca" type="text" class="mt-1 block w-full rounded-lg border border-gray-800 servi-adapt-bg servi-white-font px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <p v-else class="text-sm servi-white-font">{{ vehiculo.marca || '—' }}</p>
                </div>
              </div>

              <!-- Modelo -->
              <div class="flex items-start gap-3">
                <div class="p-2 bg-purple-50 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="text-xs servi-grey-font uppercase font-semibold">Modelo</p>
                  <input v-if="editando" v-model="vehiculo.modelo" type="text" class="mt-1 block w-full rounded-lg border border-gray-800 servi-adapt-bg servi-white-font px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <p v-else class="text-sm servi-white-font">{{ vehiculo.modelo || '—' }}</p>
                </div>
              </div>

              <!-- Estado -->
              <div v-if="!editando" class="flex items-start gap-3">
                <div class="p-2 bg-green-50 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs servi-grey-font uppercase font-semibold">Estado</p>
                  <span v-if="vehiculo.en_taller" class="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">En taller</span>
                  <span v-else class="inline-block mt-1 px-2 py-1 servi-adapt-bg servi-grey-font rounded-full text-xs font-semibold">Fuera del taller</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Estadísticas -->
          <div class="grid grid-cols-2 gap-3">
            <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-800 p-4 text-center">
              <p class="text-3xl font-bold servi-grey-font">{{ totalOT }}</p>
              <p class="text-xs servi-grey-font mt-1 uppercase font-semibold">Órdenes de Trabajo</p>
            </div>
            <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-800 p-4 text-center">
              <p class="text-3xl font-bold servi-grey-font">{{ totalPresupuestos }}</p>
              <p class="text-xs servi-grey-font mt-1 uppercase font-semibold">Presupuestos</p>
            </div>
          </div>
        </div>

        <!-- Columna derecha: Dueño -->
        <div class="lg:w-2/3">
          <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-800 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-800 servi-blue">
              <h2 class="font-bold servi-white-font">Propietario</h2>
            </div>

            <div v-if="vehiculo.cliente" class="p-6">
              <div
                class="flex items-center gap-4 p-4 rounded-xl border border-gray-800 hover:opacity-80 transition cursor-pointer"
                @click="router.push({ name: 'ver-cliente', params: { id: vehiculo.cliente.id } })"
              >
                <div class="w-14 h-14 rounded-full servi-blue flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {{ ((vehiculo.cliente.nombre?.[0] || '') + (vehiculo.cliente.apellido?.[0] || '')).toUpperCase() }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-bold servi-white-font">{{ camelCase(vehiculo.cliente.nombre) }} {{ camelCase(vehiculo.cliente.apellido) }}</p>
                  <div class="flex flex-col sm:flex-row sm:gap-4 mt-1">
                    <p v-if="vehiculo.cliente.email" class="text-sm servi-grey-font truncate">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {{ vehiculo.cliente.email }}
                    </p>
                    <p v-if="vehiculo.cliente.telefono" class="text-sm servi-grey-font">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      +{{ vehiculo.cliente.codigo_pais || '56' }} {{ vehiculo.cliente.telefono }}
                    </p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 servi-grey-font shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div v-else class="p-10 text-center">
              <p class="servi-grey-font font-medium">Sin propietario asignado</p>
            </div>
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