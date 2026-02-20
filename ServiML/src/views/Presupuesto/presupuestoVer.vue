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

const cuentasBancarias = ref([])
const cuentaSeleccionada = ref(null)

const camelCase = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

const redirigir = () => {
    modalState.value.visible = false;
    router.push({ name: "listado-presupuestos" });
}

const irAEditarPresupuesto = () => {
    router.push({ name: "editar-presupuesto", params: { id: route.params.id } });
}

const manejarConfirmacionEdit = async () => {
    const {error} = await supabase
        .from('presupuesto')
        .update({ estado: 2 , updated_at: new Date(), id_cuenta: cuentaSeleccionada.value.id, editado: false})
        .eq('id', route.params.id)

    if (error) {
        console.error(error)
        return
    }
    presupuesto.value.estado = 2
    loading.value = false
    modalState.value = {
        visible: true,
        titulo: "¡Éxito!",
        mensaje: "El presupuesto ha sido confirmado correctamente.",
        exito: true,
    };
}

const manejarDescarteEdit = async () => {
    const {error} = await supabase
        .from('presupuesto')
        .update({ estado: 3, editado: false })
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
}


const manejarConfirmacion = async () => {
    interfaz.showLoadingOverlay()
    try {
    const { error } = await supabase
        .from('presupuesto')
        .update({ estado: 2 , updated_at: new Date(), id_cuenta: cuentaSeleccionada.value.id})
        .eq('id', route.params.id)

    if (error) {
        console.error(error)
        return
    }

    if (presupuesto.value.id_ficha) {
            const { error: cotiError } = await supabase
                .from('cotizacion')
                .update({ estado: 4 })
                .eq('id_ficha', presupuesto.value.id_ficha)
                .eq('estado', 2)

            if (cotiError) {
                console.error("Error al actualizar el estado de la cotización:", cotiError)
            }
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
                        apellidoCliente: presupuesto.value.cliente.apellido,
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
            interfaz.hideLoadingOverlay()
        }
    }

const manejarDescarte = async () => {
    loading.value = true;
    interfaz.showLoadingOverlay()
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
        interfaz.hideLoadingOverlay()
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
const manejarIrAOT = async () => {
    const {data, error} = await supabase.from('orden_trabajo').select('*').eq('id_presupuesto', presupuesto.value.id).single()
    if (data) {
        router.push({name: 'ver-orden-de-trabajo', params: {id: data.id}})
    } else {
        console.log(error)
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

    // Cargar cuentas bancarias
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
<div v-if="presupuesto" class="servi-white min-h-screen">
    <navbar :titulo="'Presupuesto #' + n_presupuesto" subtitulo="Detalle de servicio" />
    
    <div class="mx-auto p-4 max-w-5xl pb-28">
        
        <div class="flex flex-col lg:flex-row gap-6 mt-6">
            
            <div class="lg:w-2/3 space-y-6">
                <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="servi-blue px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                        <h2 class="text-white font-bold text-lg">Información General</h2>
                        <span :class="handleEstados(presupuesto.estado).clase" class="px-3 py-1 rounded-full text-xs servi-grey-font">
                            {{ handleEstados(presupuesto.estado).texto }}
                        </span>
                    </div>
                    
                    <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="text-xs font-semibold servi-grey-font uppercase tracking-wider mb-3">Datos del Cliente</h3>
                            <div class="space-y-2 text-sm servi-grey-font">
                                <p class="flex flex-col">
                                    <span class="font-bold servi-grey-font">{{ camelCase(presupuesto.cliente?.nombre) + ' ' + camelCase(presupuesto.cliente?.apellido) || 'No registrado' }}</span>
                                    <span class="servi-grey-font text-xs">Cliente</span>
                                </p>
                                <p>
                                    <span class="block text-xs servi-grey-font">Email</span>
                                    {{ presupuesto.cliente?.email || 'No registrado' }}
                                </p>
                                <p>
                                    <span class="block text-xs servi-grey-font">Teléfono</span>
                                    +{{ presupuesto.cliente?.codigo_pais + ' ' + presupuesto.cliente?.telefono || 'No registrado' }}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 class="text-xs font-semibold servi-grey-font uppercase tracking-wider mb-3">Datos del Vehículo</h3>
                            <div class="space-y-2 text-sm servi-grey-font">
                                <p class="flex flex-col">
                                    <span class="font-bold servi-grey-font">{{ presupuesto.vehiculo?.patente || 'S/P' }}</span>
                                    <span class="servi-grey-font text-xs">Patente</span>
                                </p>
                                <p>
                                    <span class="block text-xs servi-grey-font">Vehículo</span>
                                    {{presupuesto.vehiculo?.marca}} {{presupuesto.vehiculo?.modelo}} {{presupuesto.vehiculo?.anio}}
                                </p>
                                <p>
                                    <span class="block text-xs servi-grey-font">Diagnóstico Inicial</span>
                                    <span class="italic servi-grey-font">{{ camelCase(presupuesto.diagnostico) || 'No registrado' }}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="presupuesto.detalle_presupuesto.length > 0" class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-100 servi-blue">
                        <h3 class="text-white font-bold">Servicios Solicitados</h3>
                    </div>
                    <div class="divide-y divide-gray-800">
                        <div v-for="detalle in presupuesto.detalle_presupuesto" :key="detalle.id" class="px-6 py-4 flex justify-between items-center hover:opacity-80 transition-colors">
                            <span class="text-sm servi-grey-font font-medium">{{ camelCase(detalle.descripcion) }}</span>
                            <span class="text-sm font-bold servi-grey-font">{{ formatearNumero(detalle.monto) }} x {{ detalle.cantidad }} = {{ formatearNumero(detalle.monto * detalle.cantidad) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="lg:w-1/3 space-y-6">
                <div v-if="presupuesto.detalle_presupuesto.length > 0" class="servi-blue rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-sm font-bold text-white p-3 flex justify-between items-center">Resumen Financiero</h3>
                    
                    <div class="space-y-3 servi-adapt-bg p-6 rounded-b-xl">
                        <div class="flex justify-between items-center text-sm servi-grey-font">
                            <span>Subtotal</span>
                            <span class="font-medium">{{ formatearNumero(presupuesto.subtotal || 0) }}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm servi-grey-font">
                            <span>Descuento</span>
                            <span class="text-green-600 font-medium">- {{ presupuesto.descuento || '0' }}%</span>
                        </div>
                        <div class="flex justify-between items-center text-sm servi-grey-font">
                            <span>Neto</span>
                            <span class="font-medium">{{ formatearNumero(presupuesto.total_neto || 0) }}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm servi-grey-font">
                            <span>IVA (19%)</span>
                            <span class="font-medium">{{ formatearNumero(presupuesto.iva || 0) }}</span>
                        </div>
                        
                        <div class="pt-4 mt-2 border-t border-gray-100 flex justify-between items-center">
                            <span class="font-bold servi-grey-font text-lg">TOTAL</span>
                            <span class="font-extrabold text-2xl servi-grey-font">{{ formatearNumero(presupuesto.total_final || 0) }}</span>
                        </div>
                    </div>
                </div>

                <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-xs rounded-t-xl font-semibold uppercase servi-blue p-3 flex justify-between items-center text-white tracking-wider mb-4">Acciones</h3>
                    
                    <!-- Selector de cuenta bancaria -->
                    <div v-if="cuentasBancarias.length > 0" class="mb-4 servi-adapt-bg py-2 px-2">
                      <label class="block text-xs font-semibold servi-grey-font uppercase tracking-wider mb-2">Cuenta para PDF</label>
                      <select
                        v-model="cuentaSeleccionada"
                        class="w-full rounded-lg servi-blue text-white border border-gray-100 px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option v-for="cuenta in cuentasBancarias" :key="cuenta.id" :value="cuenta">
                          {{ cuenta.banco }} - {{ cuenta.tipo_cuenta }}
                        </option>
                      </select>
                    </div>

                    <div class="py-2 px-2">
                        <acciones
                            :estado="presupuesto.estado"
                            :editado="presupuesto.editado"
                            @confirmar="manejarConfirmacion"
                            @descartar="manejarDescarte"
                            @pdf="generarPDF"
                            @ir-a-ot="manejarIrAOT"
                            @editar="irAEditarPresupuesto"
                            @confirmar-editar="manejarConfirmacionEdit"
                            @descartar-editar="manejarDescarteEdit"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="fixed left-[-9999px] top-0">   
            <pdf :presupuesto="presupuesto" :cuentaSeleccionada="cuentaSeleccionada" />
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
