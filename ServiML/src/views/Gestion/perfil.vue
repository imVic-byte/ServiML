<script setup>
import { useUserStore } from '../../stores/user.js'
import { useInterfaz } from '@/stores/interfaz.js';
import { ref, onMounted } from 'vue';
import navbar from '@/components/componentes/navbar.vue';
import { supabase } from '@/lib/supabaseClient.js'

const listOT = ref([])
const userStore = useUserStore()
const interfaz = useInterfaz()

const usuario = ref(userStore.user)
const trabajador = ref(userStore.trabajador)

const otFinalizadas = ref(0)
const otPendientes = ref(0)
const otEnProceso = ref(0)
const otCanceladas = ref(0)

const handleTraerOT = async () => {
    const { data, error } = await supabase
        .from('orden_trabajo')
        .select('*')
        .eq('id_empleado', userStore.user.id)
    if (error) {
        console.error(error)
    } else {
        listOT.value = data
        handleFiltrarOTs()
    }
}

const handleFiltrarOTs = () => {
    if (!listOT.value) return
    otFinalizadas.value = listOT.value.filter(ot => ot.estado_actual_id === 7).length
    otPendientes.value = listOT.value.filter(ot => ot.estado_actual_id === 10).length
    otEnProceso.value = listOT.value.filter(ot => [11, 2, 3, 4, 5, 6].includes(ot.estado_actual_id)).length
    otCanceladas.value = listOT.value.filter(ot => ot.estado_actual_id === 8).length
}

onMounted(async () => {
    interfaz.showLoading()
    await handleTraerOT()
    interfaz.hideLoading()
})
</script>

<template>
    <div class="w-full min-h-screen servi-white">
        <navbar titulo="Perfil" subtitulo="Información del usuario" class="navbar"/>
        
        <div class="max-w-4xl mx-auto p-4 space-y-6 pb-30 servi-grey-font">
        
        <div class="servi-adapt-bg border border-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div class="servi-blue p-6 flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <div class="p-3 servi-adapt-bg/10 rounded-full text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold servi-white-font">{{ trabajador?.nombre || 'Usuario' }} {{ trabajador?.apellido || '' }}</h1>
                        <p class="text-blue-100 text-sm font-medium">{{ userStore.WhatIsMyRole || 'Sin Rol Asignado' }}</p>
                    </div>
                </div>
            </div>

            <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="flex items-center gap-3 p-3 rounded-lg servi-blue">
                    <div class="text-blue-500 bg-blue-100 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <p class="text-xs servi-grey-font uppercase font-bold">Email</p>
                        <p class="servi-grey-font font-medium">{{ usuario?.email || 'No registrado' }}</p>
                    </div>
                </div>

                <div class="flex items-center gap-3 p-3 rounded-lg servi-blue">
                    <div class="text-green-500 bg-green-100 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </div>
                    <div>
                        <p class="text-xs servi-grey-font uppercase font-bold">Teléfono</p>
                        <p class="servi-grey-font font-medium">+56 {{ trabajador?.telefono || '--' }}</p>
                    </div>
                </div>

                <div class="flex items-center gap-3 p-3 rounded-lg servi-blue">
                    <div class="text-purple-500 bg-purple-100 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                    </div>
                    <div>
                        <p class="text-xs servi-grey-font uppercase font-bold">RUT</p>
                        <p class="servi-grey-font font-medium">{{ trabajador?.rut || 'No registrado' }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold servi-grey-font flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 servi-grey-font" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Métricas de OTs
                </h2>
                <button class="text-sm servi-grey-font font-semibold hover:underline flex items-center gap-1" @click="$router.push('/perfil/historial')">
                    Ver historial completo
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div class="servi-adapt-bg p-4 rounded-xl border border-gray-800 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                    <div class="p-3 bg-green-100 text-green-600 rounded-full mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <span class="text-3xl font-bold servi-grey-font">{{ otFinalizadas }}</span>
                    <span class="text-sm servi-grey-font font-medium">Finalizadas</span>
                </div>

                <div class="servi-adapt-bg p-4 rounded-xl border border-gray-800 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                    <div class="p-3 bg-blue-100 text-blue-600 rounded-full mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <span class="text-3xl font-bold servi-grey-font">{{ otEnProceso }}</span>
                    <span class="text-sm servi-grey-font font-medium">En Proceso</span>
                </div>

                <div class="servi-adapt-bg p-4 rounded-xl border border-gray-800 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                    <div class="p-3 bg-yellow-100 text-yellow-600 rounded-full mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span class="text-3xl font-bold servi-grey-font">{{ otPendientes }}</span>
                    <span class="text-sm servi-grey-font font-medium">Pendientes</span>
                </div>

                <div class="servi-adapt-bg p-4 rounded-xl border border-gray-800 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                    <div class="p-3 bg-red-100 text-red-600 rounded-full mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <span class="text-3xl font-bold servi-grey-font">{{ otCanceladas }}</span>
                    <span class="text-sm servi-grey-font font-medium">Canceladas</span>
                </div>

            </div>
        </div>
    </div>
    </div>
</template>