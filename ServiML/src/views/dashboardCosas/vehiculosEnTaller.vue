<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabaseClient.js'
import navbar from '../../components/componentes/navbar.vue'
import { useInterfaz } from '../../stores/interfaz.js'
import vehiculosEnTallerListado from '../../components/vehiculos/vehiculosEnTallerListado.vue'

const uiStore = useInterfaz()
const router = useRouter()
const vehiculos = ref([])
const estados = ref([])

const redirigir = (id) => {
    router.push({ name: 'ver-orden-de-trabajo', params: { id } })    
}

const handleVehiculos = async () => {
    const { data, error } = await supabase.from('vehiculo').select('*').eq('en_taller', true)
    if (error) throw error
    vehiculos.value = data
}

const handleOT = async () => {
    await Promise.all(vehiculos.value.map(async (vehiculo) => {
        const { data, error } = await supabase
            .from('orden_trabajo')
            .select('*, cliente(*)')
            .eq('vehiculo_id', vehiculo.id)
            .order('created_at', { ascending: false })
            .limit(1)
        if (error) throw error
        vehiculo.orden_trabajo = data?.[0] || null
    }))
}

const handleEstados = async () => {
    const { data, error } = await supabase.from('tabla_estados').select('*')
    if (error) throw error
    estados.value = data
}

const obtenerEstado = (orden) => {
    if (!orden) return { estado: 'Sin OT', color: '#9ca3af', texto: '#fff' }
    return estados.value.find(e => e.id === orden.estado_actual_id) || { estado: 'Desconocido', color: '#9ca3af', texto: '#fff' }
}

onMounted(async () => {
    uiStore.showLoading()
    await handleVehiculos()
    await handleOT()
    await handleEstados()
    uiStore.hideLoading()
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen pb-15">
    <navbar :titulo="'ServiMl'" subtitulo="Vehículos en taller" search-input="false" class="sticky top-0 z-50"/>
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-bold servi-blue-font">Vehículos en Taller</h2>
          <p class="text-sm text-gray-500">{{ vehiculos.length }} vehículo{{ vehiculos.length !== 1 ? 's' : '' }} actualmente en taller</p>
        </div>
      </div>

      <!-- Desktop: tabla -->
      <vehiculosEnTallerListado :vehiculos="vehiculos" :estados="estados" />

      <!-- Mobile: cards -->
      <div class="md:hidden grid grid-cols-1 gap-4">
        <div 
          v-for="vehiculo in vehiculos" 
          :key="vehiculo.id"
          class="servi-adapt-bg rounded-xl shadow-sm overflow-hidden border-l-4 transition-all hover:shadow-md cursor-pointer"
          :style="{ borderLeftColor: obtenerEstado(vehiculo.orden_trabajo).color }"
          @click="vehiculo.orden_trabajo && redirigir(vehiculo.orden_trabajo.id)"
        >
          <div class="p-4">
            <!-- Header: Patente + Estado -->
            <div class="flex justify-between items-center mb-3">
              <div class="flex items-center gap-2">
                <span class="text-lg font-black servi-blue-font tracking-wide">{{ vehiculo.patente }}</span>
                <span v-if="vehiculo.orden_trabajo" class="text-xs text-gray-400 font-medium">#{{ vehiculo.orden_trabajo.id }}</span>
              </div>
              <span 
                class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase"
                :style="{ backgroundColor: obtenerEstado(vehiculo.orden_trabajo).color, color: '#fff' }"
              >
                {{ obtenerEstado(vehiculo.orden_trabajo).estado }}
              </span>
            </div>

            <!-- Info vehículo -->
            <div v-if="vehiculo.marca || vehiculo.modelo" class="text-xs text-gray-400 mb-3">
              {{ [vehiculo.marca, vehiculo.modelo, vehiculo.anio].filter(Boolean).join(' · ') }}
            </div>

            <!-- Motivo de ingreso -->
            <div v-if="vehiculo.orden_trabajo?.motivo_ingreso" class="mb-3">
              <p class="text-xs uppercase font-bold text-gray-400 mb-0.5">Motivo de ingreso</p>
              <p class="text-sm text-gray-700 leading-relaxed line-clamp-2">
                {{ vehiculo.orden_trabajo.motivo_ingreso }}
              </p>
            </div>

            <!-- Cliente -->
            <div v-if="vehiculo.orden_trabajo?.cliente" class="flex items-center gap-2 pt-3 border-t border-gray-100">
              <div class="w-7 h-7 rounded-full servi-blue flex items-center justify-center shrink-0">
                <span class="text-xs font-bold text-white">{{ vehiculo.orden_trabajo.cliente.nombre?.charAt(0)?.toUpperCase() || '?' }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-gray-800 truncate">
                  {{ vehiculo.orden_trabajo.cliente.nombre }} {{ vehiculo.orden_trabajo.cliente.apellido }}
                </p>
                <p v-if="vehiculo.orden_trabajo.cliente.telefono" class="text-xs text-gray-400 truncate">
                  {{ vehiculo.orden_trabajo.cliente.telefono }}
                </p>
              </div>
              <button 
                @click.stop="redirigir(vehiculo.orden_trabajo.id)"
                class="servi-blue servi-white-font px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90 shrink-0"
              >
                Ver OT
              </button>
            </div>

            <!-- Sin OT -->
            <div v-if="!vehiculo.orden_trabajo" class="pt-3 border-t border-gray-100">
              <p class="text-xs text-gray-400 italic">Sin orden de trabajo asociada</p>
            </div>
          </div>
        </div>

        <div v-if="vehiculos.length === 0" class="servi-adapt-bg rounded-xl p-10 text-center shadow-sm border border-gray-100">
          <p class="text-gray-500 text-lg">No hay vehículos en taller actualmente</p>
          <p class="text-sm text-gray-400">Todos los vehículos han sido entregados.</p>
        </div>
      </div>

    </div>
  </div>
</template>