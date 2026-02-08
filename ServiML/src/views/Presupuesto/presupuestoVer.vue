<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../lib/supabaseClient.js'
import navbar from '../../components/componentes/navbar.vue'
import cargando2 from '../../components/componentes/cargando2.vue'
import acciones from '../../components/presupuesto/acciones.vue'
import { creacionOT } from '../../js/creacionOT.js'
import modal from '../../components/componentes/modal.vue'
import pdf from './presupuestoPDF.vue'
import html2pdf from 'html2pdf.js'
import { subirFacturas } from '../../js/subirFacturas.js'
import { useInterfaz } from '@/stores/interfaz.js'

const interfaz = useInterfaz()
const route = useRoute()
const presupuesto = ref(null)
const n_presupuesto = ref()
const loading = ref(false)
const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true });
const id = ref(route.params.id)
const router = useRouter();

const camelCase = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

const redirigir = () => {
    modalState.value.visible = false;
    router.push({ name: "listado-presupuestos" });
}

const manejarConfirmacion = async () => {
    loading.value = true;
    try {
    const { error } = await supabase
        .from('presupuesto')
        .update({ estado: 2 , updated_at: new Date()})
        .eq('id', route.params.id)

    if (error) {
        console.error(error)
        return
    }
    const opciones = {
    margin:       0,
    filename:     `Presupuesto_${n_presupuesto.value}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    const elemento = document.getElementById('elemento-a-imprimir');
    const pdfBlob = await html2pdf().set(opciones).from(elemento).output('blob');
    
    const exitoPDF = await subirFacturas(id.value, pdfBlob)
    if (!exitoPDF.exito) {
        console.error(exitoPDF.error)
        console.error("error al subir el pdf")
        return
    }
    
if (presupuesto.value.cliente?.email) {
            const { data: dataMail, error: errorMail } = await supabase.functions.invoke('super-task', {
                body: {
                    emailCliente: presupuesto.value.cliente.email,
                    nombreCliente: presupuesto.value.cliente.nombre,
                    urlPdf: exitoPDF.url,
                    folio: n_presupuesto.value
                },
                headers: {
                    Authorization: `Bearer ${import.meta.env.SUPABASE_ANON_KEY}`
                }
            })

            if (errorMail) {
                console.error("❌ Error enviando correo:", errorMail)
            } else {
                console.log("✅ Correo enviado con éxito:", dataMail)
            }
        } else {
            console.warn("⚠️ El cliente no tiene email registrado, se omitió el envío.");
        }
    
    await creacionOT(id.value)
    presupuesto.value.estado = 2
    loading.value = false
    modalState.value = {
        visible: true,
        titulo: "¡Éxito!",
        mensaje: "El presupuesto ha sido confirmado correctamente.",
        exito: true,
    };
    } catch (error) {
        console.error(error)
        loading.value = false
        modalState.value = {
            visible: true,
            titulo: "¡Error!",
            mensaje: "Error al confirmar el presupuesto.",
            exito: false,
        };
    }
    finally {
        loading.value = false
    }
}

const manejarDescarte = async () => {
    loading.value = true;
    try {
    const { error } = await supabase
        .from('presupuesto')
        .update({ estado: 3 })
        .eq('id', route.params.id)

    if (error) {
        console.error(error)
        return
    }
    presupuesto.value.estado = 3
    loading.value = false
    modalState.value = {
        visible: true,
        titulo: "¡Éxito!",
        mensaje: "El presupuesto ha sido descartado correctamente.",
        exito: true,
    };
    } catch (error) {
        console.error(error)
        loading.value = false
        modalState.value = {
            visible: true,
            titulo: "¡Error!",
            mensaje: "Error al descartar el presupuesto.",
            exito: false,
        };
    }
    finally {
        loading.value = false
    }
}
const handleEstados = (estado) => {
  switch (estado) {
    case 2:
      return {clase: 'badge-confirmado', texto: 'Confirmado'}
    case 3:
      return {clase: 'badge-descartado', texto: 'Descartado'}
    case 1:
      return {clase: 'badge-en-espera-de-confirmación', texto: 'En espera de confirmación'}
    default:
      return {clase: 'badge-cerrado', texto: 'Cerrado'}
  }
}
const generarPDF = () => {
  const elemento = document.getElementById('elemento-a-imprimir');
  
  const opciones = {
    margin:       0,
    filename:     `Presupuesto_${n_presupuesto.value}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opciones).from(elemento).save();
};

const formatearNumero = (numero) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(numero);
}

onMounted(async () => {
    interfaz.showLoading();
    const { data, error } = await supabase
    .from('presupuesto')
    .select('*,vehiculo(*),cliente(*),detalle_presupuesto(*)')
    .eq('id', route.params.id)
    if (data) {
        presupuesto.value = data[0]
        n_presupuesto.value = data[0].numero_folio
    } else {
        console.log(error)
    }
    interfaz.hideLoading();
})

</script>
<template>
<div v-if="presupuesto" class="bg-gray-50 min-h-screen">
    <navbar :titulo="'Presupuesto #' + n_presupuesto" subtitulo="Detalle de servicio" />
    
    <div class="mx-auto p-4 max-w-5xl pb-28">
        
        <div class="flex flex-col lg:flex-row gap-6 mt-6">
            
            <div class="lg:w-2/3 space-y-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="servi-blue px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h2 class="servi-white-font font-bold text-lg">Información General</h2>
                        <span :class="handleEstados(presupuesto.estado).clase" class="px-3 py-1 rounded-full text-xs servi-white-font">
                            {{ handleEstados(presupuesto.estado).texto }}
                        </span>
                    </div>
                    
                    <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Datos del Cliente</h3>
                            <div class="space-y-2 text-sm text-gray-700">
                                <p class="flex flex-col">
                                    <span class="font-bold text-gray-900">{{ camelCase(presupuesto.cliente?.nombre) + ' ' + camelCase(presupuesto.cliente?.apellido) || 'No registrado' }}</span>
                                    <span class="text-gray-500 text-xs">Cliente</span>
                                </p>
                                <p>
                                    <span class="block text-xs text-gray-400">Email</span>
                                    {{ presupuesto.cliente?.email || 'No registrado' }}
                                </p>
                                <p>
                                    <span class="block text-xs text-gray-400">Teléfono</span>
                                    +{{ presupuesto.cliente?.codigo_pais + ' ' + presupuesto.cliente?.telefono || 'No registrado' }}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Datos del Vehículo</h3>
                            <div class="space-y-2 text-sm text-gray-700">
                                <p class="flex flex-col">
                                    <span class="font-bold text-gray-900">{{ presupuesto.vehiculo?.patente || 'S/P' }}</span>
                                    <span class="text-gray-500 text-xs">Patente</span>
                                </p>
                                <p>
                                    <span class="block text-xs text-gray-400">Vehículo</span>
                                    {{presupuesto.vehiculo?.marca}} {{presupuesto.vehiculo?.modelo}} {{presupuesto.vehiculo?.anio}}
                                </p>
                                <p>
                                    <span class="block text-xs text-gray-400">Diagnóstico Inicial</span>
                                    <span class="italic text-gray-600">{{ camelCase(presupuesto.diagnostico) || 'No registrado' }}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="presupuesto.detalle_presupuesto.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 class="servi-blue-font font-bold">Servicios Solicitados</h3>
                    </div>
                    <div class="divide-y divide-gray-100">
                        <div v-for="detalle in presupuesto.detalle_presupuesto" :key="detalle.id" class="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <span class="text-sm text-gray-700 font-medium">{{ camelCase(detalle.descripcion) }}</span>
                            <span class="text-sm font-bold servi-blue-font">{{ formatearNumero(detalle.monto) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="lg:w-1/3 space-y-6">
                <div v-if="presupuesto.detalle_presupuesto.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 class="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Resumen Financiero</h3>
                    
                    <div class="space-y-3">
                        <div class="flex justify-between items-center text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span class="font-medium">{{ formatearNumero(presupuesto.subtotal || 0) }}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm text-gray-600">
                            <span>Descuento</span>
                            <span class="text-green-600 font-medium">- {{ presupuesto.descuento || '0' }}%</span>
                        </div>
                        <div class="flex justify-between items-center text-sm text-gray-600">
                            <span>Neto</span>
                            <span class="font-medium">{{ formatearNumero(presupuesto.total_neto || 0) }}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm text-gray-600">
                            <span>IVA (19%)</span>
                            <span class="font-medium">{{ formatearNumero(presupuesto.iva || 0) }}</span>
                        </div>
                        
                        <div class="pt-4 mt-2 border-t border-gray-100 flex justify-between items-center">
                            <span class="font-bold text-gray-900 text-lg">TOTAL</span>
                            <span class="font-extrabold text-2xl servi-blue-font">{{ formatearNumero(presupuesto.total_final || 0) }}</span>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Acciones</h3>
                    
                    <div>
                        <acciones
                            :estado="presupuesto.estado"
                            @confirmar="manejarConfirmacion"
                            @descartar="manejarDescarte"
                            @pdf="generarPDF"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="fixed left-[-9999px] top-0">   
            <pdf :presupuesto="presupuesto" />
        </div>

        <modal 
            v-if="modalState.visible" 
            :titulo="modalState.titulo" 
            :mensaje="modalState.mensaje" 
            :exito="modalState.exito" 
            @cerrar="redirigir" 
        />
    </div>
    <cargando2 v-if="loading"/>
</div>
</template>
<style>

.badge-confirmado {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #46e450ec;
  color: #4d4d4d;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-descartado {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #ff4c4c;
  color: #ffffff;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-en-espera-de-confirmación {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #fbd446fd;
  color: #514d4d;
  font-weight: bold;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-cerrado {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #52026f;
  color: #ffffff;
  border-radius: 4px;
  text-transform: uppercase;
}
</style>
