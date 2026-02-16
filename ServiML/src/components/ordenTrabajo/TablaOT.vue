<script setup>
import {useRouter} from 'vue-router'
const router = useRouter()
defineProps({
    item: {
        type: Object,
        required: true
    }
})
</script>
<template>
    <tbody class="divide-y divide-gray-100">
        <RouterLink
            :to="{ name: 'ver-orden-de-trabajo', params: { id: item.id } }"
            custom
            v-slot="{ navigate, href }"
        >
            <tr
                class="servi-adapt-bg hover:bg-gray-50 transition-colors cursor-pointer"
                :href="href"
                @click="navigate"
                tabindex="0"
                @keydown.enter="navigate"
            >
                <td class="px-6 py-4 font-medium text-gray-900">{{ item.presupuesto.numero_folio }}</td>
                <td class="px-6 py-4">{{ item.vehiculo.patente }}</td>
                <td class="px-6 py-4">{{ item.motivo_ingreso }}</td>
                <td class="px-6 py-4">
                    <span :style="`background-color: ${item.estado.color}`" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-black">{{ item.estado.estado }}</span>
                </td>
            </tr>
        </RouterLink>
    </tbody>
</template>