<script setup>
import navbar from '../components/componentes/navbar.vue'
import { computed } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const nombreCompleto = userStore.user.nombre + ' ' + userStore.user.apellido || 'Usuario'
const fechaHoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
const diaSemana = new Date().getDay()
const esFinDeSemana = computed(() => diaSemana === 0 || diaSemana === 6)
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
    <navbar class="navbar" :titulo="'Panel de Control'" :subtitulo="'Resumen de operaciones'" />
    
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      
      <!-- Saludo -->
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Hola, {{ nombreCompleto }}</h1>
          <p class="text-slate-500 capitalize">{{ fechaHoy }}</p>
        </div>
        <div class="mt-4 sm:mt-0">
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

      <!-- Tarjetas de métricas -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        
        <!-- Vehículos en Taller -->
        <div class="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-100">
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
                <dd class="text-xl sm:text-2xl font-bold text-slate-900">8</dd>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 px-4 sm:px-5 py-2.5">
            <div class="text-xs font-medium text-servi-blue">53% capacidad</div>
          </div>
        </div>

        <!-- OT Sin Asignar -->
        <div class="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-100">
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
                <dd class="text-xl sm:text-2xl font-bold text-slate-900">3</dd>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 px-4 sm:px-5 py-2.5">
            <span class="text-xs font-bold text-red-600">Requiere acción</span>
          </div>
        </div>

        <!-- Presupuestos Semana -->
        <div class="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-100">
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
                <dd class="text-xl sm:text-2xl font-bold text-slate-900">12</dd>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 px-4 sm:px-5 py-2.5 flex justify-between items-center">
            <div class="text-xs text-slate-500">Aprobados hoy</div>
            <div class="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">+4</div>
          </div>
        </div>

        <!-- Listos para Entrega -->
        <div class="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-100">
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
                <dd class="text-xl sm:text-2xl font-bold text-slate-900">5</dd>
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
            <button class="text-sm text-servi-blue hover:text-blue-800 font-medium">Ver tablero</button>
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
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-5 py-3.5 font-medium text-slate-800">#1042</td>
                  <td class="px-5 py-3.5 text-slate-600">BBKL-23</td>
                  <td class="px-5 py-3.5 text-slate-600">Cambio de frenos</td>
                  <td class="px-5 py-3.5">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">En progreso</span>
                  </td>
                </tr>
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-5 py-3.5 font-medium text-slate-800">#1041</td>
                  <td class="px-5 py-3.5 text-slate-600">DFRT-87</td>
                  <td class="px-5 py-3.5 text-slate-600">Service completo</td>
                  <td class="px-5 py-3.5">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Esperando repuestos</span>
                  </td>
                </tr>
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-5 py-3.5 font-medium text-slate-800">#1040</td>
                  <td class="px-5 py-3.5 text-slate-600">GHKP-45</td>
                  <td class="px-5 py-3.5 text-slate-600">Alineación y balanceo</td>
                  <td class="px-5 py-3.5">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Completado</span>
                  </td>
                </tr>
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-5 py-3.5 font-medium text-slate-800">#1039</td>
                  <td class="px-5 py-3.5 text-slate-600">JKLM-12</td>
                  <td class="px-5 py-3.5 text-slate-600">Revisión suspensión</td>
                  <td class="px-5 py-3.5">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">En progreso</span>
                  </td>
                </tr>
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-5 py-3.5 font-medium text-slate-800">#1038</td>
                  <td class="px-5 py-3.5 text-slate-600">WXYZ-99</td>
                  <td class="px-5 py-3.5 text-slate-600">Diagnóstico motor</td>
                  <td class="px-5 py-3.5">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Diagnóstico</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Panel lateral (1/3) -->
        <div class="space-y-6">
          
          <!-- Métricas de Eficiencia -->
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

          <!-- Actividad Reciente -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 class="font-bold text-slate-800">Actividad Reciente</h3>
            </div>
            <div class="p-5">
              <ul class="space-y-4">
                <li class="flex items-start gap-3">
                  <div class="mt-1 w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                  <div>
                    <p class="text-sm text-slate-700 font-medium">OT #1040 completada</p>
                    <p class="text-xs text-slate-400">Hace 25 min</p>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <div>
                    <p class="text-sm text-slate-700 font-medium">Presupuesto #508 aprobado</p>
                    <p class="text-xs text-slate-400">Hace 1 hora</p>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></div>
                  <div>
                    <p class="text-sm text-slate-700 font-medium">Repuesto recibido - OT #1041</p>
                    <p class="text-xs text-slate-400">Hace 2 horas</p>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                  <div>
                    <p class="text-sm text-slate-700 font-medium">OT #1039 sin técnico asignado</p>
                    <p class="text-xs text-slate-400">Hace 3 horas</p>
                  </div>
                </li>
              </ul>
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