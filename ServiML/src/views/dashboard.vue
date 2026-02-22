<script setup>
import navbar from '../components/componentes/navbar.vue'
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import { useInterfaz } from '@/stores/interfaz'
import { supabase } from '@/lib/supabaseClient'
import { fechaInicioSemana, fechaFinSemana, fechaHoy, diaSemana, esFinDeSemana } from '@/js/fechayhora'

const interfaz = useInterfaz()
const userStore = useUserStore()
const router = useRouter()
const nombre = userStore.trabajador?.nombre || ''
const apellido = userStore.trabajador?.apellido || ''
const nombreCompleto = computed(() => nombre + ' ' + apellido)
const vehiculosEnTaller = ref(0)
const listaOTRecientes = ref([])
const otSinAsignar = ref(0)
const listaPresupuestos = ref([])
const presupuestosSemana = ref(0)
const presupuestosHoy = ref(0)
const aprobadosHoy = ref(0)
const otPorEntregar = ref(0)
const capacidadMaxima = ref(15)
const listaEstados = ref([])
const talleres = ref([])
const tallerSeleccionado = ref(null)
const porcentajeCapacidad = computed(() => (vehiculosEnTaller.value / capacidadMaxima.value) * 100)
const TruncarPorcentaje = computed(() => Math.trunc(porcentajeCapacidad.value))
const vehiculosEstacionados=ref(0)
const fichas = ref([])
const aTiempo = ref(0)
const porcentajeAtiempo = computed(() => Math.trunc((aTiempo.value / fichas.value.length) * 100)) || 0
const cotizacionesTotales = ref(0)
const cotizacionesRechazadas = ref(0)
const porcentajeRechazos = computed(() => Math.trunc((cotizacionesRechazadas.value / cotizacionesTotales.value) * 100)) || 0
const trabajoReciente = ref([])
const estados = ref([])
const misOTs = ref([])

const VehiculosEnTaller = () => {
  router.push({ name: 'vehiculos-en-taller', params: { taller: tallerSeleccionado.value } })
}

const SinAsignar = () => {
  router.push({ name: 'ot-sin-asignar', params: { taller: tallerSeleccionado.value } })
}

const PresupuestosSemana = () => {
  router.push({ name: 'presupuestos-semana', params: { taller: tallerSeleccionado.value } })
}

const ListoParaEntregar = () => {
  router.push({ name: 'ot-por-entregar', params: { taller: tallerSeleccionado.value } })
}

const verTablero = () => {
  router.push({ name: 'ordenes-de-trabajo' })
}

const verOT = (id) => {
  router.push({ name: 'ver-orden-de-trabajo', params: { id } })
}
const metricas = ref({
  ocupacion_actual: 0,
  ticket_promedio: 0,
  porcentaje_a_tiempo: 0,
  porcentaje_rechazos: 0
})

const formatoMoneda = (valor) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(valor)
}

const obtenerTalleres = async () => {
  try {
    const { data, error } = await supabase.from('serviml_taller').select('*').order('id', { ascending: true })
    if (error) throw error
    talleres.value = data || []
    if (talleres.value.length > 0) tallerSeleccionado.value = talleres.value[0].id
  } catch (error) {
    console.error('Error al obtener talleres:', error)
  }
}


const handleVehiculosEnTaller = async () => {
  try {
    const { data, error, count } = await supabase
      .from('ficha_de_trabajo')
      .select('id, orden_trabajo!inner(id)', { count: 'exact' })
      .in('estado', [1, 2, 3, 4, 5])
      .eq('id_taller', tallerSeleccionado.value)
    if (error) throw error
    vehiculosEnTaller.value = data.reduce((total, ficha) => {
    return total + (Array.isArray(ficha.orden_trabajo) ? ficha.orden_trabajo.length : 1)
  }, 0)
  } catch (error) {
    console.error('Error al obtener vehiculos:', error)
  }
}

const handleListosParaEntregar = async () => {
  try {
    const { data, error, count } = await supabase
    .from('ficha_de_trabajo')
    .select('id,estado', { count: 'exact' })
    .eq('id_taller', tallerSeleccionado.value)
    .in('estado', [4, 5])
    if (error) throw error
    otPorEntregar.value = count || 0
  } catch (error) {
    console.error('Error al obtener ot por entregar:', error)
  }
}

const handleCotizaciones = async () => {
  try{
    const { data, error, count } = await supabase
    .from('cotizaciones_ficha')
      .select('id, estado, ficha_de_trabajo!inner(id_taller)', { count: 'exact' })
      .eq('ficha_de_trabajo.id_taller', tallerSeleccionado.value)
      .gt('created_at', fechaInicioSemana.value)
    if (error) throw error
    presupuestosSemana.value = count || 0
    presupuestosHoy.value = data.filter(cotizacion => cotizacion.estado === 2).length
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error)
  }
}

const obtenerCapacidadMaximaTaller = async () => {
  const{data, error} = await supabase.from('serviml_taller').select('capacidad_maxima').eq('id', tallerSeleccionado.value).single()
  if (error) throw error
  capacidadMaxima.value = data.capacidad_maxima
}

const handleVehiculosEstacionados = async () => {
  const {data,error,count} = await supabase
  .from('ficha_de_trabajo')
  .select('id, estado, orden_trabajo!inner(id)', { count: 'exact' })
  .eq('id_taller', tallerSeleccionado.value)
  .eq('estado', 5)
  if (error) throw error
  vehiculosEstacionados.value = data.reduce((total, ficha) => {
    return total + (Array.isArray(ficha.orden_trabajo) ? ficha.orden_trabajo.length : 1)
  }, 0)
}

const handleEntregaATiempo = async () => {
  const {data,error,count} = await supabase
  .from('ficha_de_trabajo')
  .select('id,fecha_promesa,fecha_entrega')
  .eq('id_taller', tallerSeleccionado.value)
  if (error) throw error
  fichas.value = data.filter(ficha => ficha.fecha_promesa && ficha.fecha_entrega) || []
  aTiempo.value = fichas.value.filter(ficha => ficha.fecha_entrega <= ficha.fecha_promesa).length || 0
}

const handleStatsCotizaciones = async () => {
  try {
    const { data, error, count } = await supabase
      .from('cotizaciones_ficha')
      .select('id, estado, total_final, ficha_de_trabajo!inner(id_taller)', { count: 'exact' })
      .eq('ficha_de_trabajo.id_taller', tallerSeleccionado.value)

    if (error) throw error

    cotizacionesTotales.value = count || 0
    
    // 1. Filtrar rechazadas
    const rechazadas = data.filter(cot => cot.estado === 3)
    cotizacionesRechazadas.value = rechazadas.length

    // 2. Filtrar aprobadas para el Ticket Promedio
    const aprobadas = data.filter(cot => cot.estado === 2)

    if (cotizacionesTotales.value > 0) {
      metricas.value.porcentaje_rechazos = Math.round((rechazadas.length / cotizacionesTotales.value) * 100)
      
      // Calculamos promedio solo sobre las aprobadas para que sea un dato útil de negocio
      if (aprobadas.length > 0) {
        const sumaTotal = aprobadas.reduce((acc, cot) => acc + (cot.total_final || 0), 0)
        metricas.value.ticket_promedio = Math.round(sumaTotal / aprobadas.length)
      } else {
        metricas.value.ticket_promedio = 0
      }
    } else {
      metricas.value.porcentaje_rechazos = 0
      metricas.value.ticket_promedio = 0
    }
  } catch (error) {
    console.error('Error al obtener stats de cotizaciones:', error)
  }
}

const handleTrabajoReciente = async () => {
  try {
    const { data, error } = await supabase
      .from('ficha_de_trabajo')
      .select('id, orden_trabajo!inner(*, vehiculo(*))')
      .eq('id_taller', tallerSeleccionado.value)
      .order('id', { ascending: false })
      .limit(10)
    if (error) throw error
    const todasLasOTs = data.flatMap(ficha => {
      return ficha.orden_trabajo.map(ot => ({
        ...ot,
        id_ficha: ficha.id
      }))
    })
    trabajoReciente.value = todasLasOTs
      .sort((a, b) => b.id - a.id)
      .slice(0, 5)

  } catch (error) {
    console.error('Error al obtener trabajo reciente:', error)
  }
}

const handleTraerEstados = async () => {
  const {data,error} = await supabase
  .from('tabla_estados')
  .select('*')
  if (error) throw error
  estados.value = data || []
}

const handleMisOTs = async () => {
  try {
    const { data, error } = await supabase
      .from('orden_trabajo')
      .select('id, estado_actual_id, diagnostico, vehiculo(patente, marca, modelo), ficha_de_trabajo!inner(id, estado, id_taller)')
      .eq('id_empleado', userStore.user.id)
      .in('ficha_de_trabajo.estado', [1, 2, 3, 4])
      .order('id', { ascending: false })
    if (error) throw error
    misOTs.value = data || []
  } catch (error) {
    console.error('Error al obtener mis OTs:', error)
  }
}

const handleEstados  = (estado) => {
  return estados.value.find(e => e.id === estado) || {estado:'Desconocido',color:'#FFFFFF',texto:'#000000'}
}

const cambiarTaller = async () => {
  interfaz.showLoadingOverlay()
  await handleVehiculosEnTaller()
  await obtenerCapacidadMaximaTaller()
  await handleListosParaEntregar()
  await handleCotizaciones()
  await handleVehiculosEstacionados()
  await handleEntregaATiempo()
  await handleStatsCotizaciones()
  await handleTrabajoReciente()
  await handleTraerEstados()
  interfaz.hideLoadingOverlay()
}

onMounted(async () => {
  interfaz.showLoading()
  await obtenerTalleres()
  await obtenerCapacidadMaximaTaller()
  await handleVehiculosEnTaller()
  await handleListosParaEntregar()
  await handleCotizaciones()
  await handleVehiculosEstacionados()
  await handleEntregaATiempo()
  await handleStatsCotizaciones()
  await handleTrabajoReciente()
  await handleTraerEstados()
  await handleMisOTs()
  interfaz.hideLoading()
})
</script>
<template>
  <div class="servi-white min-h-screen flex flex-col font-sans">
    <navbar class="navbar" :titulo="'Dashboard'" notificaciones="true" :subtitulo="'Resumen de operaciones'" />
    
    <main class="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-20">
      <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold servi-grey-font">Hola, {{ nombreCompleto }}</h1>
          <p class="servi-grey-font capitalize">{{ fechaHoy }}</p>
        </div>
        <div class="mt-2 sm:mt-0 flex items-center gap-3">
          <select v-model="tallerSeleccionado" @change="cambiarTaller" class="text-sm font-medium servi-adapt-bg servi-grey-font border border-gray-100 rounded-lg px-3 py-1.5 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none cursor-pointer">
            <option v-for="taller in talleres" :key="taller.id" :value="taller.id">{{ taller.nombre }}</option>
          </select>
          <span v-if="!esFinDeSemana" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-servi-blue border border-blue-100">
            <span class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Operativo
          </span>
          <span v-else class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-600 border border-red-100">
            <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            Cerrado
          </span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <div @click="VehiculosEnTaller" class="servi-blue overflow-hidden cursor-pointer rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95">
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
                <dt class="text-xs sm:text-sm font-medium text-white truncate">Vehículos en Taller</dt>
                <dd class="text-xl sm:text-2xl font-bold text-white">{{ vehiculosEnTaller }}</dd>
              </div>
            </div>
          </div>
          <div class="px-4 sm:px-5 py-2.5">
            <div class="text-xs font-medium text-white" :class="{ 'text-red-600': TruncarPorcentaje > 80 }">{{ TruncarPorcentaje }}% capacidad</div>
          </div>
        </div>

        <div @click="SinAsignar" class="servi-blue overflow-hidden cursor-pointer rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95">
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
                <dt class="text-xs sm:text-sm font-medium text-white truncate">Vehiculos Estacionados</dt>
                <dd class="text-xl sm:text-2xl font-bold text-white">{{ vehiculosEstacionados }}</dd>
              </div>
            </div>
          </div>
          <div v-if="vehiculosEstacionados>2" class="px-4 sm:px-5 py-2.5">
            <span class="text-xs font-bold text-red-600">Requiere acción</span>
          </div>
          <div v-else class="px-4 sm:px-5 py-2.5">
            <span class="text-xs font-bold text-green-600">Todo en orden</span>
          </div>
        </div>

        <div @click="PresupuestosSemana" class="servi-blue overflow-hidden cursor-pointer rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95">
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
                <dt class="text-xs sm:text-sm font-medium text-white truncate">Cotizaciones / Semana</dt>
                <dd class="text-xl sm:text-2xl font-bold text-white">{{ presupuestosSemana }}</dd>
              </div>
            </div>
          </div>
          <div class="px-4 sm:px-5 py-2.5 flex justify-between items-center">
            <div class="text-xs text-white">Aprobados hoy</div>
            <div class="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">+{{ presupuestosHoy }}</div>
          </div>
        </div>

        <div @click="ListoParaEntregar" class="servi-blue overflow-hidden cursor-pointer rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95">
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
                <dt class="text-xs sm:text-sm font-medium text-white truncate">Trabajos por Entregar</dt>
                <dd class="text-xl sm:text-2xl font-bold text-white">{{ otPorEntregar }}</dd>
              </div>
            </div>
          </div>
          <div class="px-4 sm:px-5 py-2.5">
            <div class="text-xs font-medium text-yellow-400">Contactar clientes</div>
          </div>
        </div>
      </div>

      <!-- Mis OTs asignadas -->
      <div v-if="misOTs.length > 0" class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div class="p-5 border-b border-gray-100 servi-blue flex justify-between items-center">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Mis OTs Asignadas
          </h2>
          <span class="text-xs font-bold servi-yellow-font bg-white/10 px-2.5 py-1 rounded-full">{{ misOTs.length }}</span>
        </div>

        <!-- Table (desktop) -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-white servi-blue uppercase">
              <tr>
                <th class="px-5 py-3">OT</th>
                <th class="px-5 py-3">Patente</th>
                <th class="px-5 py-3">Vehículo</th>
                <th class="px-5 py-3">Diagnóstico</th>
                <th class="px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="ot in misOTs" :key="ot.id" @click="verOT(ot.id)" class="hover:opacity-80 transition-colors cursor-pointer">
                <td class="px-5 py-3.5 font-bold servi-grey-font">#{{ ot.id }}</td>
                <td class="px-5 py-3.5">
                  <span class="px-2 py-1 bg-yellow-100 text-yellow-800 font-bold rounded text-xs">{{ ot.vehiculo?.patente || 'S/P' }}</span>
                </td>
                <td class="px-5 py-3.5 servi-grey-font">{{ ot.vehiculo?.marca }} {{ ot.vehiculo?.modelo }}</td>
                <td class="px-5 py-3.5 servi-grey-font truncate max-w-[200px]">{{ ot.diagnostico || 'Sin diagnóstico' }}</td>
                <td class="px-5 py-3.5">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" :style="{ backgroundColor: handleEstados(ot.estado_actual_id).color, color:'white' }">{{ handleEstados(ot.estado_actual_id).estado }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards (mobile) -->
        <div class="md:hidden divide-y divide-gray-100">
          <div v-for="ot in misOTs" :key="ot.id" @click="verOT(ot.id)" class="p-4 hover:opacity-80 transition-colors cursor-pointer">
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold servi-grey-font">#{{ ot.id }}</span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" :style="{ backgroundColor: handleEstados(ot.estado_actual_id).color, color:'white' }">{{ handleEstados(ot.estado_actual_id).estado }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="px-2 py-1 bg-yellow-100 text-yellow-800 font-bold rounded text-xs">{{ ot.vehiculo?.patente || 'S/P' }}</span>
              <span class="text-sm servi-grey-font">{{ ot.vehiculo?.marca }} {{ ot.vehiculo?.modelo }}</span>
            </div>
            <p class="text-xs servi-grey-font mt-2 truncate">{{ ot.diagnostico || 'Sin diagnóstico' }}</p>
          </div>
        </div>
      </div>

      <!-- Contenido principal -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Flujo de trabajo reciente (2/3) -->
        <div class="lg:col-span-2 servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="p-5 border-b border-gray-100 servi-blue flex justify-between items-center">
            <h2 class="text-lg font-bold text-white">Flujo de Trabajo Reciente</h2>
            <button @click="verTablero" class="text-sm cursor-pointer text-white hover:text-blue-800 font-medium">Ver tablero</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-white servi-blue uppercase">
                <tr>
                  <th class="px-5 py-3">Orden</th>
                  <th class="px-5 py-3">Vehículo</th>
                  <th class="px-5 py-3">Servicio</th>
                  <th class="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="ot in trabajoReciente" @click="verOT(ot.id)" :key="ot.id" class="hover:opacity-80 transition-colors cursor-pointer">
                  <td class="px-5 py-3.5 font-medium servi-grey-font">#{{ ot.id }}</td>
                  <td class="px-5 py-3.5 servi-grey-font">{{ ot.vehiculo?.patente }}</td>
                  <td class="px-5 py-3.5 servi-grey-font truncate max-w-[100px] sm:max-w-none">{{ ot.diagnostico || 'Sin diagnóstico' }}</td>
                  <td class="px-5 py-3.5">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" :style="{ backgroundColor: handleEstados(ot.estado_actual_id).color, color:'white' }">{{ handleEstados(ot.estado_actual_id).estado }}</span>
                  </td>
                </tr>
                <tr v-if="trabajoReciente.length === 0" class="hover:opacity-80 transition-colors cursor-pointer">
                  <td class="px-5 py-3.5 font-medium servi-grey-font">No hay OT recientes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="space-y-6">
          
          <div class="space-y-6">
  <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="p-5 servi-blue border-b border-gray-100">
      <h3 class="font-bold text-white">Métricas de Eficiencia</h3>
    </div>
    <div class="p-5 space-y-5">
      
      <div>
        <div class="flex justify-between mb-2">
          <span class="text-sm font-medium servi-grey-font">
            Ocupación Taller ({{ vehiculosEnTaller }}/{{ capacidadMaxima }})
          </span>
          <span class="text-sm font-bold servi-grey-font">
            {{ TruncarPorcentaje }}%
          </span>
        </div>
        <div class="w-full servi-blue rounded-full h-2.5">
          <div 
            class="bg-blue-500 h-2.5 rounded-full transition-all duration-500" 
            :style="{ width: `${Math.min((vehiculosEnTaller / capacidadMaxima) * 100, 100)}%` }">
          </div>
        </div>
      </div>
      
      <div>
        <div class="flex justify-between mb-2">
          <span class="text-sm font-medium servi-grey-font">Entrega a Tiempo</span>
          <span class="text-sm font-bold text-green-600">
            {{ porcentajeAtiempo || 0 }}%
          </span>
        </div>
        <div class="w-full servi-adapt-bg rounded-full h-2.5">
          <div 
            class="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
            :style="{ width: `${porcentajeAtiempo || 0}%` }">
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
        <div class="text-center p-3 servi-adapt-bg rounded-lg transition-all duration-200 hover:shadow-sm">
          <div class="text-xs servi-grey-font uppercase tracking-wider">Ticket Prom.</div>
          <div class="font-bold servi-grey-font mt-1">
            {{ formatoMoneda(metricas.ticket_promedio) }}
          </div>
        </div>
        <div class="text-center p-3 servi-adapt-bg rounded-lg">
          <div class="text-xs servi-grey-font uppercase tracking-wider">Rechazos</div>
          <div class="font-bold text-red-500 mt-1">
            {{ porcentajeRechazos || 0 }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
        </div>
      </div>

    </main>
  </div>
</template>
