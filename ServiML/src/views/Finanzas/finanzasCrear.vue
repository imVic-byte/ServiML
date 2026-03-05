<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient.js'
import navbar from '@/components/componentes/navbar.vue'
import subirDocumentos from '@/components/finanzas/subirDocumento.vue'
import {useInterfaz} from '../../stores/interfaz.js'
import {subirFinanzas} from '../../js/subirFinanzas.js'
import volver from '@/components/componentes/volver.vue'
const interfaz = useInterfaz()
const router = useRouter()
const guardando = ref(false)
const errorMensaje = ref('')

const archivos = ref([])

const formulario = ref({
  fecha: '',
  descripcion: '',
  cantidad: '',
  valor_iva_incluido: '',
  valor_neto: '',
  iva: '',
  precio_costo_unitario: '',
  documento: 'FACTURA',
  nro_documento: '',
  proveedor: '',
  forma_pago: 'TRANSFERENCIA',
  tipo: 'COMPRA',
  observacion: ''
})

const recibirArchivos = (archivosRecibidos) => {
  archivos.value = archivosRecibidos
}

const formatearMonedaCLP = (valor) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor)
}

const calcularValores = () => {
  const total = Number(formulario.value.valor_iva_incluido) || 0
  const cantidad = Number(formulario.value.cantidad) || 1

  const neto = Math.round(total / 1.19)
  const iva = Math.trunc(total - neto)
  const unitario = Math.trunc(cantidad > 0 ? (neto / cantidad) : 0)

  formulario.value.valor_neto = neto
  formulario.value.iva = iva
  formulario.value.precio_costo_unitario = unitario
}


const guardarTransaccion = async () => {
  const validacion = (() => {
      if (!formulario.value.fecha) {
          return { exito: false, error: 'La fecha es requerida' }
      }
      if (!formulario.value.descripcion?.trim()) {
          return { exito: false, error: 'La descripción es requerida' }
      }
      if (!formulario.value.cantidad || Number(formulario.value.cantidad) <= 0) {
          return { exito: false, error: 'La cantidad es requerida y debe ser mayor a 0' }
      }
      if (!formulario.value.valor_iva_incluido || Number(formulario.value.valor_iva_incluido) <= 0) {
          return { exito: false, error: 'El valor con IVA incluido es requerido y debe ser mayor a 0' }
      }
      return { exito: true }
  })()
  if (!validacion.exito) {
    errorMensaje.value = validacion.error
    return
  }
  interfaz.showLoadingOverlay()
  errorMensaje.value = ''
  try {
    const { data: idTransaccion, error } = await supabase
      .from('transacciones')
      .insert([formulario.value])
      .select('id')
      .single()
    if (error) throw error
    console.log('transaccion guardada', idTransaccion)
    console.log('archivos', archivos.value)
    if (archivos.value.length > 0) {
        console.log('subiendo archivos', archivos.value)
        for (const archivo of archivos.value) {
            console.log('subiendo un archivo', archivo)
            const { error: errorSubida } = await subirFinanzas(idTransaccion.id, archivo)
            if (errorSubida) {
                console.error('Error al subir archivos:', errorSubida)
            }
        }
    }
  } catch (error) {
    console.error(error.message)
    errorMensaje.value = 'Ocurrió un error al guardar la transacción. Intenta nuevamente.'
  } finally {
    interfaz.hideLoadingOverlay()
    router.push('/finanzas')
  }
}
</script>
<template>
  <div class="min-h-screen servi-white font-sans">
    <navbar titulo="ServiML" subtitulo="Nueva Transacción" class="navbar"></navbar>
    
    <div class="max-w-4xl mx-auto space-y-6 pt-5 pb-30 px-4 md:px-8">
      <volver></volver>
      <h1 class="text-xl md:text-3xl font-bold servi-grey-font border-l-4 border-yellow-500 pl-3">
        Registrar Nueva Transacción
      </h1>

      <div class="servi-adapt-bg shadow-xl rounded-lg">
        <form @submit.prevent="guardarTransaccion" class="space-y-6">
          <h3 class="font-bold text-lg servi-blue p-6 text-white rounded-t-lg border-b-4 border-yellow-500">Datos Generales</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
            <div class="space-y-2">
              <label class="block text-sm font-bold servi-grey-font">Tipo de Transacción</label>
              <select v-model="formulario.tipo" required class="w-full px-4 py-2 rounded-md outline-none servi-adapt-bg border servi-grey-font border-gray-100">
                <option value="VENTA">Venta</option>
                <option value="COMPRA">Compra</option>
                <option value="PAGO">Pago</option>
              </select>
            </div>
            
            <div class="space-y-2">
              <label class="block text-sm font-bold servi-grey-font">Fecha</label>
              <input type="date" v-model="formulario.fecha" required class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none servi-adapt-bg border servi-grey-font border-gray-100">
            </div>
          </div>

          <div class="space-y-2 px-6">
            <label class="block text-sm font-bold servi-grey-font">Descripción</label>
            <input type="text" v-model="formulario.descripcion" required class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none servi-adapt-bg border servi-grey-font border-gray-100" placeholder="Ej: Filtro de aceite, Diagnóstico...">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
            <div class="space-y-2">
              <label class="block text-sm font-bold servi-grey-font">Proveedor / Cliente</label>
              <input type="text" v-model="formulario.proveedor" class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none servi-adapt-bg border servi-grey-font border-gray-100">
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-bold servi-grey-font">Documento</label>
              <select v-model="formulario.documento" class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none servi-adapt-bg border servi-grey-font border-gray-100">
                <option value="FACTURA">Factura</option>
                <option value="BOLETA">Boleta</option>
                <option value="VOUCHER POS">Voucher POS</option>
                <option value="ORDEN DE TRANSPORTE">Orden de Transporte</option>
                <option value="NOTA DE CREDITO">Nota de Crédito</option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-bold servi-grey-font">Nro Documento</label>
              <input type="text" v-model="formulario.nro_documento" class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none servi-adapt-bg border servi-grey-font border-gray-100">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
            <div class="space-y-2">
              <label class="block text-sm font-bold servi-grey-font">Forma de Pago</label>
              <select v-model="formulario.forma_pago" class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none servi-adapt-bg border servi-grey-font border-gray-100">
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="CREDITO">Crédito</option>
                <option value="OTROS">Otros</option>
              </select>
            </div>
          </div>

          <h3 class="font-bold text-lg text-white p-6 border-b-4 border-yellow-500 rounded-t-lg servi-blue">Valores</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
            <div class="space-y-2">
              <label class="block text-sm font-bold servi-grey-font">Valor Total (Con IVA)</label>
              <input type="number" v-model="formulario.valor_iva_incluido" @input="calcularValores" required min="0" class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none servi-adapt-bg border servi-grey-font border-gray-100">
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-bold servi-grey-font">Cantidad</label>
              <input type="number" v-model="formulario.cantidad" @input="calcularValores" required min="1" class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none servi-adapt-bg border servi-grey-font border-gray-100">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 servi-adapt-bg p-4 rounded-md border border-gray-100 mx-6">
            <div class="space-y-1">
              <label class="block text-xs font-bold servi-grey-font uppercase">Valor Neto Calculado</label>
              <p class="text-lg font-bold servi-grey-font">{{ formatearMonedaCLP(formulario.valor_neto) }}</p>
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-bold servi-grey-font uppercase">IVA Calculado</label>
              <p class="text-lg font-bold servi-grey-font">{{ formatearMonedaCLP(formulario.iva) }}</p>
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-bold servi-grey-font uppercase">Precio Unitario Calculado</label>
              <p class="text-lg font-bold servi-grey-font">{{ formatearMonedaCLP(formulario.precio_costo_unitario) }}</p>
            </div>
          </div>

          <h3 class="font-bold text-lg text-white p-6 border-b-4 border-yellow-500 rounded-t-lg servi-blue">Comentarios y Documentos Adjuntos</h3>

          <subirDocumentos @update="recibirArchivos" />

          <div class="space-y-2 px-6">
            <label class="block text-sm font-bold servi-grey-font">Observaciones (Opcional)</label>
            <textarea v-model="formulario.observacion" rows="3" class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none servi-adapt-bg border servi-grey-font border-gray-100"></textarea>
          </div>

          <div v-if="errorMensaje" class="bg-red-100 text-red-700 p-3 rounded-md text-sm font-semibold mx-6">
            {{ errorMensaje }}
          </div>

          <div class="flex justify-end py-4 mx-6">
            <button type="submit" :disabled="guardando" class="servi-yellow hover:opacity-90 text-black font-bold py-3 px-8 rounded-md shadow-md transition disabled:opacity-50">
              {{ guardando ? 'Guardando...' : 'Guardar Transacción' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  </div>
</template>