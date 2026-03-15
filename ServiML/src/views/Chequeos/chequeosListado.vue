<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabaseClient.js'
import navbar from '../../components/componentes/navbar.vue'
import volver from '@/components/componentes/volver.vue'
import { useInterfaz } from '@/stores/interfaz.js'
import { useUserStore } from '@/stores/user.js'

const router = useRouter()
const interfaz = useInterfaz()
const userStore = useUserStore()

const chequeos = ref([])
const mostrarModal = ref(false)
const misOTs = ref([])

const obtenerChequeos = async () => {
  try {
    const { data, error } = await supabase
      .from('chequeos')
      .select('*, orden_trabajo(id, diagnostico, vehiculo(patente, marca, modelo), ficha_de_trabajo(id, cliente(*)))')
      .order('created_at', { ascending: false })
    if (error) throw error
    chequeos.value = data || []
  } catch (error) {
    console.error('Error al obtener chequeos:', error)
  }
}

const obtenerMisOTs = async () => {
  try {
    const { data, error } = await supabase
      .from('orden_trabajo')
      .select('id, diagnostico, vehiculo(patente, marca, modelo), ficha_de_trabajo!inner(id, estado, cliente(nombre, apellido, telefono))')
      .eq('id_empleado', userStore.user.id)
      .is('chequeo', null)
      .in('ficha_de_trabajo.estado', [1, 2, 3, 4])
      .order('id', { ascending: false })
    if (error) throw error
    misOTs.value = data || []
  } catch (error) {
    console.error('Error al obtener OTs:', error)
  }
}

const abrirModal = async () => {
  interfaz.showLoadingOverlay()
  await obtenerMisOTs()
  interfaz.hideLoadingOverlay()
  mostrarModal.value = true
}

const seleccionarOT = (ot) => {
  mostrarModal.value = false
  router.push({ name: 'crear-chequeo', query: { ot_id: ot.id } })
}

const verChequeo = (id) => {
  router.push({ name: 'ver-chequeo', params: { id } })
}

const formatFecha = (fecha) => {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

onMounted(async () => {
  interfaz.showLoading()
  await obtenerChequeos()
  interfaz.hideLoading()
})
</script>

<template>
  <div class="servi-white min-h-screen pb-15">
    <navbar titulo="ServiML" subtitulo="Chequeos" class="sticky top-0 z-50" />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <volver />

      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-bold servi-grey-font">Listado de Chequeos</h2>
          <p class="text-sm servi-grey-font">Historial de chequeos completos realizados</p>
        </div>
        <button @click="abrirModal"
          class="servi-blue cursor-pointer rounded-full text-white font-bold py-2 px-4 shadow-sm border border-gray-100 hover:opacity-80 transition-all flex items-center gap-2 active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Realizar Chequeo
        </button>
      </div>

      <!-- Tabla desktop -->
      <div class="hidden md:block servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-white servi-blue uppercase">
            <tr>
              <th class="px-5 py-3">ID</th>
              <th class="px-5 py-3">Fecha</th>
              <th class="px-5 py-3">OT</th>
              <th class="px-5 py-3">Patente</th>
              <th class="px-5 py-3">Vehículo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="chequeo in chequeos" :key="chequeo.id" @click="verChequeo(chequeo.id)"
              class="hover:opacity-80 transition-colors cursor-pointer">
              <td class="px-5 py-3.5 font-bold servi-grey-font">#{{ chequeo.id }}</td>
              <td class="px-5 py-3.5 servi-grey-font">{{ formatFecha(chequeo.created_at) }}</td>
              <td class="px-5 py-3.5 servi-grey-font">#{{ chequeo.orden_trabajo?.id || '—' }}</td>
              <td class="px-5 py-3.5">
                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 font-bold rounded text-xs">
                  {{ chequeo.orden_trabajo?.vehiculo?.patente || 'S/P' }}
                </span>
              </td>
              <td class="px-5 py-3.5 servi-grey-font">
                {{ chequeo.orden_trabajo?.vehiculo?.marca }} {{ chequeo.orden_trabajo?.vehiculo?.modelo }}
              </td>
            </tr>
            <tr v-if="chequeos.length === 0">
              <td colspan="5" class="px-5 py-8 text-center servi-grey-font">
                No hay chequeos registrados
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards mobile -->
      <div class="md:hidden space-y-3">
        <div v-for="chequeo in chequeos" :key="chequeo.id" @click="verChequeo(chequeo.id)"
          class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:opacity-80 transition-all active:scale-[0.98]">
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold servi-grey-font">#{{ chequeo.id }}</span>
            <span class="text-xs servi-grey-font">{{ formatFecha(chequeo.created_at) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="px-2 py-1 bg-yellow-100 text-yellow-800 font-bold rounded text-xs">
              {{ chequeo.orden_trabajo?.vehiculo?.patente || 'S/P' }}
            </span>
            <span class="text-sm servi-grey-font">
              {{ chequeo.orden_trabajo?.vehiculo?.marca }} {{ chequeo.orden_trabajo?.vehiculo?.modelo }}
            </span>
          </div>
          <p class="text-xs servi-grey-font mt-2">OT #{{ chequeo.orden_trabajo?.id || '—' }}</p>
        </div>
        <div v-if="chequeos.length === 0" class="servi-adapt-bg rounded-xl p-10 text-center shadow-sm border border-gray-100">
          <p class="servi-grey-font text-lg">No hay chequeos registrados</p>
          <p class="text-sm servi-grey-font">Realiza un chequeo completo para comenzar.</p>
        </div>
      </div>
    </div>

    <!-- Modal seleccionar OT -->
    <div v-if="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="servi-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[80vh] flex flex-col">
        <!-- Header -->
        <div class="p-5 servi-blue border-b border-gray-100 flex justify-between items-center shrink-0">
          <h3 class="text-lg font-bold text-white">Seleccionar Orden de Trabajo</h3>
          <button @click="mostrarModal = false" class="text-white hover:opacity-70 cursor-pointer transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Lista de OTs -->
        <div class="overflow-y-auto flex-1 divide-y divide-gray-100">
          <div v-for="ot in misOTs" :key="ot.id" @click="seleccionarOT(ot)"
            class="p-4 cursor-pointer hover:bg-gray-50 transition-colors active:scale-[0.98]">
            
            <!-- Info del vehículo -->
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold servi-grey-font text-base">OT #{{ ot.id }}</span>
              <span class="px-2 py-1 bg-yellow-100 text-yellow-800 font-bold rounded text-xs">
                {{ ot.vehiculo?.patente || 'S/P' }}
              </span>
            </div>
            <div class="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 servi-grey-font opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
              </svg>
              <span class="text-sm servi-grey-font">{{ ot.vehiculo?.marca }} {{ ot.vehiculo?.modelo }} {{ ot.vehiculo?.anio || '' }}</span>
              <span v-if="ot.vehiculo?.color" class="text-xs servi-grey-font opacity-60">· {{ ot.vehiculo.color }}</span>
            </div>

            <!-- Info del cliente -->
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 servi-grey-font opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="text-sm servi-grey-font">
                {{ ot.ficha_de_trabajo?.cliente?.nombre }} {{ ot.ficha_de_trabajo?.cliente?.apellido }}
              </span>
              <span v-if="ot.ficha_de_trabajo?.cliente?.telefono" class="text-xs servi-grey-font opacity-60">
                · +56 {{ ot.ficha_de_trabajo.cliente.telefono }}
              </span>
            </div>

            <p v-if="ot.diagnostico" class="text-xs servi-grey-font mt-2 truncate opacity-70">{{ ot.diagnostico }}</p>
          </div>

          <!-- Sin OTs -->
          <div v-if="misOTs.length === 0" class="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto servi-grey-font opacity-30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="servi-grey-font font-medium">No tienes OTs asignadas</p>
            <p class="text-sm servi-grey-font opacity-60 mt-1">Debes tener OTs activas para realizar un chequeo.</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-100 shrink-0">
          <button @click="mostrarModal = false"
            class="w-full py-2.5 rounded-xl font-bold servi-grey-font servi-yellow transition-transform active:scale-95 cursor-pointer">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
