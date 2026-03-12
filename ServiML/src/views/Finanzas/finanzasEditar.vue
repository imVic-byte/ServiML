<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { supabase } from '@/lib/supabaseClient.js'
import { useInterfaz } from '@/stores/interfaz'
import navbar from '@/components/componentes/navbar.vue'
import volver from '@/components/componentes/volver.vue'
import modal from '@/components/componentes/modal.vue'

const route = useRoute()
const router = useRouter()
const transaccion = ref({})
const errorMensaje = ref('')
const interfaz = useInterfaz()
const modalState = ref({ visible: false, titulo: '', mensaje: '', exito: true })

// --- Autosave state ---
const datosCargados = ref(false)
const autoGuardando = ref(false)
const autoGuardadoExito = ref(false)
const guardadoConfirmado = ref(true)
let debounceTimer = null

// --- Navigation guard ---
const mostrarModalSalir = ref(false)
let resolverNavegacion = null

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

const getDatosUpdate = () => ({
  fecha: transaccion.value.fecha,
  descripcion: transaccion.value.descripcion,
  proveedor: transaccion.value.proveedor,
  documento: transaccion.value.documento,
  nro_documento: transaccion.value.nro_documento,
  forma_pago: transaccion.value.forma_pago,
  cantidad: transaccion.value.cantidad,
  observacion: transaccion.value.observacion,
  valor_neto: transaccion.value.valor_neto,
  iva: transaccion.value.iva,
  valor_iva_incluido: transaccion.value.valor_iva_incluido,
  precio_costo_unitario: transaccion.value.precio_costo_unitario,
  tipo: transaccion.value.tipo,
})

// --- Autosave ---
const autoGuardar = async () => {
  autoGuardando.value = true
  autoGuardadoExito.value = false
  try {
    const { error } = await supabase
      .from('transacciones')
      .update(getDatosUpdate())
      .eq('id', route.params.id)

    if (error) throw error

    autoGuardadoExito.value = true
    guardadoConfirmado.value = true
    setTimeout(() => { autoGuardadoExito.value = false }, 2000)
  } catch (err) {
    console.error('Error en autoguardado:', err)
  } finally {
    autoGuardando.value = false
  }
}

const debouncedAutoGuardar = () => {
  guardadoConfirmado.value = false
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    autoGuardar()
  }, 800)
}

// Watchers para autosave
const camposEditables = [
  () => transaccion.value?.fecha,
  () => transaccion.value?.descripcion,
  () => transaccion.value?.proveedor,
  () => transaccion.value?.documento,
  () => transaccion.value?.nro_documento,
  () => transaccion.value?.forma_pago,
  () => transaccion.value?.cantidad,
  () => transaccion.value?.observacion,
  () => transaccion.value?.valor_neto,
  () => transaccion.value?.iva,
  () => transaccion.value?.valor_iva_incluido,
  () => transaccion.value?.precio_costo_unitario,
  () => transaccion.value?.tipo,
]
camposEditables.forEach(getter => {
  watch(getter, (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal && datosCargados.value) debouncedAutoGuardar()
  })
})

// --- Guardar manual (botón) ---
const guardarCambios = async () => {
  interfaz.showLoadingOverlay()
  try {
    const { error } = await supabase
      .from('transacciones')
      .update(getDatosUpdate())
      .eq('id', route.params.id)

    if (error) throw error

    guardadoConfirmado.value = true
    modalState.value = {
      visible: true,
      titulo: '¡Éxito!',
      mensaje: 'Los cambios se han guardado correctamente.',
      exito: true,
    }
  } catch (error) {
    modalState.value = {
      visible: true,
      titulo: 'Error',
      mensaje: 'Hubo un error al guardar los cambios.',
      exito: false,
    }
  } finally {
    interfaz.hideLoadingOverlay()
  }
}

const irAFicha = () => {
  router.push({ name: 'ver-gasto', params: { id: transaccion.value.id_ficha_gastos } })
}

const irADeuda = () => {
  router.push({ name: 'ver-deuda', params: { id: transaccion.value.id_deuda } })
}

const cerrarModal = () => {
  modalState.value.visible = false
}

// --- Navigation guard ---
onBeforeRouteLeave((to, from, next) => {
  if (!guardadoConfirmado.value) {
    mostrarModalSalir.value = true
    resolverNavegacion = next
  } else {
    next()
  }
})

const confirmarSalir = () => {
  mostrarModalSalir.value = false
  if (resolverNavegacion) resolverNavegacion()
}

const cancelarSalir = () => {
  mostrarModalSalir.value = false
  if (resolverNavegacion) resolverNavegacion(false)
  resolverNavegacion = null
}

onMounted(async () => {
  interfaz.showLoading()
  await obtenerTransaccion()
  interfaz.hideLoading()
  setTimeout(() => { datosCargados.value = true }, 500)
})
</script>

<template>
  <div class="min-h-screen servi-white font-sans">
    <navbar titulo="ServiML" subtitulo="Editar Transacción" class="navbar"></navbar>
    
    <div class="max-w-4xl mx-auto space-y-6 pt-5 pb-30 px-4 md:px-8">
      <div class="flex justify-between">
        <volver></volver>
        <div class="flex gap-2">
          <button v-if="transaccion.id_ficha_gastos" @click="irAFicha()" class="servi-yellow text-black p-2 rounded-xl font-bold text-sm">ir a Ficha</button>
          <button v-if="transaccion.id_deuda" @click="irADeuda()" class="servi-yellow text-black p-2 rounded-xl font-bold text-sm">ir a Deuda</button>
        </div>
      </div>

      <template v-if="transaccion">
      <div class="servi-adapt-bg rounded-lg shadow-xl pb-10">
        <div class="flex rounded-t-lg border-b-4 border-yellow-500 flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 p-6 servi-blue text-white">
          <h1 class="text-2xl font-bold">
            Transacción #{{ transaccion.id }}
          </h1>
          <div class="flex items-center gap-3">
            <transition name="fade">
              <span v-if="autoGuardando" class="text-white text-xs flex items-center gap-1 animate-pulse">
                <svg class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Guardando...
              </span>
              <span v-else-if="autoGuardadoExito" class="text-green-300 text-xs flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                Guardado
              </span>
            </transition>
            <select v-model="transaccion.tipo" class="px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-black border border-slate-300">
              <option value="VENTA">VENTA</option>
              <option value="COMPRA">COMPRA</option>
              <option value="PAGO">PAGO</option>
              <option value="ABONO">ABONO</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 px-6">
          <div>
            <label class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1 block">Fecha</label>
            <input type="date" v-model="transaccion.fecha" class="w-full servi-adapt-bg border border-gray-200 servi-grey-font rounded-lg p-2.5 font-medium" />
          </div>
          <div>
            <label class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1 block">Proveedor / Cliente</label>
            <input type="text" v-model="transaccion.proveedor" placeholder="No especificado" class="w-full servi-adapt-bg border border-gray-200 servi-grey-font rounded-lg p-2.5 font-medium" />
          </div>
          <div class="md:col-span-2">
            <label class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1 block">Descripción</label>
            <textarea v-model="transaccion.descripcion" rows="2" class="w-full servi-adapt-bg border border-gray-200 servi-grey-font rounded-lg p-2.5 font-medium resize-none"></textarea>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6">
          <div>
            <label class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1 block">Documento</label>
            <input type="text" v-model="transaccion.documento" class="w-full servi-adapt-bg border border-gray-200 servi-grey-font rounded-lg p-2.5 font-medium" />
          </div>
          <div>
            <label class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1 block">Forma de Pago</label>
            <input type="text" v-model="transaccion.forma_pago" class="w-full servi-adapt-bg border border-gray-200 servi-grey-font rounded-lg p-2.5 font-medium" />
          </div>
          <div>
            <label class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1 block">Cantidad</label>
            <input type="number" v-model="transaccion.cantidad" min="1" class="w-full servi-adapt-bg border border-gray-200 servi-grey-font rounded-lg p-2.5 font-medium" />
          </div>
        </div>

        <div class="mb-8 px-6">
          <label class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1 block">Observaciones</label>
          <textarea v-model="transaccion.observacion" rows="3" placeholder="Sin observaciones" class="w-full servi-adapt-bg border border-gray-200 servi-grey-font rounded-lg p-2.5 font-medium resize-none"></textarea>
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
          <div>
            <label class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1 block">Valor Neto</label>
            <input type="number" v-model="transaccion.valor_neto" class="w-full servi-adapt-bg border border-gray-200 servi-grey-font rounded-lg p-2.5 font-medium" />
          </div>
          <div>
            <label class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1 block">IVA</label>
            <input type="number" v-model="transaccion.iva" class="w-full servi-adapt-bg border border-gray-200 servi-grey-font rounded-lg p-2.5 font-medium" />
          </div>
          <div>
            <label class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1 block">Total</label>
            <input type="number" v-model="transaccion.valor_iva_incluido" class="w-full servi-adapt-bg border border-gray-200 servi-grey-font rounded-lg p-2.5 text-blue-600 font-extrabold" />
          </div>
          <div>
            <label class="text-xs servi-grey-font font-bold uppercase tracking-wider mb-1 block">Precio Unitario</label>
            <input type="number" v-model="transaccion.precio_costo_unitario" class="w-full servi-adapt-bg border border-gray-200 servi-grey-font rounded-lg p-2.5 font-medium" />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pb-10">
        <button @click="$router.back()" class="px-6 py-3 rounded-lg border border-gray-300 servi-grey-font font-bold hover:opacity-80 transition-all">
          Cancelar
        </button>
        <button @click="guardarCambios" class="px-6 py-3 rounded-lg servi-blue text-white font-bold hover:opacity-90 transition-all shadow-md">
          Guardar Cambios
        </button>
      </div>

      </template>
    </div>

    <modal
      v-if="modalState.visible"
      :titulo="modalState.titulo"
      :mensaje="modalState.mensaje"
      :exito="modalState.exito"
      @cerrar="cerrarModal"
    />

    <!-- Modal de confirmación al salir -->
    <div v-if="mostrarModalSalir" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="servi-adapt-bg rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6">
        <h3 class="text-lg font-bold servi-grey-font mb-2">¿Salir sin guardar?</h3>
        <p class="text-sm servi-grey-font mb-6">Tienes cambios que aún no se han confirmado en la base de datos. Si sales ahora podrías perderlos.</p>
        <div class="flex justify-end gap-3">
          <button @click="cancelarSalir" class="px-4 py-2 rounded-lg border border-gray-300 servi-grey-font font-bold hover:opacity-80 transition-all text-sm">
            Quedarme
          </button>
          <button @click="confirmarSalir" class="px-4 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-all text-sm">
            Salir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
