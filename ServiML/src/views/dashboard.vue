<script setup>
import navbar from '../components/componentes/navbar.vue'
import { useUserStore } from '../stores/user.js'
import { useInterfaz } from '../stores/interfaz.js'
import { storeToRefs } from 'pinia'
import { computed, ref, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'
import tablero from '../components/dashboard/tablero.vue'

const capacidad = ref(15)
const otSinAsignar = ref([])
const otLista = ref([])
const otPorEntregar = ref([])
const PresupuestosSemana= ref([])
const aprobadosHoy = ref(0)
const vehiculosLista = ref([])
const uiStore = useInterfaz()
const userStore = useUserStore()
const deudasVencidas = ref([])
const {trabajador, loading: authLoading} = storeToRefs(userStore)

const nombreCompleto = computed(() => {
  if (authLoading.value) return 'Verificando Sesión...'
  if (trabajador.value) {
    if (!trabajador.value.apellido) {
      return trabajador.value.nombre
    }
    return `${trabajador.value.nombre} ${trabajador.value.apellido}`
  }
  return 'Usuario'
})

const handleOT = async () => {
  const { data, error } = await supabase
    .from('orden_trabajo')
    .select('*')
  if (error) {
    console.error('Error al obtener OT:', error)
    return
  }
  otLista.value = data || []
  handleOTSinAsignar()
}

const handleOTSinAsignar = () => {
  otSinAsignar.value = otLista.value.filter(ot => ot.estado_actual_id === 1)
  handlePorEntregar()
}

const handlePorEntregar = () => {
  otPorEntregar.value = otLista.value.filter(ot => ot.estado_actual_id === 6)
  handleOTNoTerminada()
}

const handleOTNoTerminada = () => {
  otLista.value = otLista.value.filter(ot => ot.estado_actual_id !== 7 && ot.estado_actual_id !== 8 && ot.estado_actual_id !== 1 && ot.estado_actual_id !== 10)
  vehiculosLista.value = otLista.value
}

const handleSemana = () => {
  const hoy = new Date()
  const dia = hoy.getDay()
  const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1)
  const lunes = new Date(hoy.setDate(diff))
  lunes.setHours(0, 0, 0, 0)
  return lunes.toISOString()
}

const handlePresupuestosSemana = async () => {
  const lunesISO = handleSemana()
  const { data, error } = await supabase
    .from('presupuesto')
    .select('*')
    .order('created_at', { ascending: false })
    .gte('created_at', lunesISO)
  if (error) {
    console.error('Error al obtener presupuestos de la semana:', error)
    return
  } 
  PresupuestosSemana.value = data || []
}

const handleAprobadosHoy = async () => {
    const hoy = new Date()
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0)
    const {data, error} = await supabase
    .from('presupuesto')
    .select('*')
    .eq('estado', 2)
    .gte('updated_at', inicioDia.toISOString())
    
    if (error) {
        console.error('Error fetching aprobados:', error)
        return 0
    }
    // NOTA: Eliminé uiStore.hideLoading() de aquí para centralizarlo en onMounted
    return aprobadosHoy.value = data ? data.length : 0
}

const handleAlertasCobranza = async () => {
  const { data } = await supabase
    .from('deudas')
    .select('*')
    .eq('estado', 'pendiente')
    .gt('notificar_cada', 0);

  if (!data) return;

  const hoy = new Date();
  deudasVencidas.value = data.filter(d => {
      const ultima = new Date(d.ultima_notificacion || d.created_at);
      const diffTiempo = hoy - ultima;
      const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24)); 
      return diffDias >= d.notificar_cada;
  });
}

onMounted(async () => {
  uiStore.showLoading()
  
  // Aseguramos auth primero
  if (!userStore.initialized) {
    await userStore.initializeAuth()
  }

  try {
     // Promise.all permite que las peticiones se hagan en paralelo
     await Promise.all([
        handleOT(),
        handlePresupuestosSemana(),
        handleAprobadosHoy(),
        handleAlertasCobranza()
     ])
  } catch (error) {
    console.error('Error crítico al obtener datos del dashboard:', error)
  } finally {
    // ESTO ES CRÍTICO: Se ejecuta SIEMPRE, haya error o no.
    // Esto previene que la pantalla se quede congelada con el loading.
    uiStore.hideLoading()
  }
});
</script>
<template>
<navbar :titulo="nombreCompleto" subtitulo="Dashboard" class="navbar"/>
  <div class="min-h-screen flex flex-col">
    <div class="flex bg-gray-50 text-gray-800 font-sans sm:pb-10">
        <div class="flex-1 flex flex-col overflow-hidden">
            <main class="flex-1 overflow-x-hidden overflow-y-auto p-3">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-2">
                    <RouterLink to="/vehiculos-en-taller" class="no-underline">
                    <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">Vehículos en Taller</p>
                                <div class="flex align-center items-center ">
                                <span class="text-2xl font-bold text-gray-800 pb-1 pr-2">{{otLista.length}}</span>
                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car-icon lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></span>
                                </div>
                            </div>
                            <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">En Reparación</span>
                        </div>
                        <div class="mt-4 w-full bg-gray-200 rounded-full h-1.5">
                            <div class="bg-blue-600 h-1.5 rounded-full" :style="{ width: `${(otLista.length / 10 * 100)}%` }"></div>
                        </div>
                    </div>
                    </RouterLink>
                    <RouterLink to="/ot-sin-asignar" class="no-underline">
                    <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">OT Sin Asignar</p>
                                <h3 class="text-2xl font-bold text-gray-800 mt-1">{{otSinAsignar.length}}</h3>
                            </div>
                            <span v-if="otSinAsignar.length > 5" class="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">Crítico</span>
                            <span v-else class="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">Alerta</span>
                        </div>
                        <p v-if="otSinAsignar.length > 5" class="text-sm text-gray-500 mt-4 font-medium">Requiere acción inmediata</p>
                        <p v-else class="text-sm text-gray-500 mt-4 font-medium">Se sugiere asignar OTs</p>
                    </div>
                    </RouterLink>
                    <RouterLink to="/presupuestos-semana" class="no-underline">
                    <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">Presupuestos esta semana</p>
                                <h3 class="text-2xl font-bold text-gray-800 mt-1">{{ PresupuestosSemana.length}}</h3>
                            </div>
                            <span v-if="PresupuestosSemana.length > 10" class="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Alta demanda</span>
                            <span v-else class="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">Demanda Normal</span>
                        </div>
                        <p class="text-sm text-gray-500 mt-4 font-medium">{{ aprobadosHoy}} Aprobados hoy</p>
                    </div>
                    </RouterLink>
                    <RouterLink to="/ot-por-entregar" class="no-underline">
                    <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">OT Completadas esta semana</p>
                                <h3 class="text-2xl font-bold text-gray-800 mt-1">{{ otPorEntregar.length }}</h3>
                            </div>
                            <span class="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">Listos</span>
                        </div>
                        <p class="text-sm text-gray-500 mt-4 font-medium">Se sugiere contactar clientes</p>
                    </div>
                    </RouterLink>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                    <tablero />

                    <div class="bg-white rounded-lg shadow-sm border border-gray-100">
                        <div class="p-6 border-b border-gray-100">
                            <h3 class="font-bold text-gray-800 text-lg">Métricas Rápidas</h3>
                        </div>
                        <div class="p-6 space-y-6">
                            <div>
                                <div class="flex justify-between mb-2">
                                    <span class="text-sm font-medium text-gray-700">Capacidad Diaria</span>
                                    <span class="text-sm font-medium text-gray-900">85%</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2">
                                    <div class="bg-indigo-600 h-2 rounded-full" style="width: 85%"></div>
                                </div>
                            </div>
                            
                            <div class="border-t border-gray-100 pt-4">
                                <div class="flex items-center justify-between py-2">
                                    <span class="text-sm text-gray-600">Monto Promedio</span>
                                    <span class="font-bold text-gray-900">$185.000</span>
                                </div>
                                <div class="flex items-center justify-between py-2">
                                    <span class="text-sm text-gray-600">Tasa de Rechazo</span>
                                    <span class="font-bold text-red-600">12%</span>
                                </div>
                                <div class="flex items-center justify-between py-2">
                                    <span class="text-sm text-gray-600">Clientes Nuevos</span>
                                    <span class="font-bold text-green-600">+8</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

  </div>
  </template>