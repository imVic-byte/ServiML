<script setup>
import { watch, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
    vehiculos: {
        type: Array,
        required: true
    },
    estados: {
        type: Array,
        required: true
    }
})

const lista = ref(props.vehiculos)

watch(() => props.vehiculos, (v) => {
    lista.value = v
})

const obtenerEstado = (orden) => {
    if (!orden) return { estado: 'Sin OT', color: '#9ca3af', texto: '#fff' }
    return props.estados.find(e => e.id === orden.estado_actual_id) || { estado: 'Desconocido', color: '#9ca3af', texto: '#fff' }
}
</script>

<template>
    <div class="hidden md:block servi-adapt-bg rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table class="w-full text-left">
            <thead>
                <tr class="servi-blue text-white text-xs uppercase tracking-wider">
                    <th class="p-4 font-bold">Patente</th>
                    <th class="p-4 font-bold">Vehículo</th>
                    <th class="p-4 font-bold">Cliente</th>
                    <th class="p-4 font-bold">Diagnóstico</th>
                    <th class="p-4 font-bold text-center">Estado OT</th>
                    <th class="p-4 font-bold text-center">Ficha</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                <tr 
                    v-for="item in lista" 
                    :key="item.id"
                    class="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                >
                    <td class="p-4">
                        <span class="servi-blue text-white px-2.5 py-1 rounded text-xs font-black tracking-wider uppercase shadow-sm">
                            {{ item.vehiculo?.patente || 'S/P' }}
                        </span>
                    </td>
                    <td class="p-4">
                        <div class="flex flex-col">
                            <span class="text-sm font-bold servi-grey-font">{{ item.vehiculo?.marca }} {{ item.vehiculo?.modelo }}</span>
                            <span v-if="item.vehiculo?.anio" class="text-[10px] uppercase font-bold text-gray-400">{{ item.vehiculo.anio }}</span>
                        </div>
                    </td>
                    <td class="p-4">
                        <div v-if="item.cliente" class="flex flex-col">
                            <span class="text-sm font-semibold servi-grey-font">{{ item.cliente.nombre }} {{ item.cliente.apellido }}</span>
                            <span v-if="item.cliente.telefono" class="text-[10px] font-bold text-gray-400">+569 {{ item.cliente.telefono }}</span>
                        </div>
                        <span v-else class="text-sm text-gray-300 italic">No asignado</span>
                    </td>
                    <td class="p-4">
                        <p class="text-sm servi-grey-font truncate max-w-[200px]" :title="item.diagnostico">
                            {{ item.diagnostico || 'Sin diagnóstico' }}
                        </p>
                    </td>
                    <td class="p-4 text-center">
                        <span 
                            class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-sm border border-white/20"
                            :style="{ backgroundColor: obtenerEstado(item).color, color: 'white' }"
                        >
                            {{ obtenerEstado(item).estado }}
                        </span>
                    </td>
                    <td class="p-4 text-center">
                        <span class="text-sm font-bold text-gray-400">#{{ item.id_ficha }}</span>
                    </td>
                </tr>
            </tbody>
        </table>
        
        <div v-if="lista.length === 0" class="p-16 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                </svg>
            </div>
            <p class="servi-grey-font text-xl font-bold">No hay vehículos en taller</p>
            <p class="text-sm text-gray-400 mt-1 uppercase tracking-widest font-bold">Todos los vehículos han sido entregados.</p>
        </div>
    </div>
</template>

