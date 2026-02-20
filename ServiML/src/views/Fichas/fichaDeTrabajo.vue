<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../../lib/supabaseClient'
import navbar from "../../components/componentes/navbar.vue";
import {creacionOT} from '../../js/creacionOT.js'
import OTcard from "../../components/ordenTrabajo/ordendetrabajoCard.vue";
import volver from "../../components/componentes/volver.vue";
import {useInterfaz} from '../../stores/interfaz.js'
const router = useRouter()
const route = useRoute()
const interfaz = useInterfaz()
const fichaId = route.params.id
const cargando = ref(true)
const error = ref(null)
const ficha = ref(null)
const vehiculos = ref([])

const ordenesTrabajo = ref([])
const cotizacionesCliente = ref([])

// Estado para el modal de Crear OT
const mostrarModalOT = ref(false)
const listaTrabajadores = ref([])
const otTrabajadorSeleccionado = ref('')
const otPatenteIngresada = ref('')
const otModeloIngresado = ref('')
const otMarcaIngresada = ref('')
const errorModal = ref('')
const creandoOT = ref(false)

const goBack = () => {
  router.push({ name: 'listado-fichas-de-trabajo' })
}

const irAVerCotizacion = (id) => {
  router.push({ name: 'ver-cotizacion', params: { id } })
}

const irAVerOT = (id) => {
  router.push({ name: 'orden-trabajo-ver', params: { id } })
}

const obtenerTrabajadores = async () => {
  try {
    const { data, error } = await supabase
      .from('trabajadores')
      .select('*')
      .eq('activo', true)
    
    if (error) throw error
    listaTrabajadores.value = data || []
  } catch (err) {
    console.error("Error al cargar trabajadores:", err)
  }
}

const abrirModalOT = async () => {
    otTrabajadorSeleccionado.value = ''
    otPatenteIngresada.value = ''
    otModeloIngresado.value = ''
    otMarcaIngresada.value = ''
    errorModal.value = ''
    if (vehiculos.value) {
        if (Array.isArray(vehiculos.value) && vehiculos.value.length === 1) {
             otPatenteIngresada.value = vehiculos.value[0].patente
             otModeloIngresado.value = vehiculos.value[0].modelo
             otMarcaIngresada.value = vehiculos.value[0].marca
        } else if (!Array.isArray(vehiculos.value) && vehiculos.value.patente) {
             otPatenteIngresada.value = vehiculos.value.patente
             otModeloIngresado.value = vehiculos.value.modelo
             otMarcaIngresada.value = vehiculos.value.marca
        }
    }

    await obtenerTrabajadores()
    mostrarModalOT.value = true
}

const cerrarModalOT = () => {
    mostrarModalOT.value = false
    errorModal.value = ''
}

const handleVehiculos = () => {
  for (let i = 0; i < ficha.value.orden_trabajo.length; i++) {
    vehiculos.value.push(ficha.value.orden_trabajo[i].vehiculo)
  }
}

const crearCotizacion = () => {
    router.push({ name: 'crear-cotizacion-ficha-de-trabajo', params: {id: ficha.value.id } })
}

const confirmarCreacionOT = async () => {
    errorModal.value = ''
    if (!otTrabajadorSeleccionado.value) {
        errorModal.value = 'Debes seleccionar un trabajador.'
        return
    }
    if (!otPatenteIngresada.value) {
        errorModal.value = 'Debes ingresar una patente.'
        return
    } 
    handleVehiculos()
    let vehiculoId = null
    
    // Normalizar patente
    const patenteBuscada = otPatenteIngresada.value.trim().toUpperCase()

    if (vehiculos.value) {
         if (Array.isArray(vehiculos.value)) {
             const v = vehiculos.value.find(v => v.patente.toUpperCase() === patenteBuscada)
             if (v) vehiculoId = v.id
         } else if (vehiculos.value.patente && vehiculos.value.patente.toUpperCase() === patenteBuscada) {
             vehiculoId = vehiculos.value.id
         }
    }
    
    // Si no existe, lo creamos
    if (!vehiculoId) {
        if (!otMarcaIngresada.value || !otModeloIngresado.value) {
            errorModal.value = 'El vehículo no está registrado. Debes ingresar Marca y Modelo para crearlo.'
            return
        }

        try {
            const { data: newVehiculo, error: errVehiculo } = await supabase
                .from('vehiculo')
                .insert({
                    patente: patenteBuscada,
                    marca: otMarcaIngresada.value,
                    modelo: otModeloIngresado.value,
                    id_cliente: ficha.value.cliente.id,
                })
                .select()
                .single()
            if (errVehiculo) throw errVehiculo
            vehiculoId = newVehiculo.id
        } catch (error) {
            console.error('Error al crear vehiculo:', error)
            errorModal.value = 'Error al registrar el nuevo vehículo.'
            return
        }
    }

    creandoOT.value = true
    try {
        const resultado = await creacionOT(ficha.value.id, otTrabajadorSeleccionado.value, vehiculoId)
        if (resultado) {
            await cargarDatos()
            cerrarModalOT()
        } else {
             errorModal.value = 'No se pudo crear la OT. Intenta nuevamente.'
        }
    } catch (e) {
        console.error(e)
        errorModal.value = 'Error inesperado al crear la OT.'
    } finally {
        creandoOT.value = false
    }
}


const irAConvertir = (idCotizacion) => {
  router.push({ 
    name: 'nuevo-presupuesto', 
    params: { id: idCotizacion } 
  })
}

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
    case 1: return 'badge-ingresado'
    case 2: return 'badge-proceso'
    case 3: return 'badge-terminado'
    case 4: return 'badge-entregado'
    default: return 'badge-default'
  }
}

const cotizaciones = ref([])

const cargarDatos = async () => {
  cargando.value = true
  error.value = null
  try {
    const { data: dataFicha, error: errorFicha } = await supabase
      .from('ficha_de_trabajo')
      .select(`*, cliente (*),orden_trabajo (*, trabajadores(*),vehiculo(*,cliente(*))),cotizaciones_ficha(*,detalle_cotizaciones_ficha(*))`) 
      .eq('id', fichaId)
      .single()
    if (errorFicha) throw errorFicha
    ficha.value = dataFicha
    cotizaciones.value = dataFicha.cotizaciones_ficha
    }
   catch (err) {
    console.error("Error al cargar los datos:", err)
    error.value = "No se pudo cargar la información de la ficha. Revisa la conexión."
  } finally {
    cargando.value = false
    console.log(ficha.value.orden_trabajo.vehiculo)
  }
}
const estados = ref([])

const traerEstados = async () => {
  try {
    const{data,error} = await supabase
    .from('tabla_estados')
    .select('*')
    if(error) throw error
    estados.value = data
  }
  catch(err){
    console.error("Error al cargar los estados:", err)
    error.value = "No se pudo cargar la información de los estados. Revisa la conexión."
  }
}

const handleEstados = (estado) => {
  const estadoSeleccionado = estados.value.find(e => e.id === estado)
  if(estadoSeleccionado){
  return estadoSeleccionado  
  }
  return {nombre: 'Desconocido', color: '#ffffff'}
}

const guardarFicha = async () => {
  interfaz.showLoadingOverlay()
  try {
    const { data, error } = await supabase
      .from('ficha_de_trabajo')
      .update({
        fecha_ingreso: ficha.value.fecha_ingreso,
        fecha_promesa: ficha.value.fecha_promesa,
        origen_ingreso: ficha.value.origen_ingreso
      })
      .eq('id', fichaId)
    if (error) throw error
  } catch (err) {
    console.error("Error al guardar la ficha:", err)
  }
  finally{
    await cargarDatos()
    interfaz.hideLoadingOverlay()
  }
}

onMounted(async () => {
  interfaz.showLoading()
  if (fichaId) {
    await cargarDatos()
    await traerEstados()
  } else {
    error.value = "ID de ficha no proporcionado."
    cargando.value = false
  }
  interfaz.hideLoading()
})
</script>

<template>
  <div class="servi-white min-h-screen font-sans">
    <navbar :titulo="'Ficha N°' + (ficha?.id || '...')" subtitulo="Detalle de ficha de trabajo" class="navbar sticky top-0 z-50 shadow-sm" />
    <div class="mx-auto p-4 max-w-7xl pb-28 pt-8">
      <volver />
      <div v-if="cargando" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong class="font-bold">Error: </strong>
        <span class="block sm:inline">{{ error }}</span>
        <button @click="goBack" class="mt-3 block underline">Volver al listado</button>
      </div>

      <div v-else-if="ficha" class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- Columna Izquierda: Información Principal -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- Datos del Cliente -->
          <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="servi-blue px-6 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 class="text-white font-bold text-lg">Datos del Cliente</h2>
            </div>
            <div class="p-6">
              <div v-if="ficha.cliente" class="space-y-4 text-sm md:text-base">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Nombre Completo</span>
                    <span class="servi-grey-font font-medium">{{ ficha.cliente.nombre }} {{ ficha.cliente.apellido }}</span>
                  </div>
                  <div>
                    <span class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Teléfono</span>
                    <span class="servi-grey-font font-medium">+{{ ficha.cliente.codigo_pais || '56' }} {{ ficha.cliente.telefono }}</span>
                  </div>
                  <div class="md:col-span-2">
                    <span class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Correo Electrónico</span>
                    <span class="servi-grey-font font-medium">{{ ficha.cliente.email || 'No registrado' }}</span>
                  </div>
                </div>
              </div>
              <p v-else class="text-sm text-gray-500 italic">No hay información del cliente vinculada.</p>
            </div>
          </div>
          <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="servi-blue px-6 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 class="text-white font-bold text-lg">Datos de la Ficha</h2>
              <button @click="guardarFicha" class="servi-yellow text-black px-4 py-2 rounded-lg">Guardar</button>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="w-full">
                    <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Origen Ingreso</label>
                    <select class="servi-grey-font font-medium border border-gray-200 rounded-lg p-2 w-full" v-model="ficha.origen_ingreso">
                      <option value="cliente">Conducido por Cliente</option>
                      <option value="grua">Grúa / Remolque</option>
                      <option value="tercero">Chofer / Tercero</option>
                    </select>
                  </div>
                <div class="w-full">
                  <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Motivo de Ingreso</label>
                  <p class="servi-grey-font font-medium">{{ ficha.motivo_ingreso || 'Sin información registrada.' }}</p>
                </div>
                <div class="w-full">
                  <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Fecha de Ingreso</label>
                  <input class="servi-grey-font font-medium border border-gray-200 rounded-lg p-2 w-full" type="datetime-local" v-model="ficha.fecha_ingreso">
                </div>
                <div class="w-full">
                  <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Fecha de Promesa de Entrega</label>
                  <input class="servi-grey-font font-medium border border-gray-200 rounded-lg p-2 w-full" type="date" v-model="ficha.fecha_promesa">
                </div>
                <div class="w-full">
                  <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Fecha inicio Estacionamiento</label>
                  <p class="servi-grey-font font-medium">{{ ficha.fecha_estacionamiento || 'No registrado' }}</p>
                </div>
                <div class="w-full">
                  <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Fecha fin Estacionamiento</label>
                  <p class="servi-grey-font font-medium">{{ ficha.fecha_termino_estacionamiento || 'No registrado' }}</p>
                </div>
                <div class="w-full">
                  <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Fecha de Egreso</label>
                  <p class="servi-grey-font font-medium">{{ ficha.fecha_egreso || 'No registrado' }}</p>
                </div>
            </div>
          </div>
          </div>
          <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="servi-blue px-6 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 class="text-white font-bold text-lg">Vehículos</h2>
              <button @click="abrirModalOT" class="text-black servi-yellow p-2 rounded-lg hover:text-gray-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
                + Agregar Vehículo
              </button>
            </div>
            <div class="p-6">
              <div v-if="ficha.orden_trabajo" class="flex flex-row">
                <OTcard v-for="orden in ficha.orden_trabajo" :key="orden.id" :orden="orden" :estado="handleEstados(orden.estado_actual_id)" />
              </div>
              <p v-else class="text-sm servi-grey-font italic text-center py-4 servi-adapt-bg rounded-lg border border-dashed border-gray-200">
                No se encontraron vehículos registrados para este cliente.
              </p>
            </div>
          </div>
        </div>
        <div class="lg:col-span-5 space-y-6">
          <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-3 border-b border-gray-100 flex justify-between items-center servi-blue">
              <h2 class="text-white font-bold text-sm tracking-wide uppercase flex items-center gap-2">
                Cotizaciones
                <span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{{ cotizaciones.length }}</span>
              </h2>
              <button @click="crearCotizacion" class="text-black servi-yellow p-2 rounded-lg hover:text-gray-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">Crear Cotización</button>
            </div>
            <div v-if="cotizaciones.length > 0" class="divide-y divide-gray-100 max-h-60 overflow-y-auto custom-scrollbar">
              <div v-for="(cotizacion, i) in cotizaciones" :key="cotizacion.id"
                class="p-4 hover:bg-gray-50 transition-colors cursor-pointer group flex justify-between items-center">
                <div>
                  <p class="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">Cotización N°{{ i + 1 }}</p>
                  <p class="text-xs text-gray-500">{{ formatFecha(cotizacion.created_at) }}</p>
                </div>
                <div class="text-right flex flex-col items-end gap-1">
                  <p class="font-bold text-gray-700 text-sm leading-none">{{ formatMoneda(cotizacion.total_final) }}</p>
                  <span class="text-[10px] font-bold uppercase tracking-wide" :class="obtenerColorEstadoCotizacion(cotizacion.estado)">
                    {{ obtenerTextoEstadoCotizacion(cotizacion.estado) }}
                  </span>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 italic p-6 text-center">No hay cotizaciones previas.</p>
          </div>
          <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div class="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <span class="text-sm font-bold text-gray-600 uppercase tracking-wider">Estado Actual</span>
                <span 
                  class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                  :class="obtenerColorEstado(ficha.estado)">
                  {{ obtenerTextoEstado(ficha.estado) }}
                </span>
             </div>
             <div class="p-4 grid grid-cols-1 gap-3">
                <button class="w-full py-2.5 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  Exportar Ficha
                </button>
                <button class="w-full py-2.5 px-4 servi-blue text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Firmar Visualmente
                </button>
                <button @click="goBack" class="w-full py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-sm font-medium">
                  Volver al Listado
                </button>
             </div>
          </div>
          

        </div>

      </div>
      </div>
    </div>
    <div v-if="mostrarModalOT" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
      <div class="servi-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        <div class="servi-blue px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 class="text-lg font-bold text-white">Crear Orden de Trabajo</h3>
            <button @click="cerrarModalOT" class="text-white hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div class="p-6 space-y-4">
            <div v-if="errorModal" class="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 shrink-0 mt-0.5"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" /></svg>
                <span>{{ errorModal }}</span>
            </div>
            <div>
                <label class="block text-sm font-bold servi-grey-font mb-1">Patente Vehículo</label>
                <input 
                    v-model="otPatenteIngresada" 
                    type="text" 
                    class="w-full rounded-lg border-gray-300 border px-4 py-2.5 servi-grey-font focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase placeholder-gray-400"
                    placeholder="Ej: AB1234"
                />
                <p class="text-xs servi-grey-font mt-1">Debe ser un vehículo registrado del cliente.</p>
            </div>
            <div>
                <label class="block text-sm font-bold servi-grey-font mb-1">Modelo Vehículo</label>
                <input 
                    v-model="otModeloIngresado" 
                    type="text" 
                    class="w-full rounded-lg border-gray-300 border px-4 py-2.5 servi-grey-font focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase placeholder-gray-400"
                    placeholder="Ej: Yaris"
                />
                <p class="text-xs servi-grey-font mt-1">Debe ser un vehículo registrado del cliente.</p>
            </div>
            <div>
                <label class="block text-sm font-bold servi-grey-font mb-1">Marca Vehículo</label>
                <input 
                    v-model="otMarcaIngresada" 
                    type="text" 
                    class="w-full rounded-lg border-gray-300 border px-4 py-2.5 servi-grey-font focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase placeholder-gray-400"
                    placeholder="Ej: Toyota"
                />
                <p class="text-xs servi-grey-font mt-1">Debe ser un vehículo registrado del cliente.</p>
            </div>
            <div>
                <label class="block text-sm font-bold servi-grey-font mb-1">Trabajador Asignado</label>
                <div class="relative">
                    <select v-model="otTrabajadorSeleccionado" class="w-full rounded-lg border-gray-300 border px-4 py-2.5 servi-grey-font focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none">
                        <option class="servi-white" value="" disabled selected>Seleccionar un trabajador...</option>
                        <option class="servi-white" v-for="t in listaTrabajadores" :key="t.id" :value="t.id">
                            {{ t.nombre }} {{ t.apellido }}
                        </option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 servi-grey-font">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>
        </div>

        <div class="servi-blue px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
            <button @click="cerrarModalOT" class="px-4 py-2 text-sm font-medium text-white hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors">
                Cancelar
            </button>
            <button 
                @click="confirmarCreacionOT" 
                :disabled="creandoOT"
                class="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                <svg v-if="creandoOT" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {{ creandoOT ? 'Creando...' : 'Confirmar OT' }}
            </button>
        </div>

      </div>
    </div>
</template>

<style scoped>
/* Estilo sutil para los scrollbars de las listas */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 10px;
}

.badge-ingresado {
  background-color: #fef3c7;
  color: #92400e;
}
.badge-proceso {
  background-color: #dbeafe;
  color: #1e40af;
}
.badge-terminado {
  background-color: #dcfce7;
  color: #166534;
}
.badge-entregado {
  background-color: #f3f4f6;
  color: #374151;
}
.badge-default {
  background-color: #f3f4f6;
  color: #374151;
}
</style>