<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../../lib/supabaseClient'
import navbar from "../../components/componentes/navbar.vue";
import {creacionOT} from '../../js/creacionOT.js'
import OTcard from "../../components/ordenTrabajo/ordendetrabajoCard.vue";
import volver from "../../components/componentes/volveraListaFicha.vue";
import {useInterfaz} from '../../stores/interfaz.js'
import { fechaHoyCorta } from '../../js/fechayhora.js'

const router = useRouter()
const route = useRoute()
const interfaz = useInterfaz()
const fichaId = route.params.id
const cargando = ref(true)
const error = ref(null)
const ficha = ref(null)
const cotizacionConfirmada = ref(null)
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

// Estado para el modal de Aprobación de Cotización
const mostrarModalCotizacion = ref(false)
const cotizacionSeleccionada = ref(null)
const procesandoEstadoCotizacion = ref(false)
const errorModalCotizacion = ref('')

// Estado para el modal de Advertencia (Bloqueo de Ficha)
const mostrarModalAdvertencia = ref(false)
const mostrarModalListoEntrega = ref(false)
const mostrarModalConfirmarPresupuesto = ref(false)
const estadoTemporal = ref(null)
const procesandoEstadoFicha = ref(false)

const isFichaBloqueada = computed(() => {
  return ficha.value && (Number(ficha.value.estado) === 6 || Number(ficha.value.estado) === 7)
})

const diasEstacionamiento = computed(() => {
  if (!ficha.value || !ficha.value.fecha_estacionamiento) return 0
  const inicio = new Date(ficha.value.fecha_estacionamiento)
  const hoy = new Date()
  const diffTime = hoy - inicio
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
})

const totalCargoEstacionamiento = computed(() => {
  const dias = diasEstacionamiento.value
  if (dias > 0) {
    if (isFichaBloqueada.value) {
      return
    }else{
      actualizarEstadoEstacionamiento()
    }
  }
  return dias * 5000
})

const actualizarEstadoEstacionamiento = async()=>{
  if (!ficha.value) return
  const {error} = await supabase
    .from('ficha_de_trabajo')
    .update({
      estado: 5
    })
    .eq('id', ficha.value.id)
  if (error) throw error
}

const goBack = () => {
  router.push({ name: 'listado-fichas-de-trabajo' })
}

const irAVerCotizacion = (id) => {
  if (isFichaBloqueada.value) return
  router.push({ name: 'ver-cotizacion', params: { id } })
}

const irAVerOT = (id) => {
  if (isFichaBloqueada.value) return
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

const irACotizacion = (id, numero) => {
    if (isFichaBloqueada.value) return
    router.push({ name: 'ver-cotizacion-ficha-de-trabajo', params: {id: ficha.value.id, cotizacion_id: id}, query: {numero: numero} })
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
    
    const abrirModalCotizacion = (cotizacion) => {
      if (Number(cotizacion.estado) !== 1) {
        irAVerCotizacion(cotizacion.id)
        return
      }
      cotizacionSeleccionada.value = cotizacion
      errorModalCotizacion.value = ''
      mostrarModalCotizacion.value = true
    }
    
    const cerrarModalCotizacion = () => {
      mostrarModalCotizacion.value = false
      cotizacionSeleccionada.value = null
    }
    
    const actualizarEstadoCotizacion = async (nuevoEstado) => {
      if (!cotizacionSeleccionada.value) return
    
      procesandoEstadoCotizacion.value = true
      errorModalCotizacion.value = ''
      
      try {
        const { error } = await supabase
          .from('cotizaciones_ficha')
          .update({ estado: nuevoEstado })
          .eq('id', cotizacionSeleccionada.value.id)
    
        if (error) throw error
    
        await cargarDatos()
        cerrarModalCotizacion()
    
      } catch (err) {
        console.error('Error al actualizar estado:', err)
        errorModalCotizacion.value = 'No se pudo actualizar el estado. Inténtalo de nuevo.'
      } finally {
        procesandoEstadoCotizacion.value = false
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

const formatFechaHora = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString('es-CL', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const obtenerTextoEstadoCotizacion = (estado) => {
  switch (Number(estado)) {
    case 2: return 'Aprobada'
    case 3: return 'Rechazada'
    case 1: return 'Pendiente'
    default: return 'Inicial'
  }
}

const obtenerColorEstadoCotizacion = (estado) => {
  switch (Number(estado)) {
    case 2: return 'text-green-600'
    case 3: return 'text-red-600'
    case 1: return 'text-yellow-600'
    default: return 'text-purple-600'
  }
}

const cotizaciones = ref([])

const cargarDatos = async () => {
  cargando.value = true
  error.value = null
  try {
    const { data: dataFicha, error: errorFicha } = await supabase
      .from('ficha_de_trabajo')
      .select(`*, cliente (*),orden_trabajo (*, trabajadores(*),vehiculo(*,cliente(*))),cotizaciones_ficha(*,detalle_cotizaciones_ficha(*),serviml_cuenta(*))`) 
      .eq('id', fichaId)
      .single()
    if (errorFicha) throw errorFicha
    ficha.value = dataFicha
    tallerSeleccionado.value = ficha.value.id_taller
    cotizaciones.value = dataFicha.cotizaciones_ficha
    cotizacionConfirmada.value = dataFicha.cotizaciones_ficha.find(c => c.estado === 2)
    }
   catch (err) {
    console.error("Error al cargar los datos:", err)
    error.value = "No se pudo cargar la información de la ficha. Revisa la conexión."
  } finally {
    cargando.value = false
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
        origen_ingreso: ficha.value.origen_ingreso,
        id_taller: tallerSeleccionado.value
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

const generarPresupuesto = async () => {
  if (!cotizacionConfirmada.value){
    alert('No se puede generar el presupuesto porque no existe una cotización aprobada')
    return
  }
  mostrarModalConfirmarPresupuesto.value = true
}

const ejecutarGenerarPresupuesto = async () => {
  mostrarModalConfirmarPresupuesto.value = false
  router.push({name: 'ver-presupuesto-ficha-de-trabajo', params: {id: fichaId}, query: {generar: true}})
}

const irAPresupuesto = async () => {
  router.push({name: 'ver-presupuesto-ficha-de-trabajo', params: {id: fichaId}})
}

const GenerarInforme = async () => {
  if (ficha.value.estado < 4){
    alert('No se puede generar el informe porque la ficha no está lista')
    return
  }
  router.push({name: 'ver-informe-ficha-de-trabajo', params: {id: fichaId}, query: {generar: true}})
}

const irAInforme = async () => {
  router.push({name: 'ver-informe-ficha-de-trabajo', params: {id: fichaId}})
}

const talleres = ref([])

const tallerSeleccionado = ref(null)

const cargarTalleres = async () => {
  try{
    const {data,error} = await supabase
    .from('serviml_taller')
    .select('*')
    if(error) throw error
    talleres.value = data
  }
  catch(err){
    console.error("Error al cargar los talleres:", err)
  }
}

const estadosFicha = ref([])

const cargarEstados = async () => {
  try{
    const {data,error} = await supabase
    .from('tabla_estados_ficha')
    .select('*')
    .order('orden')
    if(error) throw error
    estadosFicha.value = data
  }
  catch(err){
    console.error("Error al cargar los estados:", err)
  }
}


const cambiarEstadoFicha = async (estado) => {
  if (isFichaBloqueada.value) return // No permitir cambios si ya está bloqueada
  if (estado === 5) {
    return
  }
  if (ficha.value.estado >= 4 && estado < ficha.value.estado){
    return
  }
  if (estado === 4) {
    estadoTemporal.value = estado
    mostrarModalListoEntrega.value = true
    return
  }
  if (Number(estado) === 6 || Number(estado) === 7) {
    estadoTemporal.value = estado
    mostrarModalAdvertencia.value = true
    return
  }
  ejecutarCambioEstado(estado)
}

const ejecutarCambioEstado = async (estado) => {
  procesandoEstadoFicha.value = true
  try {
    const updates = { estado: estado }
    if (estado === 6 || estado === 7) {
      const hoy = new Date()
      const tzOffset = hoy.getTimezoneOffset() * 60000
      const localISOTime = (new Date(hoy.getTime() - tzOffset)).toISOString().slice(0, -1)
      if (ficha.value.fecha_estacionamiento) {
        updates.fecha_termino_estacionamiento = localISOTime
        updates.fecha_entrega = localISOTime
      } else {
        updates.fecha_entrega = localISOTime
      }
    }

    const { data, error } = await supabase
      .from('ficha_de_trabajo')
      .update(updates)
      .eq('id', fichaId)
    
    if (error) throw error
    ficha.value.estado = estado
    if (updates.fecha_termino_estacionamiento) {
      ficha.value.fecha_termino_estacionamiento = updates.fecha_termino_estacionamiento
    }
    if (updates.fecha_entrega) {
      ficha.value.fecha_entrega = updates.fecha_entrega
    }
    mostrarModalAdvertencia.value = false
  }
  catch (err) {
    console.error("Error al cambiar el estado de la ficha:", err)
  } finally {
    procesandoEstadoFicha.value = false
  }
}

const confirmarCambioEstado = () => {
  if (estadoTemporal.value) {
    ejecutarCambioEstado(estadoTemporal.value)
  }
}

const confirmarListoEntrega = async () => {
  procesandoEstadoFicha.value = true
  try {
    const hoy = new Date()
    // Sumar 3 días
    hoy.setDate(hoy.getDate() + 3)
    const tzOffset = hoy.getTimezoneOffset() * 60000
    const localISOTime = new Date(hoy.getTime() - tzOffset).toISOString().slice(0, -1)
    
    const { error } = await supabase
      .from('ficha_de_trabajo')
      .update({ 
        estado: 4,
        fecha_estacionamiento: localISOTime
      })
      .eq('id', fichaId)
    
      if (error) throw error
      
    ficha.value.estado = 4
    ficha.value.fecha_estacionamiento = localISOTime
    mostrarModalListoEntrega.value = false
  } catch (err) {
    console.error("Error al poner listo para entrega:", err)
  } finally {
    procesandoEstadoFicha.value = false
  }
}


onMounted(async () => {
  interfaz.showLoading()
  if (fichaId) {
    await cargarDatos()
    await traerEstados()
    await cargarEstados()
    await cargarTalleres()
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
      <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 p-4 mb-6 overflow-x-auto">
        <div class="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-2 min-w-max md:min-w-0" :class="{ 'pointer-events-none grayscale-[0.5]': isFichaBloqueada }">
          <div v-for="estado in estadosFicha" :key="estado.id" class="flex flex-col items-center group">
            <div
            @click="cambiarEstadoFicha(estado.id)"
              class="relative px-6 py-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              :class="{ 'opacity-50 hover:opacity-100': estado.id !== ficha.estado }">
              <div class="absolute inset-0 transform -skew-x-12 rounded shadow-sm" :style="{ backgroundColor: estado.color }"></div>
              <span class="relative z-10 font-bold text-white text-sm whitespace-nowrap">{{ estado.estado }}</span>
            </div>
            <div v-if="estado.id === ficha.estado" class="mt-2 text-blue-600 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>  
            </div>
          </div>
        </div>
      </div>
      <div v-if="isFichaBloqueada" class="mb-6 p-4 bg-blue-100 border-l-4 border-blue-600 text-blue-800 rounded shadow-sm flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="font-bold">La ficha de trabajo está cerrada. Modo solo lectura.</p>
      </div>
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
              <button v-if="!isFichaBloqueada" @click="guardarFicha" class="text-black servi-yellow p-2 rounded-lg hover:text-gray-200 text-xs uppercase tracking-wider flex items-center gap-1 transition-colors">Guardar</button>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="w-full">
                    <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Origen Ingreso</label>
                    <select :disabled="isFichaBloqueada" class="servi-grey-font font-medium border border-gray-100 rounded-lg p-2 w-full disabled:cursor-not-allowed" v-model="ficha.origen_ingreso">
                      <option value="cliente">Conducido por Cliente</option>
                      <option value="grua">Grúa / Remolque</option>
                      <option value="tercero">Chofer / Tercero</option>
                    </select>
                  </div>
                  <div class="w-full">
                    <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Taller</label>
                    <select :disabled="isFichaBloqueada" class="servi-grey-font font-medium border border-gray-100 rounded-lg p-2 w-full disabled:cursor-not-allowed" v-model="tallerSeleccionado">
                      <option v-for="taller in talleres" :key="taller.id" :value="taller.id">{{ taller.nombre }}</option>
                    </select>
                  </div>
                <div class="w-full">
                  <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Motivo de Ingreso</label>
                  <p class="servi-grey-font font-medium">{{ ficha.motivo_ingreso || 'Sin información registrada.' }}</p>
                </div>
                <div class="w-full">
                  <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Fecha de Ingreso</label>
                  <input :disabled="isFichaBloqueada" class="servi-grey-font font-medium border border-gray-100 rounded-lg p-2 w-full disabled:cursor-not-allowed" type="datetime-local" v-model="ficha.fecha_ingreso">
                </div>
                <div class="w-full">
                  <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Fecha de Promesa de Entrega</label>
                  <input :disabled="isFichaBloqueada" class="servi-grey-font font-medium border border-gray-100 rounded-lg p-2 w-full disabled:cursor-not-allowed" type="date" v-model="ficha.fecha_promesa">
                </div>
                <div class="w-full">
                  <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Fecha inicio Estacionamiento</label>
                  <div class="flex items-center gap-2">
                    <p class="servi-grey-font font-medium">{{ formatFechaHora(ficha.fecha_estacionamiento) || 'No registrado' }}</p>
                    <span v-if="diasEstacionamiento > 0" class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      {{ diasEstacionamiento }} {{ diasEstacionamiento === 1 ? 'día' : 'días' }} ({{ formatMoneda(totalCargoEstacionamiento) }})
                    </span>
                  </div>
                </div>
                <div class="w-full">
                  <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Fecha fin Estacionamiento</label>
                  <p class="servi-grey-font font-medium">{{ formatFechaHora(ficha.fecha_termino_estacionamiento) || 'No registrado' }}</p>
                </div>
                <div class="w-full">
                  <label class="block text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Fecha de Entrega</label>
                  <p class="servi-grey-font font-medium">{{ formatFechaHora(ficha.fecha_entrega) || 'No registrado' }}</p>
                </div>
            </div>
          </div>
          </div>
          <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="servi-blue px-6 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 class="text-white font-bold text-lg">Vehículos</h2>
              <button v-if="!isFichaBloqueada" @click="abrirModalOT" class="text-black servi-yellow p-2 rounded-lg hover:text-gray-200 text-xs uppercase tracking-wider flex items-center gap-1 transition-colors">
                Agregar
              </button>
            </div>
            <div class="p-6">
              <div v-if="ficha.orden_trabajo" class="flex flex-row" :class="{ 'pointer-events-none opacity-80': isFichaBloqueada }">
                <OTcard v-for="(orden, i) in ficha.orden_trabajo" :key="orden.id" :orden="orden" :index="i" :estado="handleEstados(orden.estado_actual_id)" />
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
              <button v-if="!cotizacionConfirmada && !isFichaBloqueada" @click="crearCotizacion" class="text-black servi-yellow p-2 rounded-lg hover:text-gray-200 text-xs uppercase tracking-wider flex items-center gap-1 transition-colors">Crear</button>
            </div>
            <div v-if="cotizaciones.length > 0" class="divide-y divide-gray-100 max-h-60 overflow-y-auto custom-scrollbar">
              <div v-for="(cotizacion, i) in cotizaciones" :key="cotizacion.id"
                @click="irACotizacion(cotizacion.id,i+1)"
                class="p-4 hover:bg-gray-50 transition-colors cursor-pointer group flex justify-between items-center"
                :class="{ 'pointer-events-none opacity-70': isFichaBloqueada }">
                <div>
                  <p class="font-bold servi-grey-font text-sm group-hover:text-blue-600 transition-colors">Cotización N°{{ i + 1 }}</p>
                  <p class="text-xs servi-grey-font">{{ formatFecha(cotizacion.created_at) }}</p>
                </div>
                <div class="text-right flex items-end gap-1 align-center justify-center">
                  <div class="flex flex-col items-center justify-center align-center">
                    <p class="font-bold servi-grey-font text-sm leading-none">{{ formatMoneda(cotizacion.total_final) }}</p>
                    <span class="text-[10px] font-bold uppercase tracking-wide" :class="obtenerColorEstadoCotizacion(cotizacion.estado)">
                      {{ obtenerTextoEstadoCotizacion(cotizacion.estado) }}
                    </span>
                  </div>
                </div>
                
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 italic p-6 text-center">No hay cotizaciones previas.</p>
          </div>
          <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div class="servi-blue px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <span class="text-sm font-bold text-white uppercase tracking-wider">Acciones</span>
             </div>
             <div class="p-4 grid grid-cols-1 gap-3">
                <button v-if="ficha.presupuesto" @click="irAPresupuesto" class="w-full py-2.5 px-4 servi-blue text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                  ir al presupuesto
                </button>
                <button v-else-if="cotizacionConfirmada && !isFichaBloqueada" @click="generarPresupuesto" class="w-full py-2.5 px-4 servi-blue text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                  Generar presupuesto
                </button>
                <button v-if="ficha.presupuesto && !ficha.informe_final && !isFichaBloqueada" @click="GenerarInforme" class="w-full py-2.5 px-4 servi-blue text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                  Generar informe
                </button>
                <button v-else-if="ficha.informe_final" @click="irAInforme" class="w-full py-2.5 px-4 servi-blue text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                  ir al informe
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
    <!-- Modal de Advertencia (Bloqueo de Ficha) -->
    <div v-if="mostrarModalAdvertencia" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">

      <div class="servi-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        <div class="bg-amber-500 px-6 py-4 flex justify-between items-center text-white">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Advertencia Importante
            </h3>
            <button @click="mostrarModalAdvertencia = false" class="text-white hover:text-amber-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div class="p-6 space-y-4">
            <p class="servi-grey-font font-medium">
              Al cambiar el estado a <span class="font-bold underline">{{ estadoTemporal === 6 ? 'Entregado' : 'Cancelado' }}</span>, la ficha se bloqueará PERMANENTEMENTE y no se podrán realizar más cambios.
            </p>
            <p class="text-sm servi-grey-font">
              ¿Estás seguro de que deseas continuar con esta acción?
            </p>
        </div>
        <div class="servi-blue px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
            <button @click="mostrarModalAdvertencia = false" class="px-4 py-2 text-sm font-medium text-white hover:bg-gray-200 rounded-lg transition-colors">
                Cancelar
            </button>
            <button 
                @click="confirmarCambioEstado" 
                :disabled="procesandoEstadoFicha"
                class="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-70">
                <svg v-if="procesandoEstadoFicha" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Confirmar y Bloquear
            </button>
        </div>

      </div>
    </div>

    <!-- Modal de Confirmación Listo para Entrega -->
    <div v-if="mostrarModalListoEntrega" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
      <div class="servi-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        <div class="servi-blue px-6 py-4 flex justify-between items-center text-white">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Listo para Entrega
            </h3>
            <button @click="mostrarModalListoEntrega = false" class="text-white hover:text-blue-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div class="p-6 space-y-4">
            <p class="servi-grey-font font-medium">
              ¿Confirmas que el vehículo está <span class="font-bold text-blue-600">Listo para Entrega</span>?
            </p>
            <p class="text-sm servi-grey-font">
              Esta acción establecerá la fecha de inicio de estacionamiento para dentro de 3 días.
            </p>
        </div>

        <div class="servi-blue px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
            <button @click="mostrarModalListoEntrega = false" class="px-4 py-2 text-sm font-medium text-white hover:bg-gray-200 rounded-lg transition-colors">
                Cancelar
            </button>
            <button 
                @click="confirmarListoEntrega" 
                :disabled="procesandoEstadoFicha"
                class="px-5 py-2 text-sm font-bold text-black servi-yellow rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-70">
                <svg v-if="procesandoEstadoFicha" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Confirmar
            </button>
        </div>

      </div>
    </div>
    <!-- Modal de Confirmación Generar Presupuesto -->
    <div v-if="mostrarModalConfirmarPresupuesto" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
      <div class="servi-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div class="servi-blue px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 class="text-lg font-bold text-white">Generar Presupuesto Final</h3>
          <button @click="mostrarModalConfirmarPresupuesto = false" class="text-white hover:text-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="bg-amber-50 p-4 rounded-lg border border-amber-200 flex items-start gap-3">
            <div class="bg-amber-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-amber-600">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-bold text-amber-800">Atención: Acción Final</p>
              <p class="text-sm text-amber-700 mt-1">
                Generar el presupuesto es el último paso en la Ficha de Trabajo. Este proceso calculará el <b>Total del Servicio + el Estacionamiento acumulado</b> hasta el momento.
              </p>
            </div>
          </div>
          <p class="text-sm servi-grey-font">
            ¿Deseas proceder con la generación del presupuesto final?
          </p>
        </div>
        <div class="px-6 py-4 servi-blue flex justify-end gap-3">
          <button @click="mostrarModalConfirmarPresupuesto = false" class="px-4 py-2 text-sm font-medium text-white hover:text-gray-800 transition-colors">
            Cancelar
          </button>
          <button @click="ejecutarGenerarPresupuesto" class="px-5 py-2 text-sm font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors shadow-sm">
            Confirmar y Generar
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