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
const route = useRoute()
const presupuesto = ref(null)
const n_presupuesto = ref()
const loading = ref(true)
const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true });
const id = ref(route.params.id)
const router = useRouter();
const redirigir = () => {
    modalState.value.visible = false;
    router.push({ name: "listado-presupuestos" });
}

const manejarConfirmacion = async () => {
    loading.value = true;
    try {
    const { error } = await supabase
        .from('presupuesto')
        .update({ estado: 'Confirmado' })
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
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
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
    presupuesto.value.estado = 'Confirmado'
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
        .update({ estado: 'Descartado' })
        .eq('id', route.params.id)

    if (error) {
        console.error(error)
        return
    }
    presupuesto.value.estado = 'Descartado'
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

onMounted(async () => {
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
    loading.value = false
})

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

</script>
<template>
<div v-if="presupuesto">
    <navbar :titulo="'Presupuesto No. ' + n_presupuesto" subtitulo="" />
    <div class="pb-28 mx-auto p-4 max-w-lg">
        <div class="servi-blue servi-white-font rounded-xl flex flex-col shadow-sm border p-4 mt-3">
        <h2 class="servi-white-font font-bold border-b pb-1 mb-3">Datos del presupuesto</h2>
        <p class="rounded-md py-1">
        Cliente: {{ presupuesto.cliente?.nombre || 'Cliente no registrado' }}
        </p>
        <p class="rounded-md py-1">
        Rut: {{ presupuesto.cliente?.rut || 'Rut no registrado' }}
        </p>
        <p class="rounded-md py-1">
        Contacto: {{ presupuesto.cliente?.telefono || 'Contacto no registrado' }}
        </p>
        <p class="rounded-md py-1">
        Email: {{ presupuesto.cliente?.email || 'Email no registrado' }}
        </p>
        <p class="rounded-md py-1">
        Vehiculo: {{ presupuesto.vehiculo?.patente || 'Vehiculo no registrado' }} - Modelo: {{presupuesto.vehiculo.marca}} {{presupuesto.vehiculo.modelo}} {{presupuesto.vehiculo.anio}}
        </p>
        <p class="rounded-md py-1">
        Diagnostico: {{ presupuesto.diagnostico || 'Diagnostico no registrado' }}
        </p>
        <p class="rounded-md py-1">
        Estado: {{ presupuesto.estado || 'Estado no registrado' }}
        </p>
    </div>
    <div v-if="presupuesto.detalle_presupuesto.length > 0" class="shadow-sm flex-col grid servi-white mt-3 border border-gray-100 rounded-xl p-4">
        <p class="servi-blue-font font-bold border-b pb-1 mb-3">Servicios:</p>
            <div v-for="detalle in presupuesto.detalle_presupuesto" :key="detalle.id" class="flex justify-between servi-yellow servi-blue-font text-sm p-2 mb-2 rounded-lg">
                <span>{{ detalle.descripcion }}</span>
                <span class="font-bold">${{ detalle.valor_total }}</span>
            </div>
    </div>
    <div v-if="presupuesto.detalle_presupuesto.length > 0" class=" bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-3">
      <h3 class="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Desglose Financiero</h3>
      <div class="flex justify-between items-center mb-2 text-sm">
        <span>Subtotal Neto</span>
        <span v-if="presupuesto.total_neto" class="font-medium text-gray-600">${{ presupuesto.total_neto }}</span>
      </div>
      <div class="flex justify-between items-center mb-2 text-sm">
        <p>Descuento (-)</p>
        <span v-if="presupuesto.descuento" class="text-gray-600">${{ presupuesto.descuento }}</span>
        <span v-else class="text-gray-600">${{ presupuesto.descuento || 'No registrado' }}</span>
      </div>
      <div class="flex justify-between items-center mb-2 text-sm">
        <p>Incremento/Extras (+)</p>
        <span v-if="presupuesto.incremento" class="text-gray-600">${{ presupuesto.incremento }}</span>
        <span v-else class="text-gray-600">${{ presupuesto.incremento || 'No registrado' }}</span>
      </div>
      <div class="flex justify-between items-center mb-3 text-sm">
        <p>IVA</p>
        <span v-if="presupuesto.iva" class="text-gray-600">${{ presupuesto.iva }}</span>
        <span v-else class="text-gray-600">${{ presupuesto.iva || 'No registrado' }}</span>
      </div>
      <div class="flex justify-between items-center pt-3 border-t">
        <span class="font-bold text-gray-800">TOTAL</span>
        <span v-if="presupuesto.total_final" class="font-bold text-xl text-blue-900">${{ presupuesto.total_final }}</span>
        <span v-else class="font-bold text-xl text-blue-900">${{ presupuesto.total_final || 'No registrado' }}</span>
      </div>
    </div >
    <div class="flex justify-between mt-3 ">
        <div v-if="presupuesto.estado === 'En espera de Confirmación'" class="flex justify-between items-center align-center gap-2">
        <acciones
        @confirmar="manejarConfirmacion"
        @descartar="manejarDescarte"
        />
    </div>
    <div >
       <button 
         @click="generarPDF"
         class="servi-yellow servi-blue-font font-bold py-2 px-4 rounded-lg flex items-center gap-2 cursor-pointer hover:scale-105 transition duration-150"
       >
         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
         </svg>
         <p class="hidden md:block">Descargar PDF</p>
         <p class="block md:hidden">PDF</p>
       </button>
     </div>
    </div>
    
     <div class="fixed left-[-9999px] top-0">   
        <pdf :presupuesto="presupuesto" />
     </div>

    <modal v-if="modalState.visible" :titulo="modalState.titulo" :mensaje="modalState.mensaje" :exito="modalState.exito" @cerrar="redirigir" />
    </div>
    <cargando2 v-if="loading"/>
</div>
</template>
<style>
</style>
