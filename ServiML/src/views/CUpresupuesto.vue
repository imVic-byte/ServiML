<script setup>
import { ref, computed } from 'vue'
import navbar from "../components/navbar.vue"
import { supabase } from "../lib/supabaseClient.js"

const patente = ref('')
const tipoPresupuesto = ref('Simple')
const diagnostico = ref('')
const descuento = ref(0)
const incremento = ref(0)
const cliente = ref('')
const items = ref([])
const ivaPorcentaje = ref(0)
const ivaBoolean = ref(false)

const agregarItem = () => {
  items.value.push({ descripcion: '', monto: 0 })
}

const eliminarItem = (index) => {
  items.value.splice(index, 1)
}
const totales = computed(() => {
  const subtotal = items.value.reduce((acc, item) => acc + (Number(item.monto) || 0), 0)
  
  if (tipoPresupuesto.value === 'Simple') {
    if (ivaBoolean.value === true) {
      const neto = subtotal - descuento.value + incremento.value
      const iva = neto * (19 / 100)
      const final = neto + iva
      return {
        subtotal,
        descuento: 0,
        incremento: 0,
        neto,
        iva,
        total_final: final
      }
    } else {
      return {
        subtotal,
        descuento: 0,
        incremento: 0,
        neto: subtotal,
        iva: 0,
        total_final: subtotal
      }
    }
  } else {
    const neto = subtotal - descuento.value + incremento.value
    const iva = neto * (ivaPorcentaje.value / 100)
    const final = neto + iva

    return {
      subtotal,
      descuento: descuento.value,
      incremento: incremento.value,
      neto,
      iva,
      total_final: final
    }
  }
})

const formatearMoneda = (valor) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(valor)
}
const enviarFormulario = async () => {
  const error = ref('')
  try {
    const {data:{session}, error: sessionError} = await supabase.auth.getSession()
    if (sessionError || !session) {
      alert("Tu sesión ha expirado. Por favor, relogueate.")
      return
    }
    const { data, error:invokeError } = await supabase.functions.invoke('crear-presupuesto', {
      body: {
        patente: patente.value,
        cliente: cliente.value,
        diagnostico: diagnostico.value,
        subtotal: totales.value.subtotal,
        descuento: totales.value.descuento,
        incremento: totales.value.incremento,
        total_neto: totales.value.neto,
        iva: totales.value.iva,
        total_final: totales.value.total_final,
        detalles: items.value
      }
    })
    if (invokeError) throw invokeError
    return {success: true, data}
  } catch (err) {
    error.value = err.message
    console.error("Error al guardar el presupuesto:", err)
    return {success:false, error:err.message }
  }
}
</script>
<template>
  <navbar titulo="ServiML" subtitulo="Crear Presupuesto" />
  
  <div class="pb-28 mx-auto p-4 max-w-lg">
    <div class="flex items-center justify-center gap-2 my-4 bg-gray-100 p-1 rounded-lg font-bold">
      <button class="flex-1 px-4 py-2 rounded-full transition-all font-medium text-sm"
        @click="tipoPresupuesto = 'Simple'"
        :class="tipoPresupuesto === 'Simple' ? 'activo shadow-sm' : 'text-gray-500 hover:text-gray-700'"
      >Simple</button>
      <button class="flex-1 px-4 py-2 rounded-full transition-all font-medium text-sm"
        @click="tipoPresupuesto = 'Detallado'"
        :class="tipoPresupuesto === 'Detallado' ? 'activo shadow-sm' : 'text-gray-500 hover:text-gray-700'"
      >Detallado</button>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Datos del Vehículo</label>
      <input v-model="patente" type="text" placeholder="Patente (Ej: ABCD-12)" class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200 focus:ring-2 focus:ring-blue-900/20" />
      <div v-if="tipoPresupuesto === 'Detallado'">
        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente</label>
        <input v-model="cliente" type="text" placeholder="Cliente" class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200 focus:ring-2 focus:ring-blue-900/20" />
      </div>
      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Diagnóstico</label>
      <textarea v-model="diagnostico" rows="2" placeholder="Descripción de la falla..." class="w-full p-2 border border-gray-100 rounded-lg bg-gray-200 focus:ring-2 focus:ring-blue-900/20"></textarea>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <h3 class="text-sm font-bold text-gray-700 mb-3">Ítems y Repuestos</h3>
      <div v-for="(item, index) in items" :key="index" class="flex gap-2 mb-2">
        <input v-model="item.descripcion" type="text" placeholder="Descripción" class="flex-1 p-2 border border-gray-100 bg-gray-200 rounded-lg text-sm" />
        <input v-model.number="item.monto" type="number" placeholder="0" class="w-24 p-2 border border-gray-100 bg-gray-200 rounded-lg text-right text-sm" />
        <button @click="eliminarItem(index)" class="text-red-400 hover:text-red-600 px-1">✕</button>
      </div>
      <button @click="agregarItem" class="servi-blue rounded-lg py-1 px-2 servi-yellow-font text-sm font-medium hover:underline mt-2">+ Agregar ítem</button>
    </div>
    

    <div v-if="tipoPresupuesto === 'Simple'" class="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
      <div class="flex items-center justify-center gap-2 my-4 bg-gray-100 p-1 rounded-lg font-bold">
      <button class="flex-1 px-4 py-2 rounded-full transition-all font-medium text-sm"
        @click="ivaBoolean = true"
        :class="ivaBoolean === true ? 'activo shadow-sm' : 'text-gray-500 hover:text-gray-700'"
      >IVA</button>
      <button class="flex-1 px-4 py-2 rounded-full transition-all font-medium text-sm"
        @click="ivaBoolean = false"
        :class="ivaBoolean === false ? 'activo shadow-sm' : 'text-gray-500 hover:text-gray-700'"
      >Sin IVA</button>
    </div>
      <p class="text-gray-500 text-sm mb-1">Total Estimado</p>
      <p class="text-3xl font-bold servi-blue-font">{{ formatearMoneda(totales.total_final) }}</p>
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 class="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Desglose Financiero</h3>
      
      <div class="flex justify-between items-center mb-2 text-sm">
        <span class="text-gray-600">Subtotal Neto</span>
        <span class="font-medium">{{ formatearMoneda(totales.subtotal) }}</span>
      </div>

      <div class="flex justify-between items-center mb-2 text-sm">
        <span class="text-gray-600">Descuento (-)</span>
        <input v-model.number="descuento" type="number" class="w-24 p-1 border border-gray-100 bg-gray-200 rounded text-right text-gray-700" />
      </div>

      <div class="flex justify-between items-center mb-2 text-sm">
        <span class="text-gray-600">Incremento/Extras (+)</span>
        <input v-model.number="incremento" type="number" class="w-24 p-1 border border-gray-100 bg-gray-200 rounded text-right text-gray-700" />
      </div>

      <div class="flex justify-between items-center mb-3 text-sm">
        <span class="text-gray-600">IVA (%)</span>
        <input v-model.number="ivaPorcentaje" type="number" class="w-24 p-1 border border-gray-100 bg-gray-200 rounded text-right text-gray-700" />
      </div>

      <div class="flex justify-between items-center pt-3 border-t">
        <span class="font-bold text-gray-800">TOTAL FINAL</span>
        <span class="font-bold text-xl text-blue-900">{{ formatearMoneda(totales.total_final) }}</span>
      </div>
    </div>

    <button @click="enviarFormulario" class="w-full mt-6 servi-blue servi-yellow-font py-3 rounded-lg font-bold shadow-lg hover:bg-blue-800 transition-colors">
      Guardar Presupuesto
    </button>

  </div>
</template>

<style scoped>
.activo {
  background-color: #1f3d64;
  color: #D8B462;
} 
</style>