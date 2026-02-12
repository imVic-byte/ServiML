<script setup>
import navbar from '../components/componentes/navbar.vue'
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import { useInterfaz } from '@/stores/interfaz'
import { supabase } from '@/lib/supabaseClient'

const interfaz = useInterfaz()
const userStore = useUserStore()
const router = useRouter()
const nombreCompleto = computed(() => userStore.trabajador?.nombre + ' ' + userStore.trabajador?.apellido || 'Usuario')
const fechaHoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
const diaSemana = new Date().getDay()
const fechaInicioSemana = computed(() => {
  const fecha = new Date()
  const dia = fecha.getDay()
  const diferencia = dia === 0 ? -6 : 1 - dia
  fecha.setDate(fecha.getDate() + diferencia)
  return fecha.toISOString().split('T')[0]
})
const fechaFinSemana = computed(() => {
  const fecha = new Date()
  const dia = fecha.getDay()
  const diferencia = dia === 0 ? 0 : 7 - dia
  fecha.setDate(fecha.getDate() + diferencia)
  return fecha.toISOString().split('T')[0]
})
const esFinDeSemana = computed(() => diaSemana === 0 || diaSemana === 6)
const vehiculosEnTaller = ref(0)
const listaOT = ref([])
const listaOTRecientes = ref([])
const otSinAsignar = ref(0)
const listaPresupuestos = ref([])
const presupuestosSemana = ref(0)
const aprobadosHoy = ref(0)
const otPorEntregar = ref(0)
const capacidadMaxima = ref(15)
const listaEstados = ref([])
const porcentajeCapacidad = computed(() => (vehiculosEnTaller.value / capacidadMaxima.value) * 100)
const TruncarPorcentaje = computed(() => Math.trunc(porcentajeCapacidad.value))

const VehiculosEnTaller = () => {
  router.push({ name: 'vehiculos-en-taller' })
}

const SinAsignar = () => {
  router.push({ name: 'ot-sin-asignar' })
}

const PresupuestosSemana = () => {
  router.push({ name: 'presupuestos-semana' })
}

const ListoParaEntregar = () => {
  router.push({ name: 'ot-por-entregar' })
}

const verTablero = () => {
  router.push({ name: 'ordenes-de-trabajo' })
}

const handleVehiculos = async () => {
  try {
    const {data, error} = await supabase.from('vehiculo').select('*').eq('en_taller', true)
    if (error) throw error
    vehiculosEnTaller.value = data.length
  } catch (error) {
    console.error('Error al obtener vehiculos:', error)
  }
}

const handleOT = async () => {
  try {
    const {data, error} = await supabase.from('orden_trabajo').select('*, vehiculo(*), cliente(*), presupuesto(*)')
    if (error) throw error
    listaOT.value = data
  } catch (error) {
    console.error('Error al obtener OT sin asignar:', error)
  }
}

const handleOTSinAsignar = async () => {
  otSinAsignar.value = listaOT.value.filter(ot => ot.id_empleado === null).length
}


const handlePresupuestosSemana = async () => {
  try {
    const { data, error } = await supabase.from('presupuesto').select('*').gte('created_at', fechaInicioSemana.value).lte('created_at', fechaFinSemana.value).eq('estado', 2)
    if (error) throw error
    listaPresupuestos.value = data
    presupuestosSemana.value = data.length
  } catch (error) {
    console.error('Error al obtener presupuestos:', error)
  }
}

const handleAprobadosHoy = () => {
  const hoy = new Date().toISOString().split('T')[0]
  aprobadosHoy.value = listaPresupuestos.value.filter(presupuesto => presupuesto.created_at.split('T')[0] === hoy).length
}

const handlePorEntregar = () => {
  otPorEntregar.value = listaOT.value.filter(ot => ot.estado_actual_id === 6 || ot.estado_actual_id === 9).length
}

const handleOTRecientes = () => {
  listaOTRecientes.value = listaOT.value.filter(ot => ot.created_at >= fechaInicioSemana.value && ot.created_at <= fechaFinSemana.value).slice(0, 5)
}

const handleEstados = async () => {
  try {
    const {data,error} = await supabase.from('tabla_estados').select('*')
    if (error) throw error
    listaEstados.value = data
  } catch (error) {
    console.error('Error al obtener estados:', error)
  }
}

const handleOrdenarEstado = (estado) => {
  return listaEstados.value.find(e => e.id === estado) || {estado: 'Desconocido', color: 'bg-gray-500'}
}

onMounted(async () => {
  interfaz.showLoading()
  await handleVehiculos()
  await handleOT()
  await handleOTSinAsignar()
  await handlePresupuestosSemana()
  await handleAprobadosHoy()
  await handlePorEntregar()
  await handleOTRecientes()
  await handleEstados()
  interfaz.hideLoading()
})
</script>
<template>
  <div class="bg-slate-50 flex flex-col font-sans">
    <navbar class="navbar" :titulo="'Dashboard'" :subtitulo="'Resumen de operaciones'" />
    
    <main class="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-20">
      <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Hola, {{ nombreCompleto }}</h1>
          <p class="text-slate-500 capitalize">{{ fechaHoy }}</p>
        </div>
        <div class="mt-2 sm:mt-0">
          <span v-if="!esFinDeSemana" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-servi-blue border border-blue-100">
            <span class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Taller Operativo
          </span>
          <span v-else class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-600 border border-red-100">
            <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            Taller Cerrado
          </span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <div @click="VehiculosEnTaller" class="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-100">
          <div class="p-4 sm:p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="p-2.5 sm:p-3 rounded-lg bg-blue-50 text-servi-blue">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
              </div>
              <div class="ml-4 w-0 flex-1">
                <dt class="text-xs sm:text-sm font-medium text-slate-500 truncate">Vehículos en Taller</dt>
                <dd class="text-xl sm:text-2xl font-bold text-slate-900">{{ vehiculosEnTaller }}</dd>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 px-4 sm:px-5 py-2.5">
            <div class="text-xs font-medium text-servi-blue" :class="{ 'text-red-600': TruncarPorcentaje > 80 }">{{ TruncarPorcentaje }}% capacidad</div>
          </div>
        </div>

        <div @click="SinAsignar" class="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-100">
          <div class="p-4 sm:p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="p-2.5 sm:p-3 rounded-lg bg-red-50 text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div class="ml-4 w-0 flex-1">
                <dt class="text-xs sm:text-sm font-medium text-slate-500 truncate">Sin Asignar</dt>
                <dd class="text-xl sm:text-2xl font-bold text-slate-900">{{ otSinAsignar }}</dd>
              </div>
            </div>
          </div>
          <div v-if="otSinAsignar>5" class="bg-slate-50 px-4 sm:px-5 py-2.5">
            <span class="text-xs font-bold text-red-600">Requiere acción</span>
          </div>
          <div v-else class="bg-slate-50 px-4 sm:px-5 py-2.5">
            <span class="text-xs font-bold text-green-600">Todo en orden</span>
          </div>
        </div>

        <div @click="PresupuestosSemana" class="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-100">
          <div class="p-4 sm:p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="p-2.5 sm:p-3 rounded-lg bg-green-50 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div class="ml-4 w-0 flex-1">
                <dt class="text-xs sm:text-sm font-medium text-slate-500 truncate">Presupuestos Semana</dt>
                <dd class="text-xl sm:text-2xl font-bold text-slate-900">{{ presupuestosSemana }}</dd>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 px-4 sm:px-5 py-2.5 flex justify-between items-center">
            <div class="text-xs text-slate-500">Aprobados hoy</div>
            <div class="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">+{{ aprobadosHoy }}</div>
          </div>
        </div>

        <div @click="ListoParaEntregar" class="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-100">
          <div class="p-4 sm:p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="p-2.5 sm:p-3 rounded-lg bg-yellow-50 text-yellow-700">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div class="ml-4 w-0 flex-1">
                <dt class="text-xs sm:text-sm font-medium text-slate-500 truncate">Listos para Entrega</dt>
                <dd class="text-xl sm:text-2xl font-bold text-slate-900">{{ otPorEntregar }}</dd>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 px-4 sm:px-5 py-2.5">
            <div class="text-xs font-medium text-yellow-700">Contactar clientes</div>
          </div>
        </div>
      </div>

      <!-- Contenido principal -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Flujo de trabajo reciente (2/3) -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 class="text-lg font-bold text-slate-800">Flujo de Trabajo Reciente</h2>
            <button @click="verTablero" class="text-sm text-servi-blue hover:text-blue-800 font-medium">Ver tablero</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th class="px-5 py-3">Orden</th>
                  <th class="px-5 py-3">Vehículo</th>
                  <th class="px-5 py-3">Servicio</th>
                  <th class="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="ot in listaOTRecientes" :key="ot.id" class="hover:bg-slate-50 transition-colors">
                  <td class="px-5 py-3.5 font-medium text-slate-800">#{{ ot.id }}</td>
                  <td class="px-5 py-3.5 text-slate-600">{{ ot.vehiculo.patente }}</td>
                  <td class="px-5 py-3.5 text-slate-600">{{ ot.diagnostico || 'Sin diagnóstico' }}</td>
                  <td class="px-5 py-3.5">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" :style="{ backgroundColor: handleOrdenarEstado(ot.estado_actual_id).color, color: handleOrdenarEstado(ot.estado_actual_id).texto }">{{ handleOrdenarEstado(ot.estado_actual_id).estado }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="space-y-6">
          
          <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 class="font-bold text-slate-800">Métricas de Eficiencia</h3>
            </div>
            <div class="p-5 space-y-5">
              <div>
                <div class="flex justify-between mb-2">
                  <span class="text-sm font-medium text-slate-600">Ocupación Taller</span>
                  <span class="text-sm font-bold text-servi-blue">85%</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2.5">
                  <div class="bg-servi-blue h-2.5 rounded-full" style="width: 85%"></div>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-2">
                  <span class="text-sm font-medium text-slate-600">Entrega a Tiempo</span>
                  <span class="text-sm font-bold text-green-600">92%</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2.5">
                  <div class="bg-green-500 h-2.5 rounded-full" style="width: 92%"></div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <div class="text-center p-3 bg-slate-50 rounded-lg">
                  <div class="text-xs text-slate-500 uppercase tracking-wider">Ticket Prom.</div>
                  <div class="font-bold text-slate-800 mt-1">$185k</div>
                </div>
                <div class="text-center p-3 bg-slate-50 rounded-lg">
                  <div class="text-xs text-slate-500 uppercase tracking-wider">Rechazos</div>
                  <div class="font-bold text-red-500 mt-1">12%</div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
.text-servi-blue { color: #1f3d64; }
.bg-servi-blue { background-color: #1f3d64; }
.text-servi-gold { color: #D8B462; }
.bg-servi-gold { background-color: #D8B462; }
</style>