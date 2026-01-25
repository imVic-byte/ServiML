<script setup>
import {ref,onMounted} from 'vue'
import {supabase} from '../../lib/supabaseClient.js'
defineProps(['modelValue'])
const emit=defineEmits(['update:modelValue'])
const presupuestos = ref([])
const dosemanas = new Date()
dosemanas.setDate(dosemanas.getDate() - 14)
const obtenerPresupuestos = async () => {
    const {data,error} = await supabase
    .from('presupuesto')
    .select('*,vehiculo(*)')
    .eq('estado', 'Confirmado')
    .gte('created_at', dosemanas.toISOString())
    .order('created_at', {ascending: false})
    if (data) {
        presupuestos.value = data
    }
}
onMounted(() => {
    obtenerPresupuestos()
})
</script>
<template>
    <select 
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
      class="rounded-xl mx-4 px-4 py-2 servi-blue servi-white-font font-bold"
    >
      <option value="" class="servi-white-font px-4 py-2 mx-4 " disabled>Seleccionar Presupuesto</option>
      <option v-for="p in presupuestos" :key="p.id" :value="p.id" class="servi-white-font px-4 py-2 mx-4 w-52">
        No. {{ p.numero_folio }} - Patente: {{ p.vehiculo.patente }}
      </option>
    </select>
</template>