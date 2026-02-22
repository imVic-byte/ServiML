<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../../lib/supabaseClient.js'
import navbar from '../../components/componentes/navbar.vue'
import { useInterfaz } from '../../stores/interfaz.js'
import fichaListadoPorEntregar from '../../components/vehiculos/fichaListadoPorEntregar.vue'
import volver from '../../components/componentes/volver.vue'

const uiStore = useInterfaz()
const router = useRouter()
const route = useRoute()
const listadoFichas = ref([])
const estados = ref([])

const handleVehiculosEnTaller = async () => {
  try {
    const { data, error } = await supabase
      .from('ficha_de_trabajo')
      .select('id, estado, cliente(*), orden_trabajo(*, vehiculo(*))')
      .eq('id_taller', route.params.taller)
      .in('estado', [4, 5])
    if (error) throw error
    listadoFichas.value = data

  } catch (error) {
    console.error('Error al obtener OTs activas:', error)
  }
}

const handleEstados = async () => {
    const { data, error } = await supabase.from('tabla_estados_ficha').select('*')
    if (error) throw error
    estados.value = data
}

const obtenerEstado = (ficha) => {
    if (!ficha) return { estado: 'Sin ficha', color: '#9ca3af', texto: '#fff' }
    return estados.value.find(e => e.id === ficha.estado) || { estado: 'Desconocido', color: '#9ca3af', texto: '#fff' }
}

onMounted(async () => {
    uiStore.showLoading()
    await handleVehiculosEnTaller()
    await handleEstados()
    uiStore.hideLoading()
})
</script>

<template>
  <div class="servi-white min-h-screen pb-15">
    <navbar :titulo="'ServiMl'" subtitulo="Trabajos por entregar" search-input="false" class="sticky top-0 z-50"/>
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <volver />
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-bold servi-grey-font">Trabajos por Entregar</h2>
          <p class="text-sm servi-grey-font">{{ listadoFichas.length }} trabajo{{ listadoFichas.length !== 1 ? 's' : '' }} en espera de entrega.</p>
        </div>
      </div>
      <div class="hidden md:block servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <fichaListadoPorEntregar :fichas="listadoFichas" :estados="estados" />
      </div>
      <!-- Mobile: cards -->
      <div class="md:hidden grid grid-cols-1 gap-4">
        <div 
          v-for="ficha in listadoFichas" 
          :key="ficha.id"
          class="servi-adapt-bg rounded-xl shadow-sm overflow-hidden border-t-4 transition-all hover:shadow-md cursor-pointer"
          :style="{ borderTopColor: obtenerEstado(ficha).color }"
        >
          <div class="p-4">
            <!-- Header: Patente + Estado -->
            <div class="flex justify-between items-center mb-3">
              <div class="flex items-center gap-2">
                <span class="text-xl font-black servi-grey-font tracking-wide">#{{ ficha.id }}</span>
              </div>
              <span 
                class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-sm"
                :style="{ backgroundColor: obtenerEstado(ficha).color }"
              >
                {{ obtenerEstado(ficha).estado }}
              </span>
            </div>

            <div v-for="(ot, i) in ficha.orden_trabajo" :key="i" class="text-sm font-bold servi-grey-font mb-3">
              N° {{ i+1 }} - {{ [ot.vehiculo.patente, ot.vehiculo.marca, ot.vehiculo.modelo].filter(Boolean).join(' · ') }}
            </div>

            <!-- Diagnóstico -->
            <div class="mb-3">
              <p class="text-[10px] uppercase font-black text-gray-400 mb-0.5 tracking-widest">Diagnóstico/Motivo</p>
              <p class="text-sm servi-grey-font leading-relaxed line-clamp-2">
                {{ ficha.motivo_ingreso || 'Sin motivo ingreso' }}
              </p>
            </div>

            <!-- Cliente -->
            <div v-if="ficha.cliente" class="flex items-center gap-3 pt-3 border-t border-gray-100 mt-2">
              <div class="w-9 h-9 rounded-full servi-blue flex items-center justify-center shrink-0 shadow-sm">
                <span class="text-sm font-black text-white">{{ ficha.cliente.nombre?.charAt(0)?.toUpperCase() || '?' }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-bold servi-grey-font truncate">
                  {{ ficha.cliente.nombre }} {{ ficha.cliente.apellido }}
                </p>
                <div class="flex items-center gap-3 mt-0.5">
                  <span v-if="ficha.cliente.telefono" class="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    +569 {{ ficha.cliente.telefono }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="listadoFichas.length === 0" class="servi-adapt-bg rounded-xl p-10 text-center shadow-sm border border-gray-100">
          <p class="servi-grey-font text-lg font-bold">No hay vehículos en taller actualmente</p>
          <p class="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Todos los vehículos han sido entregados.</p>
        </div>
      </div>


    </div>
  </div>
</template>