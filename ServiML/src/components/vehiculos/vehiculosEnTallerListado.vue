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

const redirigir = (id) => {
    router.push({ name: 'ver-orden-de-trabajo', params: { id } })
}
</script>

<template>
    <div class="hidden md:block servi-adapt-bg rounded-xl shadow-sm border border-gray-800 overflow-hidden">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="servi-blue servi-yellow-font text-xs uppercase tracking-wider border-b border-gray-800">
                    <th class="p-4 font-semibold">Patente</th>
                    <th class="p-4 font-semibold">Vehículo</th>
                    <th class="p-4 font-semibold">Cliente</th>
                    <th class="p-4 font-semibold">Motivo ingreso</th>
                    <th class="p-4 font-semibold text-center">Estado</th>
                    <th class="p-4 font-semibold text-center">OT</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-800">
                <tr 
                    v-for="vehiculo in lista" 
                    :key="vehiculo.id"
                    class="hover:opacity-80 transition-colors cursor-pointer"
                    @click="vehiculo.orden_trabajo && redirigir(vehiculo.orden_trabajo.id)"
                >
                    <td class="p-4">
                        <span class="servi-adapt-bg servi-white-font px-2 py-1 rounded text-xs font-bold uppercase">
                            {{ vehiculo.patente }}
                        </span>
                    </td>
                    <td class="p-4 text-sm servi-grey-font">
                        {{ [vehiculo.marca, vehiculo.modelo, vehiculo.anio].filter(Boolean).join(' ') || '—' }}
                    </td>
                    <td class="p-4 text-sm servi-white-font">
                        <template v-if="vehiculo.orden_trabajo?.cliente">
                            <p class="font-medium">{{ vehiculo.orden_trabajo.cliente.nombre }} {{ vehiculo.orden_trabajo.cliente.apellido }}</p>
                            <p v-if="vehiculo.orden_trabajo.cliente.telefono" class="text-xs servi-grey-font">{{ vehiculo.orden_trabajo.cliente.telefono }}</p>
                        </template>
                        <span v-else class="servi-grey-font">—</span>
                    </td>
                    <td class="p-4 text-sm servi-grey-font max-w-xs truncate">
                        {{ vehiculo.orden_trabajo?.motivo_ingreso || '—' }}
                    </td>
                    <td class="p-4 text-center">
                        <span 
                            class="px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                            :style="{ backgroundColor: obtenerEstado(vehiculo.orden_trabajo).color, color: '#fff' }"
                        >
                            {{ obtenerEstado(vehiculo.orden_trabajo).estado }}
                        </span>
                    </td>
                    <td class="p-4 text-center">
                        <span v-if="vehiculo.orden_trabajo" class="text-sm font-bold servi-grey-font">#{{ vehiculo.orden_trabajo.id }}</span>
                        <span v-else class="servi-grey-font">—</span>
                    </td>
                </tr>
            </tbody>
        </table>
        <div v-if="lista.length === 0" class="p-10 text-center">
            <p class="servi-grey-font text-lg">No hay vehículos en taller actualmente</p>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mt-2 servi-grey-font" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
            </svg>
        </div>
    </div>
</template>
