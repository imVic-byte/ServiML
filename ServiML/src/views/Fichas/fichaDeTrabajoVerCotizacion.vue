<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../lib/supabaseClient.js'
import navbar from '../../components/componentes/navbar.vue'
import modal from '../../components/componentes/modal.vue'
import pdf from './cotizacionesPDF.vue'
import html2pdf from 'html2pdf.js'
import { useInterfaz } from '@/stores/interfaz.js'
import volveraFicha from '../../components/componentes/volveraFicha.vue'

const interfaz = useInterfaz()
const route = useRoute()
const router = useRouter()
const cotizacion = ref(null)
const n_cotizacion = ref(route.query.numero)
const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true })
const confirmada = ref(false)
const isPendiente = computed(() => cotizacion.value.estado === 1 || cotizacion.value.estado === 4)
const cuentasBancarias = ref([])
const cuentaSeleccionada = ref(null)

const camelCase = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

const formatearNumero = (numero) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(numero);
}

const formatearFecha = (fechaString) => {
  if (!fechaString) return '---'
  const fecha = new Date(fechaString)
  return fecha.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const redirigir = () => {
    modalState.value.visible = false;
    if (modalState.value.exito) {
      router.push({ name: "ficha-de-trabajo", params: { id: route.params.id } });
    }
}

const generarPDF = () => {
  const elemento = document.getElementById('elemento-a-imprimir');
  const opciones = {
    margin:       0,
    filename:     `Cotizacion_${n_cotizacion.value || cotizacion.value.id}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opciones).from(elemento).save();
}

const confirmarCotizacion = async () => {
  const {data,error} = await supabase.from('cotizaciones_ficha').update({estado:2, id_cuenta: cuentaSeleccionada.value.id}).eq('id',route.params.cotizacion_id).select().single()
  if(data){
    modalState.value.visible = true;
    modalState.value.titulo = "Exito";
    modalState.value.mensaje = "Cotización confirmada";
    modalState.value.exito = true;
  }else{
    modalState.value.visible = true;
    modalState.value.titulo = "Error";
    modalState.value.mensaje = error.message;
    modalState.value.exito = false;
  }
}

const descartarCotizacion = async () => {
  const {data,error} = await supabase.from('cotizaciones_ficha').update({estado:3}).eq('id',route.params.cotizacion_id).select().single()
  if(data){
    modalState.value.visible = true;
    modalState.value.titulo = "Exito";
    modalState.value.mensaje = "Cotización descartada";
    modalState.value.exito = true;
  }else{
    modalState.value.visible = true;
    modalState.value.titulo = "Error";
    modalState.value.mensaje = error.message;
    modalState.value.exito = false;
  }
}

const cargarDatos = async () => {
    const { data, error } = await supabase
      .from('cotizaciones_ficha')
      .select('*,detalle_cotizaciones_ficha(*),ficha_de_trabajo(*,cliente(*))')
      .eq('id', route.params.cotizacion_id)
      .single()
    if (data) {
        cotizacion.value = data
        confirmada.value = Number(data.estado) === 2
    } else {
        console.log(error)
    }

    const { data: cuentas } = await supabase
      .from('serviml_cuenta')
      .select('*')
      .eq('id_serviml', 1)
    if (cuentas && cuentas.length > 0) {
      cuentasBancarias.value = cuentas
      cuentaSeleccionada.value = cuentas[0]
    }
}

onMounted(async () => {
    interfaz.showLoading();
    await cargarDatos();
    interfaz.hideLoading();
})
</script>
<template>
<div v-if="cotizacion" class="servi-white min-h-screen">
    <navbar :titulo="'Cotización #' + n_cotizacion" subtitulo="Detalle de cotización" class="navbar" />
    
    <div class="mx-auto p-4 max-w-5xl pb-28">
        <volveraFicha />
        
        <div class="flex flex-col lg:flex-row gap-6 mt-6">
            
            <!-- Columna izquierda -->
            <div class="lg:w-2/3 space-y-6">

                <!-- Info General -->
                <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="servi-blue px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                        <h2 class="text-white font-bold text-lg">Información General</h2>
                    </div>
                    
                    <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Cliente -->
                        <div>
                            <h3 class="text-xs font-semibold servi-grey-font uppercase tracking-wider mb-3">Datos del Cliente</h3>
                            <div class="space-y-2 text-sm servi-grey-font">
                                <p class="flex flex-col">
                                    <span class="servi-grey-font text-xs font-bold">Cliente</span>
                                    <span class="servi-grey-font">{{ camelCase(cotizacion.ficha_de_trabajo?.cliente?.nombre) + ' ' + camelCase(cotizacion.ficha_de_trabajo?.cliente?.apellido) || 'No registrado' }}</span>
                                </p>
                            </div>
                            <div>
                              <p class="flex flex-col">
                                <span class="servi-grey-font text-xs font-bold">Telefono</span>
                                <span class="servi-grey-font">+{{cotizacion.ficha_de_trabajo?.cliente?.codigo_pais + ' ' + cotizacion.ficha_de_trabajo?.cliente?.telefono || 'No registrado' }}</span>
                              </p>
                              <p class="flex flex-col">
                                <span class="servi-grey-font text-xs font-bold">Email</span>
                                <span class="servi-grey-font">{{ cotizacion.ficha_de_trabajo?.cliente?.email || 'No registrado' }}</span>
                              </p>
                            </div>
                        </div>

                        <!-- Diagnóstico y fechas -->
                        <div>
                            <h3 class="text-xs font-semibold servi-grey-font uppercase tracking-wider mb-3">Detalles</h3>
                            <div class="space-y-2 text-sm servi-grey-font">
                                <p>
                                    <span class="block text-xs font-bold servi-grey-font">Motivo de Ingreso</span>
                                    <span class="italic servi-grey-font">{{ camelCase(cotizacion.ficha_de_trabajo?.motivo_ingreso) || 'No registrado' }}</span>
                                </p>
                                <p>
                                    <span class="block text-xs font-bold servi-grey-font">Comentarios adicionales</span>
                                    <span class="italic servi-grey-font">{{ cotizacion.ficha_de_trabajo?.comentario || 'No registrado' }}</span>
                                </p>
                                <p>
                                    <span class="block text-xs servi-grey-font font-bold">Fecha de Emisión</span>
                                    {{ formatearFecha(cotizacion.created_at) }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Servicios -->
                <div v-if="cotizacion.detalle_cotizaciones_ficha && cotizacion.detalle_cotizaciones_ficha.length > 0" class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-100 servi-blue">
                        <h3 class="text-white font-bold">Servicios Solicitados</h3>
                    </div>
                    <div class="divide-y divide-gray-800">
                        <div v-for="detalle in cotizacion.detalle_cotizaciones_ficha" :key="detalle.id" class="px-6 py-4 flex justify-between items-center hover:opacity-80 transition-colors">
                            <span class="text-sm servi-grey-font font-medium">{{ camelCase(detalle.descripcion) }}</span>
                            <span class="text-sm font-bold servi-grey-font">{{ formatearNumero(detalle.monto) }} x {{ detalle.cantidad }} = {{ formatearNumero(detalle.monto * detalle.cantidad) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Columna derecha -->
            <div class="lg:w-1/3 space-y-6">

                <!-- Resumen Financiero -->
                <div v-if="cotizacion.detalle_cotizaciones_ficha && cotizacion.detalle_cotizaciones_ficha.length > 0" class="servi-blue rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-sm font-bold text-white p-3 flex justify-between items-center">Resumen Financiero</h3>
                    
                    <div class="space-y-3 servi-adapt-bg p-6 rounded-b-xl">
                        <div class="flex justify-between items-center text-sm servi-grey-font">
                            <span>Subtotal</span>
                            <span class="font-medium">{{ formatearNumero(cotizacion.subtotal || 0) }}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm servi-grey-font">
                            <span>Descuento</span>
                            <span class="text-green-600 font-medium">- {{ cotizacion.descuento || '0' }}%</span>
                        </div>
                        <div class="flex justify-between items-center text-sm servi-grey-font">
                            <span>Neto</span>
                            <span class="font-medium">{{ formatearNumero(cotizacion.total_neto || 0) }}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm servi-grey-font">
                            <span>IVA (19%)</span>
                            <span class="font-medium">{{ formatearNumero(cotizacion.iva || 0) }}</span>
                        </div>
                        
                        <div class="pt-4 mt-2 border-t border-gray-100 flex justify-between items-center">
                            <span class="font-bold servi-grey-font text-lg">TOTAL</span>
                            <span class="font-extrabold text-2xl servi-grey-font">{{ formatearNumero(cotizacion.total_final || 0) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Acciones -->
                <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-xs rounded-t-xl font-semibold uppercase servi-blue p-3 flex justify-between items-center text-white tracking-wider mb-4">Acciones</h3>
                    <div v-if="cuentasBancarias.length > 0 && !confirmada" class="mb-4 servi-adapt-bg py-2 px-3">
                      <label class="block text-xs font-semibold servi-grey-font uppercase tracking-wider mb-2">Cuenta para PDF</label>
                      <select
                        v-model="cuentaSeleccionada"
                        class="w-full rounded-lg servi-blue text-white border border-gray-100 px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option v-for="cuenta in cuentasBancarias" :key="cuenta.id" :value="cuenta">
                          {{ cuenta.banco }} - {{ cuenta.titular }}
                        </option>
                      </select>
                    </div>
                    <div class="py-2 px-3 space-y-3 pb-4 flex flex-col justify-between items-center">
                        <button 
                          @click="generarPDF"
                          class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg servi-yellow text-black border border-gray-200 hover:bg-blue-800 transition-colors text-sm font-medium"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Descargar PDF
                        </button> 
                        <div v-if="isPendiente" class="w-full">
                        <button @click="confirmarCotizacion" class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg servi-blue text-white border border-gray-200 hover:bg-blue-800 transition-colors text-sm font-medium">Confirmar</button>
                        <button @click="descartarCotizacion" class="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg servi-grey-font hover:bg-blue-800 transition-colors text-sm font-medium">Descartar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="fixed left-[-9999px] top-0">
            <pdf :cotizacion="cotizacion" :cuentaSeleccionada="cuentaSeleccionada" :numero="n_cotizacion"/>
        </div>

        <modal 
            v-if="modalState.visible" 
            :titulo="modalState.titulo" 
            :mensaje="modalState.mensaje" 
            :exito="modalState.exito" 
            @cerrar="redirigir" 
        />
    </div>
</div>
</template>

<style scoped>
.badge-aprobada {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #46e450ec;
  color: #4d4d4d;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-rechazada {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #ff4c4c;
  color: #ffffff;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-pendiente {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #fbd446fd;
  color: #514d4d;
  font-weight: bold;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-cerrada {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #52026f;
  color: #ffffff;
  border-radius: 4px;
  text-transform: uppercase;
}
</style>
