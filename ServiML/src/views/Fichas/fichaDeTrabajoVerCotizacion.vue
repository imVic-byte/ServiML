<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../lib/supabaseClient.js'
import navbar from '../../components/componentes/navbar.vue'
import modal from '../../components/componentes/modal.vue'
import pdf from './cotizacionesPDF.vue'
import html2pdf from 'html2pdf.js'
import { useInterfaz } from '@/stores/interfaz.js'
import { generarFichaTrabajo } from '../../js/generarFicha.js'

const interfaz = useInterfaz()
const route = useRoute()
const router = useRouter()
const cotizacion = ref(null)
const n_cotizacion = ref()
const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true })
const confirmada = ref(false)
// Modal confirmación
const modalConfirmacion = ref(false)
const correoCliente = ref('')
const codigoPais = ref('+56')
const telefonoCliente = ref('')

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
      router.push({ name: "ficha-de-trabajo", params: { id: cotizacion.value.id_ficha_trabajo } });
    }
}

const irAEditar = () => {
    router.push({ name: "editar-cotizacion", params: { id: route.params.id } });
}

const mostrarModalConfirmacion = () => {
    modalConfirmacion.value = true
}

const cerrarModalConfirmacion = () => {
    modalConfirmacion.value = false
    correoCliente.value = ''
    codigoPais.value = '+56'
    telefonoCliente.value = ''
}

// Sanitizar teléfono: solo dígitos
const sanitizarTelefono = (e) => {
    telefonoCliente.value = e.target.value.replace(/\D/g, '')
}

// Validaciones
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emailValido = computed(() => {
    if (!correoCliente.value) return true // opcional
    return emailRegex.test(correoCliente.value)
})

const telefonoValido = computed(() => {
    return telefonoCliente.value.length >= 7 && telefonoCliente.value.length <= 15
})

const formularioValido = computed(() => {
    return telefonoValido.value && emailValido.value
})

const generarFicha = async () => {
    modalConfirmacion.value = false
    interfaz.showLoading();
    const data = {
      cliente:{
        nombre: cotizacion.value.nombre,
        apellido: cotizacion.value.apellido,
        email: correoCliente.value || null,
        codigo_pais: codigoPais.value,
        telefono: telefonoCliente.value
      },
      ficha_de_trabajo:{
        motivo_ingreso: cotizacion.value.diagnostico
      },
      id_cotizacion: cotizacion.value.id
    }
    const { exito, ficha_de_trabajo, mensaje } = await generarFichaTrabajo(data);
    if (exito) {
      modalState.value.visible = true;
      modalState.value.titulo = "Exito";
      modalState.value.mensaje = mensaje;
      modalState.value.exito = true;
    } else {
      modalState.value.visible = true;
      modalState.value.titulo = "Error";
      modalState.value.mensaje = mensaje;
      modalState.value.exito = false;
    }
    interfaz.hideLoading();
    cerrarModalConfirmacion();
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

onMounted(async () => {
    interfaz.showLoading();
    const { data, error } = await supabase
      .from('cotizaciones_ficha')
      .select('*,detalle_cotizaciones_ficha(*),ficha_de_trabajo(*,cliente(*))')
      .eq('id', route.params.id)
      .single()
    if (data) {
        cotizacion.value = data
        n_cotizacion.value = data.id
        confirmada.value = data.estado === 2
    } else {
        console.log(error)
    }
    console.log(cotizacion.value)
    interfaz.hideLoading();

    const { data: cuentas } = await supabase
      .from('serviml_cuenta')
      .select('*')
      .eq('id_serviml', 1)
    if (cuentas && cuentas.length > 0) {
      cuentasBancarias.value = cuentas
      cuentaSeleccionada.value = cuentas[0]
    }
})
</script>
<template>
<div v-if="cotizacion" class="servi-white min-h-screen">
    <navbar :titulo="'Cotización #' + n_cotizacion" subtitulo="Detalle de cotización" class="navbar" />
    
    <div class="mx-auto p-4 max-w-5xl pb-28">
        
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
                        </div>

                        <!-- Diagnóstico y fechas -->
                        <div>
                            <h3 class="text-xs font-semibold servi-grey-font uppercase tracking-wider mb-3">Detalles</h3>
                            <div class="space-y-2 text-sm servi-grey-font">
                                <p>
                                    <span class="block text-xs font-bold servi-grey-font">Diagnóstico / Descripción</span>
                                    <span class="italic servi-grey-font">{{ camelCase(cotizacion.ficha_de_trabajo?.motivo_ingreso) || 'No registrado' }}</span>
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
                    <div class="py-2 px-3 space-y-3 pb-4">
                        <button 
                          @click="generarPDF"
                          class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg servi-blue text-white border border-gray-200 hover:bg-blue-800 transition-colors text-sm font-medium"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Descargar PDF
                        </button>
                        <button 
                          v-if="!confirmada"
                          @click="irAEditar"
                          class="servi-blue w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-gray-200 text-white hover:bg-blue-50 transition-colors text-sm font-medium"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar Cotización
                        </button>
                        <button 
                          v-if="!confirmada"
                          @click="mostrarModalConfirmacion"
                          class="servi-blue w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-gray-200 text-white hover:bg-blue-50 transition-colors text-sm font-medium"
                        >
                          Generar Ficha de Trabajo
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- PDF oculto para html2pdf -->
        <div class="fixed left-[-9999px] top-0">
            <pdf :cotizacion="cotizacion" :cuentaSeleccionada="cuentaSeleccionada" />
        </div>

        <modal 
            v-if="modalState.visible" 
            :titulo="modalState.titulo" 
            :mensaje="modalState.mensaje" 
            :exito="modalState.exito" 
            @cerrar="redirigir" 
        />

        <!-- Modal de Confirmación -->
        <div v-if="modalConfirmacion" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div class="servi-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            
            <!-- Header -->
            <div class="servi-blue px-6 py-4 flex justify-between items-center">
              <h2 class="text-white font-bold text-lg">Confirmar Datos</h2>
              <button @click="cerrarModalConfirmacion" class="text-white/70 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="p-6 space-y-5">

              <!-- Resumen de Cotización -->
              <div>
                <h3 class="text-xs font-semibold servi-grey-font uppercase tracking-wider mb-3">Resumen de la Cotización</h3>
                <div class="rounded-lg border border-gray-200 overflow-hidden">
                  <div class="px-4 py-3 space-y-2 text-sm servi-grey-font">
                    <p class="flex justify-between">
                      <span class="font-semibold">Cliente</span>
                      <span>{{ camelCase(cotizacion.nombre) + ' ' + camelCase(cotizacion.apellido) }}</span>
                    </p>
                    <p class="flex justify-between">
                      <span class="font-semibold">Diagnóstico</span>
                      <span class="text-right max-w-[60%]">{{ camelCase(cotizacion.diagnostico) || '---' }}</span>
                    </p>
                  </div>
                  
                  <div v-if="cotizacion.detalle_cotizacion && cotizacion.detalle_cotizacion.length > 0" class="border-t border-gray-200">
                    <div class="px-4 py-2 text-xs font-semibold servi-grey-font uppercase tracking-wider">Servicios</div>
                    <div v-for="det in cotizacion.detalle_cotizacion" :key="det.id" class="px-4 py-2 flex justify-between text-sm servi-grey-font border-t border-gray-100">
                      <span>{{ camelCase(det.descripcion) }}</span>
                      <span class="font-medium">{{ formatearNumero(det.monto * det.cantidad) }}</span>
                    </div>
                  </div>

                  <div class="px-4 py-3 border-t border-gray-200 flex justify-between font-bold servi-grey-font">
                    <span>Total</span>
                    <span>{{ formatearNumero(cotizacion.total_final || 0) }}</span>
                  </div>
                </div>
              </div>

              <!-- Datos de contacto -->
              <div>
                <h3 class="text-xs font-semibold servi-grey-font uppercase tracking-wider mb-3">Datos de Contacto del Cliente</h3>
                <div class="space-y-3">
                  
                  <!-- Correo -->
                  <div>
                    <label class="block text-xs font-medium servi-grey-font mb-1">Correo electrónico <span class="text-gray-400 text-[10px]">(opcional)</span></label>
                    <input 
                      v-model="correoCliente"
                      type="email" 
                      placeholder="cliente@ejemplo.com"
                      :class="[
                        'w-full rounded-lg border px-3 py-2.5 text-sm servi-grey-font focus:ring-2 focus:border-transparent outline-none transition-all',
                        correoCliente && !emailValido ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'
                      ]"
                    />
                    <p v-if="correoCliente && !emailValido" class="text-red-500 text-xs mt-1">Ingrese un correo válido</p>
                  </div>

                  <!-- Teléfono con código de país -->
                  <div>
                    <label class="block text-xs font-medium servi-grey-font mb-1">Teléfono <span class="text-red-500">*</span></label>
                    <div class="flex gap-2">
                      <select 
                        v-model="codigoPais"
                        class="rounded-lg border border-gray-300 px-2 py-2.5 text-sm servi-grey-font focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-28"
                      >
                        <option value="+56">🇨🇱 +56</option>
                        <option value="+54">🇦🇷 +54</option>
                        <option value="+55">🇧🇷 +55</option>
                        <option value="+57">🇨🇴 +57</option>
                        <option value="+51">🇵🇪 +51</option>
                        <option value="+52">🇲🇽 +52</option>
                        <option value="+58">🇻🇪 +58</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+34">🇪🇸 +34</option>
                      </select>
                      <input 
                        :value="telefonoCliente"
                        @input="sanitizarTelefono"
                        type="tel" 
                        maxlength="15"
                        placeholder="912345678"
                        :class="[
                          'flex-1 rounded-lg border px-3 py-2.5 text-sm servi-grey-font focus:ring-2 focus:border-transparent outline-none transition-all',
                          telefonoCliente && !telefonoValido ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'
                        ]"
                      />
                    </div>
                    <p v-if="telefonoCliente && !telefonoValido" class="text-red-500 text-xs mt-1">Mínimo 7 dígitos</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones -->
            <div class="px-6 py-4 flex gap-3 border-t border-gray-200">
              <button 
                @click="cerrarModalConfirmacion"
                class="flex-1 py-2.5 rounded-lg border border-gray-300 servi-grey-font font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                @click="generarFicha"
                :disabled="!formularioValido"
                :class="[
                  'flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors',
                  formularioValido 
                    ? 'servi-blue text-white hover:opacity-90 cursor-pointer' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]"
              >
                Confirmar y Generar Ficha
              </button>
            </div>
          </div>
        </div>
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
