<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient.js'
import {useInterfaz} from '@/stores/interfaz'
import navbar from '@/components/componentes/navbar.vue'
import volver from '@/components/componentes/volver.vue'
const route = useRoute()
const router = useRouter()
const transaccion = ref({})
const errorMensaje = ref('')
const interfaz = useInterfaz()

const obtenerTransaccion = async () => {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*, transacciones_detalle(*)')
      .eq('id', route.params.id)
      .single()

    if (error) throw error

    transaccion.value = data
  } catch (error) {
    errorMensaje.value = 'No se pudo cargar la transacción.'
  }
}

const formatearDinero = (monto) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto || 0)
}

const formatearFecha = (fechaString) => {
  if (!fechaString) return ''
  const fecha = new Date(fechaString + 'T00:00:00')
  return fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
}

const irAFicha = () => {
  router.push({ name: 'ver-gasto', params: { id: transaccion.value.id_ficha_gastos } })
}

const irADeuda = () => {
  router.push({ name: 'ver-deuda', params: { id: transaccion.value.id_deuda } })
}

// --- Desglose financiero auto-calculado ---
const desglose = computed(() => {
  const total = Number(transaccion.value.valor_iva_incluido) || 0
  const netoExistente = transaccion.value.valor_neto
  const ivaExistente = transaccion.value.iva

  // Solo calcular si existe el total pero NO existen neto ni iva
  if (total && !netoExistente && !ivaExistente) {
    const netoCalculado = Math.round(total / 1.19)
    const ivaCalculado = total - netoCalculado
    return { valor_neto: netoCalculado, iva: ivaCalculado, autoCalculado: true }
  }

  return {
    valor_neto: netoExistente,
    iva: ivaExistente,
    autoCalculado: false
  }
})

const calcularYGuardarDesglose = async () => {
  if (!desglose.value.autoCalculado) return

  const { valor_neto, iva } = desglose.value

  // Guardar en reactivo
  transaccion.value.valor_neto = valor_neto
  transaccion.value.iva = iva

  // Persistir en DB
  try {
    const { error } = await supabase
      .from('transacciones')
      .update({ valor_neto, iva })
      .eq('id', route.params.id)

    if (error) throw error
  } catch (err) {
    console.error('Error al guardar desglose calculado:', err)
  }
}

onMounted(async () => {
  interfaz.showLoading()
  await obtenerTransaccion()
  await calcularYGuardarDesglose()
  interfaz.hideLoading()
})
</script>

<template>
  <div class="min-h-screen servi-white font-sans">
    <navbar titulo="ServiML" subtitulo="Detalle de Transacción" class="navbar"></navbar>
    
    <div class="max-w-4xl mx-auto space-y-6 pt-5 pb-30 px-4 md:px-8">
      <div class="flex justify-between">
        <volver></volver>
        <div class="flex gap-2">
          <button v-if="transaccion.id_ficha_gastos" @click="irAFicha()" class="servi-yellow text-black p-2 rounded-xl font-bold text-sm">ir a Ficha</button>
          <button v-if="transaccion.id_deuda" @click="irADeuda()" class="servi-yellow text-black p-2 rounded-xl font-bold text-sm">ir a Deuda</button>
          <button @click="router.push({ name: 'editar-finanza', params: { id: transaccion.id } })" class="servi-blue text-white p-2 rounded-xl font-bold text-sm">Editar</button>
        </div>
      </div>

      <template v-if="transaccion">
      <div class="servi-adapt-bg rounded-lg shadow-xl pb-20">
        <div class="flex rounded-t-lg border-b-4 border-yellow-500 flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 p-6 servi-blue text-white">
          <h1 class="text-2xl font-bold">
            Transacción #{{ transaccion.id }}
          </h1>
          <span class="px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-black border border-slate-300">
            {{ transaccion.tipo }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 px-6">
          <div>
            <p class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1">Fecha</p>
            <p class="font-medium servi-grey-font">{{ formatearFecha(transaccion.fecha) }}</p>
          </div>
          <div>
            <p class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1">Proveedor / Cliente</p>
            <p class="font-medium servi-grey-font">{{ transaccion.proveedor || 'No especificado' }}</p>
          </div>
          <div class="md:col-span-2">
            <p class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1">Descripción</p>
            <p class="font-medium servi-grey-font">{{ transaccion.descripcion }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6">
          <div>
            <p class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1">Documento</p>
            <p class="font-medium servi-grey-font">{{ transaccion.documento }} {{ transaccion.nro_docto ? '#' + transaccion.nro_docto : '' }}</p>
          </div>
          <div>
            <p class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1">Forma de Pago</p>
            <p class="font-medium servi-grey-font">{{ transaccion.forma_pago }}</p>
          </div>
          <div>
            <p class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1">Cantidad</p>
            <p class="font-medium servi-grey-font">{{ transaccion.cantidad }}</p>
          </div>
        </div>
        <div v-if="transaccion.observacion" class="mb-8 px-6">
          <p class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1">Observaciones</p>
          <p class="font-medium servi-grey-font p-3 rounded border border-gray-100">{{ transaccion.observacion }}</p>
        </div>

        <div v-if="transaccion.transacciones_detalle && transaccion.transacciones_detalle.length > 0" class="mb-8 px-6">
          <p class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-2">Documentos Adjuntos</p>
          <div class="flex flex-col gap-2">
            <a v-for="(url, index) in transaccion.transacciones_detalle" :key="index" :href="url.url" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-medium text-sm flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver documento adjunto {{ index + 1 }}
            </a>
          </div>
        </div>
      </div>
      <div class="shadow-xl pb-2 rounded-lg servi-adapt-bg">
        <h3 class="font-bold text-lg servi-blue text-white p-4 mb-4 rounded-t-lg border-b-4 border-yellow-500">Desglose Financiero</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 px-6">
          <div v-if="desglose.valor_neto">
            <p class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1">Valor Neto</p>
            <p class="text-lg font-bold servi-grey-font">{{ formatearDinero(desglose.valor_neto) }}</p>
          </div>
          <div v-if="desglose.iva">
            <p class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1">IVA</p>
            <p class="text-lg font-bold servi-grey-font">{{ formatearDinero(desglose.iva) }}</p>
          </div>
          <div v-if="transaccion.valor_iva_incluido">
            <p class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1">Total</p>
            <p class="text-xl font-extrabold text-blue-600">{{ formatearDinero(transaccion.valor_iva_incluido) }}</p>
          </div>
          <div v-if="transaccion.precio_costo_unitario">
            <p class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1">Precio Unitario</p>
            <p class="text-lg font-bold servi-grey-font">{{ formatearDinero(transaccion.precio_costo_unitario) }}</p>
          </div>
        </div>
      </div>
      </template>
    </div>
  </div>
</template>