<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabaseClient.js'
import { useUserStore } from '../../stores/user.js'
import { useInterfaz } from '@/stores/interfaz.js'
import navbar from '@/components/componentes/navbar.vue'
import cardOT from '@/components/ordenTrabajo/ordendetrabajoCard.vue'

const userStore = useUserStore()
const interfaz = useInterfaz()
const historial = ref([])
const estados = ref([])
const cargando = ref(true)

const cargarHistorial = async () => {
    cargando.value = true
    const { data, error } = await supabase
        .from('orden_trabajo')
        .select('*')
        .eq('id_empleado', userStore.user.id)
        .order('fecha_ingreso', { ascending: false })
    if (error) {
        console.error(error)
    } else {
        historial.value = data
        const {data:dataDemas, error:ErrorDemas} = await supabase
            .from('orden_trabajo')
            .select('*, cliente(*), vehiculo(*), presupuesto(*)')
            .in('id', historial.value.map(ot => ot.id))
        if (ErrorDemas) {
            console.error(ErrorDemas)
        } else {
            historial.value = dataDemas
        }
    }
    cargando.value = false
}

const handleObtenerEstados = async () => {
    const { data, error } = await supabase
        .from('tabla_estados')
        .select('*')
    if (error) {
        console.error(error)
    } else {
        estados.value = data
    }
}

const handleEstados = (idEstado) => {
    return estados.value.find(estado => estado.id === idEstado) || { id: idEstado, estado: 'Desconocido', color: '#9CA3AF', texto: '#FFFFFF' }
}

onMounted( async () => {
    interfaz.showLoading()
    await handleObtenerEstados()
    await cargarHistorial()
    interfaz.hideLoading()
})
</script>

<template>
    <div class="servi-white min-h-screen">
    <navbar titulo="Historial" subtitulo="Registro de actividades" class="navbar"/>

    <div class="max-w-4xl mx-auto p-4 pb-20">
        
        <div v-if="cargando" class="flex justify-center py-10">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>

        <div v-else-if="historial.length === 0" class="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-gray-100 rounded-xl servi-adapt-bg">
            <div class="servi-adapt-bg p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 servi-grey-font" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            </div>
            <h3 class="text-lg font-bold servi-white-font mb-1">No hay historial disponible</h3>
            <p class="servi-grey-font max-w-sm">Aún no tienes órdenes de trabajo registradas en tu historial. Cuando realices trabajos, aparecerán aquí.</p>
        </div>

        <div v-else class="space-y-4 md:grid md:grid-cols-2 md:gap-4">
            <cardOT v-for="orden in historial" :key="orden.id" :orden="orden" :estado="handleEstados(orden.estado_actual_id)" />
        </div>

    </div>
    </div>
</template>