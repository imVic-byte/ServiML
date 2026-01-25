<script setup>
import subirFotos from "../../components/componentes/subir-fotos.vue"
const props = defineProps({
    data: {
        type: Object,
        required: true
    }
})
console.log(props.data)
const formatearDinero = (cantidad) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(cantidad)
}

const formatearFecha = (fechaString) => {
  if (!fechaString) return '---'
  const fecha = new Date(fechaString)
  return fecha.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
    <RouterLink :to="`/ordenes-de-trabajo/ver/${props.data.id}`" class="flex flex-col gap-2">
            <div class="border border-gray-200 rounded-lg p-4 shadow-lg flex justify-between">
                <span class="folio">#{{ props.data.presupuesto.numero_folio }}</span>
                <span class="badge-confirmado">{{props.data.estado}}</span>
            </div>
    </RouterLink>
</template>
<style>
</style>
