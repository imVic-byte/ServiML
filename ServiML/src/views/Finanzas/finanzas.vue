<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient.js'
import navbar from '@/components/componentes/navbar.vue'

const mostrarStats = ref(false)
const cargando = ref(true)
const transacciones = ref([])

const router = useRouter()

// Filtros de fecha para stats
const fechaDesde = ref('')
const fechaHasta = ref('')

// Paginación
const paginaActual = ref(1)
const porPagina = 15

const obtenerTransacciones = async () => {
  cargando.value = true
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error
    
    transacciones.value = data || []
  } catch (error) {
    console.error(error.message)
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  obtenerTransacciones()
})

// Transacciones filtradas por fecha (solo para stats)
const transaccionesFiltradas = computed(() => {
  return transacciones.value.filter(t => {
    if (fechaDesde.value && t.fecha < fechaDesde.value) return false
    if (fechaHasta.value && t.fecha > fechaHasta.value) return false
    return true
  })
})

const totalIngresos = computed(() => {
  return transaccionesFiltradas.value
    .filter(t => t.tipo === 'VENTA' || t.tipo === 'ABONO')
    .reduce((acc, t) => acc + Number(t.valor_iva_incluido || 0), 0)
})

const totalEgresos = computed(() => {
  return transaccionesFiltradas.value
    .filter(t => t.tipo === 'COMPRA' || t.tipo === 'PAGO')
    .reduce((acc, t) => acc + Number(t.valor_iva_incluido || 0), 0)
})

const balanceTotal = computed(() => {
  return totalIngresos.value - totalEgresos.value
})

// Paginación
const totalPaginas = computed(() => {
  return Math.max(1, Math.ceil(transacciones.value.length / porPagina))
})

const transaccionesPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina
  return transacciones.value.slice(inicio, inicio + porPagina)
})

const paginaAnterior = () => {
  if (paginaActual.value > 1) paginaActual.value--
}

const paginaSiguiente = () => {
  if (paginaActual.value < totalPaginas.value) paginaActual.value++
}

const limpiarFiltros = () => {
  fechaDesde.value = ''
  fechaHasta.value = ''
}

const hayFiltroActivo = computed(() => {
  return fechaDesde.value || fechaHasta.value
})

const formatearDinero = (monto) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto || 0)
}

const formatearFecha = (fechaString) => {
  if (!fechaString) return 'Sin fecha'
  const fecha = new Date(fechaString + 'T00:00:00')
  return fecha.toLocaleDateString('es-CL')
}

const claseTipo = (tipo) => {
  if (tipo === 'VENTA') return 'bg-green-100 text-green-800'
  if (tipo === 'COMPRA') return 'bg-blue-100 text-blue-800'
  if (tipo === 'PAGO') return 'bg-yellow-100 text-yellow-800'
  if (tipo === 'ABONO') return 'bg-purple-100 text-purple-800'
  return 'bg-gray-100 text-gray-800'
}

const handleRedirigir = (id) => {
  router.push({ name: 'ver-finanza', params: { id } })
}

const handleRegistrar = () => {
  router.push({ name: 'crear-finanza' })
}
</script>

<template>
  <div class="min-h-screen servi-white font-sans">
    <navbar titulo="ServiML" subtitulo="Control de Transacciones" class="navbar"></navbar>
    <div class="max-w-6xl mx-auto space-y-6 pt-5 pb-30 px-4 md:px-8">
      
      <button @click="router.push('/configuracion')"
          class="mb-4 flex items-center gap-1 text-sm servi-grey-font hover:opacity-80 transition cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
      </button>
      
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 class="text-xl md:text-3xl font-bold servi-grey-font border-l-4 border-yellow-500 pl-3">
          Control de Transacciones
        </h1>
        <div class="flex gap-2 justify-between">
          <button 
            @click="mostrarStats = !mostrarStats" 
            class="md:hidden servi-blue text-white py-3 rounded-full font-semibold shadow-sm flex justify-between items-center px-4"
          >
            <span>Resumen Financiero</span>
            <span class="text-white font-bold"> {{ mostrarStats ? ' -' : ' +' }}</span>
          </button>
          <button @click="handleRegistrar" class="servi-yellow rounded-full md:w-auto px-5 py-2.5 shadow-md font-semibold text-sm">
            <p class="md:hidden">+</p>
            <p class="hidden md:block">Nueva Transacción</p>
          </button>
        </div>
      </div>

      <!-- Filtros de fecha para Stats -->
      <div :class="mostrarStats ? 'block' : 'hidden md:block'">
        <div class="flex flex-col md:flex-row md:items-end gap-3 servi-blue p-4 rounded-lg shadow-sm">
          <div class="flex-1 space-y-1">
            <label class="block text-xs font-bold text-white uppercase tracking-wider">Desde</label>
            <input type="date" v-model="fechaDesde" class="w-full px-3 py-2 rounded-md focus:ring-2 outline-none servi-grey-font servi-adapt-bg text-sm">
          </div>
          <div class="flex-1 space-y-1">
            <label class="block text-xs font-bold text-white uppercase tracking-wider">Hasta</label>
            <input type="date" v-model="fechaHasta" class="w-full px-3 py-2 rounded-md focus:ring-2 outline-none servi-grey-font servi-adapt-bg text-sm">
          </div>
          <button 
            v-if="hayFiltroActivo"
            @click="limpiarFiltros" 
            class="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition"
          >
            Limpiar
          </button>
        </div>
        <p v-if="hayFiltroActivo" class="text-xs text-gray-400 mt-1 ml-1">
          Los filtros aplican solo al resumen financiero, no a la tabla.
        </p>
      </div>

      <!-- Stats Cards -->
      <div :class="mostrarStats ? 'block' : 'hidden md:grid'" class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div class="servi-blue p-4 md:p-5 rounded-lg shadow-lg border-b-4 border-green-500">
          <h3 class="text-white text-xs md:text-sm font-bold uppercase tracking-wider">Total Ingresos (Ventas)</h3>
          <p class="text-2xl md:text-3xl font-bold text-green-400 mt-1 md:mt-2">{{ formatearDinero(totalIngresos) }}</p>
        </div>
        
        <div class="servi-blue p-4 md:p-5 rounded-lg shadow-lg border-b-4 border-red-500">
          <h3 class="text-white text-xs md:text-sm font-bold uppercase tracking-wider">Total Egresos (Compras/Pagos)</h3>
          <p class="text-2xl md:text-3xl font-bold text-red-400 mt-1 md:mt-2">{{ formatearDinero(totalEgresos) }}</p>
        </div>
        
        <div class="servi-blue p-4 md:p-5 rounded-lg shadow-lg border-b-4 border-yellow-500">
          <h3 class="text-white text-xs md:text-sm font-bold uppercase tracking-wider">Balance General</h3>
          <p class="text-2xl md:text-3xl font-extrabold mt-1 md:mt-2" :class="balanceTotal >= 0 ? 'text-yellow-500' : 'text-red-500'">
            {{ formatearDinero(balanceTotal) }}
          </p>
        </div>
      </div>

      <div v-if="cargando" class="flex justify-center items-center py-10">
        <p class="servi-grey-font font-bold">Cargando registros...</p>
      </div>

      <template v-else>
        <!-- Mobile Cards -->
        <div class="grid grid-cols-1 gap-3 md:hidden mt-4">
          <div v-if="transacciones.length === 0" class="text-center text-gray-500 py-4">
            No hay transacciones registradas aún.
          </div>
          
          <div v-for="t in transaccionesPaginadas" :key="t.id" class="servi-blue p-4 rounded-lg shadow-lg">
            <div class="flex justify-between items-center mb-2">
              <span class="font-bold text-white text-sm">{{ formatearFecha(t.fecha) }}</span>
              <span 
                :class="claseTipo(t.tipo)"
                class="px-2 py-0.5 rounded text-xs font-bold"
              >
                {{ t.tipo }}
              </span>
            </div>
            <div class="mb-3">
              <p class="text-white font-semibold truncate">{{ t.descripcion }}</p>
              <p class="text-white/70 text-xs">{{ t.documento }} - {{ t.proveedor }}</p>
            </div>
            <div class="flex justify-between items-center mb-3">
              <span class="text-white/80 text-sm">Total:</span>
              <span class="font-bold text-white text-lg">{{ formatearDinero(t.valor_iva_incluido) }}</span>
            </div>
            <button @click="handleRedirigir(t.id)" class="w-full servi-yellow py-2.5 rounded-md font-semibold text-sm">
              Ver Detalle
            </button>
          </div>
        </div>

        <!-- Desktop Table -->
        <div class="hidden md:block rounded-lg shadow-md overflow-hidden mt-6">
          <div class="overflow-x-auto">
            <table class="min-w-[800px] w-full">
              <thead class="servi-blue text-white">
                <tr>
                  <th class="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Fecha</th>
                  <th class="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Descripción</th>
                  <th class="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Proveedor/Cliente</th>
                  <th class="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Tipo</th>
                  <th class="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider">Total</th>
                  <th class="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="servi-adapt-bg">
                <tr v-if="transacciones.length === 0">
                  <td colspan="6" class="px-6 py-4 text-center text-gray-500 font-medium">No hay transacciones disponibles.</td>
                </tr>
                
                <tr @click="handleRedirigir(t.id)" v-for="t in transaccionesPaginadas" :key="t.id" class=" transition-colors">
                  <td class="px-4 py-4 whitespace-nowrap text-sm font-medium servi-grey-font">{{ formatearFecha(t.fecha) }}</td>
                  <td class="px-4 py-4 text-sm servi-grey-font max-w-xs truncate" :title="t.descripcion">{{ t.descripcion }}</td>
                  <td class="px-4 py-4 text-sm servi-grey-font max-w-xs truncate" :title="t.proveedor">{{ t.proveedor }}</td>
                  <td class="px-4 py-4 whitespace-nowrap">
                    <span 
                      :class="claseTipo(t.tipo)"
                      class="px-3 py-1 rounded-full text-xs font-bold"
                    >
                      {{ t.tipo }}
                    </span>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right font-bold servi-grey-font">{{ formatearDinero(t.valor_iva_incluido) }}</td>
                  <td class="px-4 py-4 whitespace-nowrap flex servi-grey-font justify-center">
                    <button @click="handleRedirigir(t.id)" class="hover:text-blue-600 p-1 rounded-full hover:bg-slate-200 transition-colors" title="Ver detalle">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Paginación -->
        <div v-if="totalPaginas > 1" class="flex justify-center items-center gap-4 pt-4 pb-2">
          <button 
            @click="paginaAnterior" 
            :disabled="paginaActual === 1"
            class="px-4 py-2 rounded-md font-semibold text-sm transition shadow-sm"
            :class="paginaActual === 1 ? 'servi-grey-font cursor-not-allowed' : 'servi-blue text-white hover:opacity-90 cursor-pointer'"
          >
            ← Anterior
          </button>
          <span class="text-sm font-bold servi-grey-font">
            Página {{ paginaActual }} de {{ totalPaginas }}
          </span>
          <button 
            @click="paginaSiguiente" 
            :disabled="paginaActual === totalPaginas"
            class="px-4 py-2 rounded-md font-semibold text-sm transition shadow-sm"
            :class="paginaActual === totalPaginas ? 'servi-grey-font cursor-not-allowed' : 'servi-blue text-white hover:opacity-90 cursor-pointer'"
          >
            Siguiente →
          </button>
        </div>
      </template>
      
    </div>
  </div>
</template>