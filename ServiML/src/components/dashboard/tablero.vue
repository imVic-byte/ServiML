<script setup>
import { ref, onMounted, computed } from 'vue'
import {useRouter} from 'vue-router'
const router = useRouter()
import { supabase } from '../../lib/supabaseClient.js'
import TablaOT from '../ordenTrabajo/TablaOT.vue'
const ordenesTrabajo = ref([])
const estados = ref([])

const fetchEstados = async () => {
    const { data, error } = await supabase
        .from('tabla_estados')
        .select('*')
    if (error) {
        console.error('Error fetching estados:', error)
    } else {
        estados.value = data
    }
}

const fetchOrdenesTrabajo = async () => {
    const { data, error } = await supabase
        .from('orden_trabajo')
        .select(`
            id,
            motivo_ingreso,
            estado_actual_id,
            presupuesto (
                numero_folio
            ),
            vehiculo (
                patente
            )
        `)
        .order('id', { ascending: false })
        .limit(5)
    if (error) {
        console.error('Error fetching ordenes de trabajo:', error)
    } else {
        ordenesTrabajo.value = data
    }
}

const ordenesConEstado = computed(() => {
    return ordenesTrabajo.value.map(ot => {
        const estado = estados.value.find(e => e.id === ot.estado_actual_id)
        return {
            ...ot,
            estado: estado || { estado: 'Desconocido', color: '#CCCCCC' }
        }
    })
})

const handleRedirect = () => {
    router.push({ name: 'ordenes-de-trabajo' })
}

onMounted(async () => {
    await fetchEstados()
    await fetchOrdenesTrabajo()
})
</script>
<template>
    <div class="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100">
                        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 class="font-bold text-gray-800 text-lg">Flujo de Trabajo Reciente</h3>
                            <button @click="handleRedirect" class="text-blue-600 cursor-pointer text-sm font-medium hover:text-blue-800 transition-colors">Ver tablero completo</button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm text-left text-gray-500">
                                <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3">Orden</th>
                                        <th class="px-6 py-3">Vehículo</th>
                                        <th class="px-6 py-3">Servicio</th>
                                        <th class="px-6 py-3">Estado</th>
                                    </tr>
                                </thead>
                                    <TablaOT
                                        v-for="item in ordenesConEstado"
                                        :key="item.id"
                                        :item="item">
                                    </TablaOT>
                            </table>
                        </div>
                    </div>
</template>