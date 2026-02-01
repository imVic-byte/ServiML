<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabaseClient.js'
import navbar from '../../components/componentes/navbar.vue'
import cargando from '../../components/componentes/cargando.vue'

const loading = ref(true)
const router = useRouter()
const vehiculos = ref([])
const estados = ref([])

const redirigir = async (id) => {
    router.push({ name: 'ver-orden-de-trabajo', params: { id } })    
}

const handleEstados = async () => {
    const { data, error } = await supabase
        .from('tabla_estados')
        .select('*')
    if (error) {
        console.error('Error fetching estados:', error)
    } else {
        estados.value = data
    }
}

const estadoPorId = (id) => {
    const estado = estados.value.find(e => e.id === id)
    return estado ? estado.estado : 'Desconocido'
}

const colorPorId = (id) => {
    const estado = estados.value.find(e => e.id === id)
    return estado ? estado.color : '#CCCCCC'
}

const handleVehiculos = async () => {
    const { data, error } = await supabase
        .from('orden_trabajo')
        .select('*, vehiculo(*)')
        .not('estado_actual_id', 'in', '(7,8,1,10)')
    if (error) {
        console.error('Error fetching vehiculos en taller:', error)
    } else {
        vehiculos.value = data
    }
    loading.value = false
}

onMounted(async () => {
    await handleEstados()
    await handleVehiculos()
})
</script>

<template>
    <cargando v-if="loading" />
    <div v-else class="min-h-screen bg-gray-50">
        <navbar :titulo="'ServiMl'" subtitulo="Vehículos en taller" search-input="true" />
        
        <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div 
                    v-for="orden in vehiculos" 
                    :key="orden.id"
                    class="bg-white rounded-lg shadow-md overflow-hidden border-t-4 transition-transform hover:scale-105"
                    :style="{ borderTopColor: colorPorId(orden.estado_actual_id) }"
                >
                    <div class="p-4">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <p class="text-xs uppercase font-bold text-gray-400">Patente</p>
                                <h3 class="text-xl font-black servi-blue-font">
                                    {{ orden.vehiculo.patente }}
                                </h3>
                            </div>
                            <span 
                                class="px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm"
                                :style="{ backgroundColor: colorPorId(orden.estado_actual_id), color: '#fff' }"
                            >
                                {{ estadoPorId(orden.estado_actual_id) }}
                            </span>
                        </div>

                        <div class="mb-4">
                            <p class="text-xs uppercase font-bold text-gray-400">Motivo de Ingreso</p>
                            <p class="text-sm text-gray-700 leading-relaxed">
                                {{ orden.motivo_ingreso }}
                            </p>
                        </div>

                        <div class="flex justify-between items-center pt-4 border-t border-gray-100">
                            <button 
                                @click="redirigir(orden.id)"
                                class="servi-blue servi-yellow-font px-4 py-2 rounded text-sm font-bold w-full transition-colors hover:opacity-90"
                            >
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="vehiculos.length === 0" class="text-center py-20">
                <p class="text-gray-500 font-medium">No hay vehículos en taller actualmente.</p>
            </div>
        </div>
    </div>
</template>