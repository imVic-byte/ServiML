<script setup>
import {ref,onMounted} from 'vue'
import {supabase} from '../../lib/supabaseClient.js'
defineProps(['modelValue'])
const emit=defineEmits(['update:modelValue'])
const presupuestos = ref([])
const cargando = ref(false)
const dosemanas = new Date()
dosemanas.setDate(dosemanas.getDate() - 14)
const obtenerPresupuestos = async () => {
    cargando.value = true
    const {data,error} = await supabase
    .from('presupuesto')
    .select('*,vehiculo(*)')
    .gte('created_at', dosemanas.toISOString())
    .order('created_at', {ascending: false})
    .limit(10)
    if (data) {
        presupuestos.value = data
    }
    cargando.value = false
}
onMounted(() => {
    obtenerPresupuestos()
})
</script>
<template>
  <div class="contenedor-select flex flex-col justify-center items-center">
    <select 
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
      :disabled="cargando"
      class="rounded-xl mx-4 px-4 py-2 servi-blue servi-white-font font-bold"
    >
      <option value="" class="servi-white-font px-4 py-2 mx-4 " disabled>Seleccionar Presupuesto</option>
      <option v-for="p in presupuestos" :key="p.id" :value="p.id" class="servi-white-font px-4 py-2 mx-4 w-52">
        No. {{ p.numero_folio }} - Patente: {{ p.vehiculo.patente }}
      </option>
    </select>
    <span v-if="cargando" class="loading-text">Cargando datos...</span>
  </div>
</template>
<style scoped>
</style>