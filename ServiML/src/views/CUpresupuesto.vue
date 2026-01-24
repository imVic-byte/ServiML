<script setup>
import { ref, computed } from 'vue'
import navbar from "../components/componentes/navbar.vue"
import { useRouter } from 'vue-router'
import { supabase } from "../lib/supabaseClient.js"
const router = useRouter()
const patente = ref('')
const tipoPresupuesto = ref('Simple')
const diagnostico = ref('')
const descuento = ref(0)
const incremento = ref(0)
const cliente = ref('')
const items = ref([])
const ivaPorcentaje = ref(0)
const ivaBoolean = ref(false)

const modal = ref({ visible: false, titulo: '', mensaje: '', exito: true })
const redirigir = () => {
    if (modal.value.exito) {
        router.push({ name: 'presupuestos' })
    }
    else{
      modal.value.visible = false
    }
}
const agregarItem = () => items.value.push({ descripcion: '', monto: 0 })
const eliminarItem = (index) => items.value.splice(index, 1)

const totales = computed(() => {
  const subtotal = items.value.reduce((acc, item) => acc + (Number(item.monto) || 0), 0)
  
  let dsc = tipoPresupuesto.value === 'Simple' ? 0 : descuento.value
  let inc = tipoPresupuesto.value === 'Simple' ? 0 : incremento.value
  
  const total_neto = subtotal - dsc + inc
  
  let pctIva = 0
  if (tipoPresupuesto.value === 'Simple') {
    pctIva = ivaBoolean.value ? 19 : 0
  } else {
    pctIva = ivaPorcentaje.value
  }

  const iva = total_neto * (pctIva / 100)
  const total_final = total_neto + iva

  return { subtotal, descuento: dsc, incremento: inc, total_neto, iva, total_final }
})

const formatearMoneda = (valor) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(valor)
}

const enviarFormulario = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error("Sesión expirada")

    const { data, error } = await supabase.functions.invoke('crear-presupuesto', {
      body: {
        patente: patente.value,
        cliente: cliente.value,
        diagnostico: diagnostico.value,
        ...totales.value,
        detalles: items.value
      }
    })

    if (error) throw error

    modal.value = {
      visible: true,
      titulo: '¡Éxito!',
      mensaje: 'El presupuesto ha sido guardado correctamente.',
      exito: true
    }
  } catch (err) {
    modal.value = {
      visible: true,
      titulo: 'Error',
      mensaje: err.message || 'No se pudo guardar el presupuesto.',
      exito: false
    }
  }
}
</script>
<template>
  <navbar titulo="ServiML" subtitulo="Crear Presupuesto" />
  
  <div class="pb-28 mx-auto p-4 max-w-lg">
    <div class="flex items-center justify-center gap-2 my-4 bg-gray-100 p-1 rounded-lg font-bold">
      <button v-for="tipo in ['Simple', 'Detallado']" :key="tipo"
        @click="tipoPresupuesto = tipo"
        class="flex-1 px-4 py-2 rounded-full transition-all font-medium text-sm"
        :class="tipoPresupuesto === tipo ? 'activo shadow-sm' : 'text-gray-500'"
      >{{ tipo }}</button>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Patente</label>
      <input v-model="patente" type="text" placeholder="ABCD-12" class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200" />
      
      <div v-if="tipoPresupuesto === 'Detallado'">
        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente</label>
        <input v-model="cliente" type="text" placeholder="Nombre cliente" class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200" />
      </div>

      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Diagnóstico</label>
      <textarea v-model="diagnostico" rows="2" class="w-full p-2 border border-gray-100 rounded-lg bg-gray-200"></textarea>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <h3 class="text-sm font-bold text-gray-700 mb-3">Ítems y Repuestos</h3>
      <div v-for="(item, index) in items" :key="index" class="flex gap-2 mb-2">
        <input v-model="item.descripcion" type="text" class="flex-1 p-2 bg-gray-200 rounded-lg text-sm" placeholder="Repuesto/Servicio" />
        <input v-model.number="item.monto" type="number" class="w-24 p-2 bg-gray-200 rounded-lg text-right text-sm" />
        <button @click="eliminarItem(index)" class="text-red-400 px-1">✕</button>
      </div>
      <button @click="agregarItem" class="servi-blue rounded-lg py-1 px-2 servi-yellow-font text-sm">+ Agregar ítem</button>
    </div>

    <div v-if="tipoPresupuesto === 'Simple'" class="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
      <div class="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
        <button @click="ivaBoolean = true" :class="ivaBoolean ? 'activo' : ''" class="flex-1 py-1 rounded-full text-xs">Con IVA</button>
        <button @click="ivaBoolean = false" :class="!ivaBoolean ? 'activo' : ''" class="flex-1 py-1 rounded-full text-xs">Sin IVA</button>
      </div>
      <p class="text-3xl font-bold servi-blue-font">{{ formatearMoneda(totales.total_final) }}</p>
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div class="flex justify-between mb-2 text-sm"><span>Subtotal Neto</span><span>{{ formatearMoneda(totales.subtotal) }}</span></div>
      <div class="flex justify-between mb-2 text-sm"><span>Descuento (-)</span><input v-model.number="descuento" type="number" class="w-20 bg-gray-200 text-right" /></div>
      <div class="flex justify-between mb-2 text-sm"><span>Incremento (+)</span><input v-model.number="incremento" type="number" class="w-20 bg-gray-200 text-right" /></div>
      <div class="flex justify-between mb-3 text-sm"><span>IVA (%)</span><input v-model.number="ivaPorcentaje" type="number" class="w-20 bg-gray-200 text-right" /></div>
      <div class="flex justify-between pt-3 border-t font-bold"><span>TOTAL</span><span class="text-xl text-blue-900">{{ formatearMoneda(totales.total_final) }}</span></div>
    </div>

    <button @click="enviarFormulario" class="w-full mt-6 servi-blue servi-yellow-font py-3 rounded-lg font-bold">Guardar Presupuesto</button>

    <div v-if="modal.visible" class="fixed inset-0 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
        <div :class="modal.exito ? 'text-green-500' : 'text-red-500'" class="text-5xl mb-4">
          {{ modal.exito ? '✓' : '✕' }}
        </div>
        <h2 class="text-xl font-bold mb-2">{{ modal.titulo }}</h2>
        <p class="text-gray-600 mb-6">{{ modal.mensaje }}</p>
        <button 
          @click="redirigir" 
          class="w-full py-3 rounded-xl font-bold" 
          :class="modal.exito ? 'servi-blue servi-yellow-font' : 'bg-red-600 text-white'"
        >
          {{ modal.exito ? 'Ver listado' : 'Reintentar' }}
        </button>
      </div>
    </div>
  </div>
</template>
<style scoped>
.activo {
  background-color: #1f3d64;
  color: #D8B462;
} 
</style>