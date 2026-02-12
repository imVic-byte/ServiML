<script setup>
import navbar from '../components/componentes/navbar.vue'
import tablero from '../components/dashboard/tablero.vue'
import { useUserStore } from '../stores/user.js'
import { useInterfaz } from '@/stores/interfaz'
import { storeToRefs } from 'pinia'
import { ref,onMounted,computed } from 'vue'
import { supabase } from '../lib/supabaseClient'

const userStore = useUserStore()
const interfaz = useInterfaz()
const {trabajador} = storeToRefs(userStore)
const otLista = { length: 12 }
const otSinAsignar = { length: 3 }
const PresupuestosSemana = { length: 8 }
const aprobadosHoy = 2
const otPorEntregar = { length: 4 }
const vehiculosEnTaller = ref([])
const capacidadTotal = ref(15)

const handleCapacidad = computed(() => {
  const porcentaje = vehiculosEnTaller.value.length / capacidadTotal.value * 100
  const limpiarPorcentaje = porcentaje.toFixed(0)
  return limpiarPorcentaje

})

const nombreCompleto = computed(() => {
    return trabajador.value?.nombre || 'Vic'
})

const VehiculosEnTaller = async () => {
  try {
    const {data, error} = await supabase.from('vehiculo').select('*').eq('en_taller', true)
    vehiculosEnTaller.value = data
  } catch (error) {
    console.log(error)
  }
}

onMounted(() => {
  interfaz.showLoading()
  VehiculosEnTaller()
  interfaz.hideLoading()
})
const fechaHoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
    <navbar class="navbar" :titulo="'Panel de Control'" :subtitulo="'Resumen de operaciones'" />
    
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Hola, {{ nombreCompleto }}</h1>
          <p class="text-slate-500 capitalize">{{ fechaHoy }}</p>
        </div>
        <div class="mt-4 sm:mt-0">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-servi-blue border border-blue-100">
                <span class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Taller Operativo
            </span>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        
        <RouterLink to="/vehiculos-en-taller" class="group bg-white overflow-hidden rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="p-3 rounded-lg bg-blue-50 text-servi-blue group-hover:bg-servi-blue group-hover:text-servi-gold transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2m1 0h6m-1 0h6" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-slate-500 truncate">Vehículos en Taller</dt>
                  <dd>
                    <div class="text-2xl font-bold text-slate-900">{{ vehiculosEnTaller.length }}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 px-5 py-3">
            <div class="text-xs font-medium text-servi-blue truncate">
              {{ handleCapacidad }}%
            </div>
          </div>
        </RouterLink>

        <RouterLink to="/ot-sin-asignar" class="group bg-white overflow-hidden rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="p-3 rounded-lg" :class="otSinAsignar.length > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-slate-500 truncate">Sin Asignar</dt>
                  <dd>
                    <div class="text-2xl font-bold text-slate-900">{{ otSinAsignar.length }}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 px-5 py-3">
             <span v-if="otSinAsignar.length > 0" class="text-xs font-bold text-red-600 flex items-center">
                Requires Acción Inmediata
             </span>
             <span v-else class="text-xs font-bold text-green-600">Todo en orden</span>
          </div>
        </RouterLink>

        <RouterLink to="/presupuestos-semana" class="group bg-white overflow-hidden rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="p-3 rounded-lg bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-slate-500 truncate">Presupuestos Semana</dt>
                  <dd>
                    <div class="text-2xl font-bold text-slate-900">{{ PresupuestosSemana.length }}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 px-5 py-3 flex justify-between items-center">
            <div class="text-xs text-slate-500">Aprobados hoy</div>
            <div class="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">+{{ aprobadosHoy }}</div>
          </div>
        </RouterLink>

        <RouterLink to="/ot-por-entregar" class="group bg-white overflow-hidden rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="p-3 rounded-lg bg-servi-gold/20 text-yellow-700 group-hover:bg-servi-gold group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-slate-500 truncate">Listos para Entrega</dt>
                  <dd>
                    <div class="text-2xl font-bold text-slate-900">{{ otPorEntregar.length }}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 px-5 py-3">
             <div class="text-xs font-medium text-yellow-700">Contactar clientes</div>
          </div>
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div class="lg:col-span-2 space-y-6">
            <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-lg font-bold text-slate-800">Estado del Taller</h2>
                    <button class="text-sm text-servi-blue hover:text-blue-800 font-medium">Ver todo</button>
                </div>
                
                <div class="min-h-[300px]">
                    <tablero />
                </div>
            </div>
        </div>

        <div class="space-y-6">
            
            <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-50 bg-slate-50/50">
                    <h3 class="font-bold text-slate-800">Métricas de Eficiencia</h3>
                </div>
                <div class="p-6 space-y-6">
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

                    <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
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
/* Colores Corporativos de ServiML definidos localmente para asegurar consistencia si no están en root */
.text-servi-blue { color: #1f3d64; }
.bg-servi-blue { background-color: #1f3d64; }

.text-servi-gold { color: #D8B462; }
.bg-servi-gold { background-color: #D8B462; }
</style>