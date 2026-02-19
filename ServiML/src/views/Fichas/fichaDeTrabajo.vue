<script setup>
<<<<<<< HEAD
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../../lib/supabaseClient'

const router = useRouter()
const route = useRoute()
const fichaId = route.params.id

const cargando = ref(true)
const error = ref(null)
const ficha = ref(null)
const vehiculo = ref(null)

// Nuevas referencias para las listas
const ordenesTrabajo = ref([])
const cotizacionesCliente = ref([])

const goBack = () => {
  router.push({ name: 'listado-fichas-de-trabajo' })
}

const irAVerCotizacion = (id) => {
  router.push({ name: 'ver-cotizacion', params: { id } })
}

const irAVerOT = (id) => {
  router.push({ name: 'orden-trabajo-ver', params: { id } })
}

const crearOTDirecta = () => {
  if (ficha.value?.cliente) {
    router.push({ 
      name: 'orden-trabajo-ver', // esta wea entiendo que deberia llevar a la ot pero de momento no se me ocurre como
      query: { 
        clienteId: ficha.value.cliente.id,
        vehiculoId: vehiculo.value?.id 
      } 
    })
  }
}

const irAConvertir = (idCotizacion) => {
  router.push({ 
    name: 'nuevo-presupuesto', 
    params: { id: idCotizacion } 
  })
}
// -------------------------

// Formateadores
const formatFecha = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatMoneda = (monto) => {
  if (!monto) return '$0'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto)
}

const obtenerTextoEstadoCotizacion = (estado) => {
  switch (Number(estado)) {
    case 2: return 'Aprobada'
    case 3: return 'Rechazada'
    case 1: return 'Pendiente'
    default: return 'Cerrada'
  }
}

const obtenerColorEstadoCotizacion = (estado) => {
  switch (Number(estado)) {
    case 2: return 'text-green-600'
    case 3: return 'text-red-600'
    case 1: return 'text-yellow-600'
    default: return 'text-gray-600'
  }
}

// Helpers para el estado de la Ficha
const obtenerTextoEstado = (estadoNumerico) => {
  const estados = {
    1: 'Ingresado',
    2: 'En Proceso',
    3: 'Terminado',
    4: 'Entregado'
  }
  return estados[estadoNumerico] || 'Desconocido'
}

const obtenerColorEstado = (estadoNumerico) => {
  switch (Number(estadoNumerico)) {
    case 1: return 'bg-yellow-100 text-yellow-800'
    case 2: return 'bg-blue-100 text-blue-800'
    case 3: return 'bg-green-100 text-green-800'
    case 4: return 'bg-gray-200 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Llamada a Supabase
const cargarDatos = async () => {
  cargando.value = true
  error.value = null

  try {
    const { data: dataFicha, error: errorFicha } = await supabase
      .from('ficha_de_trabajo')
      .select(`*, cliente (*)`)
      .eq('id', fichaId)
      .single()

    if (errorFicha) throw errorFicha
    ficha.value = dataFicha

    if (dataFicha.id_cliente) {
      const { data: dataVehiculos, error: errorVehiculo } = await supabase
        .from('vehiculo')
        .select('*')
        .eq('id_cliente', dataFicha.id_cliente)

      if (errorVehiculo) throw errorVehiculo
      
      if (dataVehiculos && dataVehiculos.length > 0) {
        vehiculo.value = dataVehiculos[0]

        const vehiculosIds = dataVehiculos.map(v => v.id)
        const { data: dataOts } = await supabase
          .from('orden_trabajo')
          .select('*')
          .in('vehiculo_id', vehiculosIds)
          .order('created_at', { ascending: false })

        ordenesTrabajo.value = dataOts || []
      }

      if (dataFicha.cliente) {
        const { data: dataCots } = await supabase
          .from('cotizacion')
          .select('*')
          .ilike('nombre', dataFicha.cliente.nombre)
          .ilike('apellido', dataFicha.cliente.apellido)
          .order('created_at', { ascending: false })

        cotizacionesCliente.value = dataCots || []
      }
    }

  } catch (err) {
    console.error("Error al cargar los datos:", err)
    error.value = "No se pudo cargar la información de la ficha. Revisa la conexión."
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  if (fichaId) {
    cargarDatos()
  } else {
    error.value = "ID de ficha no proporcionado."
    cargando.value = false
  }
})
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-6xl">
    
    <div v-if="cargando" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error: </strong>
      <span class="block sm:inline">{{ error }}</span>
      <button @click="goBack" class="mt-3 block underline">Volver al listado</button>
    </div>

    <div v-else-if="ficha">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            Ficha de Trabajo N°{{ ficha.id }}
          </h1>
          <div class="flex gap-2 mt-2">
            <span 
              class="px-3 py-1 rounded-full text-sm font-semibold"
              :class="obtenerColorEstado(ficha.estado)">
              {{ obtenerTextoEstado(ficha.estado) }}
            </span>
            <span class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm font-semibold">
              {{ formatFecha(ficha.created_at) }}
            </span>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-2 md:gap-3">
          <button @click="goBack" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors">
            Atrás
          </button>
          <button class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Exportar
          </button>
          <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Firmar Ficha
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div class="space-y-6">
          <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
              Datos del Cliente
            </h2>
            <div v-if="ficha.cliente" class="space-y-3 text-sm md:text-base">
              <p><span class="font-semibold text-gray-500 dark:text-gray-400 w-24 inline-block">Nombre:</span> <span class="text-gray-800 dark:text-gray-200">{{ ficha.cliente.nombre }} {{ ficha.cliente.apellido }}</span></p>
              <p><span class="font-semibold text-gray-500 dark:text-gray-400 w-24 inline-block">Teléfono:</span> <span class="text-gray-800 dark:text-gray-200">+{{ ficha.cliente.codigo_pais || '56' }} {{ ficha.cliente.telefono }}</span></p>
              <p><span class="font-semibold text-gray-500 dark:text-gray-400 w-24 inline-block">Correo:</span> <span class="text-gray-800 dark:text-gray-200">{{ ficha.cliente.email || 'No registrado' }}</span></p>
            </div>
            <p v-else class="text-sm text-gray-500 italic">No hay información del cliente vinculada.</p>
          </div>

          <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
              Datos del Vehículo
            </h2>
            <div v-if="vehiculo" class="space-y-3 text-sm md:text-base">
              <p><span class="font-semibold text-gray-500 dark:text-gray-400 w-24 inline-block">Patente:</span> <span class="uppercase font-bold text-gray-800 dark:text-gray-200">{{ vehiculo.patente }}</span></p>
              <p><span class="font-semibold text-gray-500 dark:text-gray-400 w-24 inline-block">Marca:</span> <span class="text-gray-800 dark:text-gray-200">{{ vehiculo.marca }}</span></p>
              <p><span class="font-semibold text-gray-500 dark:text-gray-400 w-24 inline-block">Modelo:</span> <span class="text-gray-800 dark:text-gray-200">{{ vehiculo.modelo }}</span></p>
              <p><span class="font-semibold text-gray-500 dark:text-gray-400 w-24 inline-block">Año:</span> <span class="text-gray-800 dark:text-gray-200">{{ vehiculo.ano }}</span></p>
            </div>
            <p v-else class="text-sm text-gray-500 italic">No se encontró un vehículo registrado para este cliente.</p>
          </div>
        </div>

        <div class="space-y-6">
          
          <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div class="mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 flex justify-between items-center">
              <h2 class="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                Órdenes de Trabajo
                <span class="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">{{ ordenesTrabajo.length }}</span>
              </h2>
              
              <button @click="crearOTDirecta" class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 transition-colors shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Crear OT
              </button>
            </div>
            
            <div v-if="ordenesTrabajo.length > 0" class="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              <div v-for="ot in ordenesTrabajo" :key="ot.id" 
                @click="irAVerOT(ot.id)"
                class="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
                <div>
                  <p class="font-bold text-gray-800 dark:text-gray-200 text-sm group-hover:text-blue-600 transition-colors">OT N°{{ ot.id }}</p>
                  <p class="text-xs text-gray-500">{{ formatFecha(ot.created_at) }}</p>
                </div>
                <div class="text-right flex flex-col items-end">
                  <span class="text-xs text-gray-600 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{{ ot.tipo_trabajo || 'Mantenimiento' }}</span>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 italic py-2">No se registran órdenes de trabajo previas para este cliente.</p>
          </div>

          <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 flex justify-between items-center">
              Cotizaciones del Cliente
              <span class="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">{{ cotizacionesCliente.length }}</span>
            </h2>
            
            <div v-if="cotizacionesCliente.length > 0" class="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              <div v-for="cotizacion in cotizacionesCliente" :key="cotizacion.id" 
                @click="irAVerCotizacion(cotizacion.id)"
                class="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
                <div>
                  <p class="font-bold text-gray-800 dark:text-gray-200 text-sm group-hover:text-blue-600 transition-colors">Folio N°{{ cotizacion.id }}</p>
                  <p class="text-xs text-gray-500">{{ formatFecha(cotizacion.created_at) }}</p>
                </div>
                <div class="text-right flex flex-col items-end gap-1.5">
                  <p class="font-bold text-gray-700 dark:text-gray-300 text-sm leading-none">{{ formatMoneda(cotizacion.total_final) }}</p>
                  <span class="text-[11px] font-semibold leading-none" :class="obtenerColorEstadoCotizacion(cotizacion.estado)">
                    {{ obtenerTextoEstadoCotizacion(cotizacion.estado) }}
                  </span>
                  
                    <template>
                        <button @click="irAConvertir(cotizacion.id)" class="btn-convertir">
                            Convertir a Presupuesto
                        </button>
                    </template>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 italic py-2">No se registran cotizaciones previas para este cliente.</p>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilo sutil para los scrollbars de las listas */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #374151;
}
</style>
=======
import {ref,onMounted,computed} from 'vue'
import {supabase} from '../../lib/supabaseClient.js'
import navbar from '../../components/componentes/navbar.vue'
import modal from '../../components/componentes/modal.vue'
import { useInterfaz } from '@/stores/interfaz.js'
import { useRouter,useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const interfaz = useInterfaz()
const ficha = ref([])

onMounted(async () => {
    interfaz.showLoading();
    const { data, error } = await supabase
      .from('ficha_de_trabajo')
      .select('*,cliente(*)')
      .eq('id', route.params.id)
      .single()
    if (data) {
        ficha.value = data
    } else {
        console.log(error)
    }
    interfaz.hideLoading();
})
</script>
<template>
    <div class="flex-1 servi-white">
        <navbar titulo="ServiML" subtitulo="Ficha de Trabajo" class="navbar"/>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2>{{ ficha?.cliente?.nombre }}</h2>
            <h2>{{ ficha?.cliente?.apellido }}</h2>
            <h2>{{ ficha?.cliente?.telefono }}</h2>
            <h2>{{ ficha?.cliente?.email }}</h2>
            <h2>{{ ficha?.cliente?.telefono }}</h2>
        </div>
    </div>
</template>
>>>>>>> 599d01ea6445b82bad2c5674108405d152e3c12a
