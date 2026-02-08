<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../lib/supabaseClient.js";
import navbar from "../components/componentes/navbar.vue";
import cargando from "../components/componentes/cargando.vue";
import html2pdf from "html2pdf.js";
import {enviarInformeFinal} from "../js/enviarInformeFinal.js";

const route = useRoute();
const router = useRouter();
const informeData = ref({});
const loading = ref(true);
const OrdenTrabajo = ref({});
const detalle_presupuesto = ref([]);
const enviandoCorreo = ref(false);
const iva = ref(0);

const handleIva = () => {
  iva.value = OrdenTrabajo.value.presupuesto.iva;
}

const formatoPesos = (valor) => {
  if (valor === undefined || valor === null) return '$0';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
};

const formatoFecha = (fecha) => {
  if (!fecha) return new Date().toLocaleDateString('es-CL');
  return new Date(fecha).toLocaleDateString('es-CL');
};

const obtenerDatos = async () => {
  try {
    const { data: informe, error: errorInforme } = await supabase
      .from("informe_final")
      .select("*")
      .eq("ot_id", route.params.id)
      .single();

    if (errorInforme) throw errorInforme;
    informeData.value = informe;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
    // Si la URL viene con ?enviar=true, disparamos el proceso automáticamente
    if (route.query.enviar === 'true') {
        // Un pequeño delay para asegurar que el DOM se renderizó
        setTimeout(() => {
            generarYEnviarPDF();
        }, 1500);
    }
  }
};

const obtenerOT = async () => {
  try {
    const { data, error: errorDetalles } = await supabase
      .from("orden_trabajo")
      .select("*, cliente(*), vehiculo(*), presupuesto(*), OT_bitacora(*)")
      .eq("id", route.params.id)
      .single();
    if (errorDetalles) throw errorDetalles;
    OrdenTrabajo.value = data || [];
    const { data:detalles, error2 } = await supabase
    .from('detalle_presupuesto')
    .select('*')
    .eq('id_presupuesto', OrdenTrabajo.value.presupuesto.id);
    if (error2) throw error2;
    detalle_presupuesto.value = detalles || [];
    iva.value = OrdenTrabajo.value.presupuesto.iva;
  } catch (error) {
    console.error(error);
  }
};

// Configuracion reutilizable para el PDF
const getOpcionesPDF = () => {
    return {
        margin: 0,
        filename: `Informe_ServiML_OT_${route.params.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
};

const descargarPDF = () => {
  const elemento = document.getElementById("elemento-a-imprimir");
  html2pdf().set(getOpcionesPDF()).from(elemento).save();
};

// --- LOGICA DE ENVIO AUTOMATICO ---

const subirPdfASupabase = async (pdfBlob) => {
    // Asegurate que el bucket 'documentos' exista y sea publico o accesible
    const fileName = `informes/OT_${route.params.id}_${Date.now()}.pdf`;
    
    const { data, error } = await supabase.storage
        .from('documentos') 
        .upload(fileName, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
        });

    if (error) throw error;

    const { data: publicData } = supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);

    return publicData.publicUrl;
};

const generarYEnviarPDF = async () => {
    if (enviandoCorreo.value) return;
    enviandoCorreo.value = true;

    try {
        const elemento = document.getElementById("elemento-a-imprimir");
        
        // Generar Blob
        const pdfBlob = await html2pdf()
            .set(getOpcionesPDF())
            .from(elemento)
            .output('blob'); 

        // Subir y Enviar
        const exito = await enviarInformeFinal(informeData.value.id,OrdenTrabajo.value.presupuesto.numero_folio, pdfBlob);
        if (!exito) throw new Error("Error al subir el informe");
        
        alert("Informe subido exitosamente.");
        
        // Limpiamos la query para que no se re-envie al refrescar
        router.replace({ query: null });

    } catch (error) {
        console.error("Error envío:", error);
        alert("El informe se generó pero hubo un error al enviarlo: " + error.message);
    } finally {
        enviandoCorreo.value = false;
    }
};

const datosEstacionamiento = computed(() => {
  if (!OrdenTrabajo.value.fecha_estacionamiento) {
    return { diasCobrar: 0, total: 0 };
  }

  const fechaInicio = new Date(OrdenTrabajo.value.fecha_estacionamiento);
  const fechaActual = new Date();
  
  const diffTime = Math.abs(fechaActual - fechaInicio);
  const diasTotales = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  let diasACobrar = diasTotales - 3;
  
  if (diasACobrar < 0) diasACobrar = 0;
  
  return {
    diasTotales: diasTotales,
    diasCobrar: diasACobrar,
    total: diasACobrar * 5000
  };
});

const totalFinalCalculado = computed(() => {
  const totalBase = informeData.value.total_final || 0;
  return totalBase + datosEstacionamiento.value.total;
});

onMounted( async () => {
  await obtenerDatos();
  await obtenerOT();
});
</script>

<template>
  <navbar
    titulo="ServiML"
    subtitulo="Informe Final de Trabajo"
    class="navbar"
    searchInput="false"
    v-if="!loading"
  />

  <div v-if="loading" class="flex justify-center items-center h-screen">
    <cargando />
  </div>

  <div v-else class="bg-gray-200 min-h-screen py-10 relative">
    
    <div v-if="enviandoCorreo" class="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p class="font-bold text-lg">Generando y enviando informe...</p>
        <p class="text-sm opacity-80">Por favor espera un momento.</p>
    </div>

    <div class="max-w-[21cm] mx-auto mb-6 flex justify-end px-4">
      <button 
        @click="descargarPDF"
        class="bg-[#1f3d64] text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-[#162c4b] transition-colors flex items-center gap-2"
      >
        Descargar Informe PDF
      </button>
    </div>

    <div 
      id="elemento-a-imprimir" 
      class="bg-[#ffffff] text-[#000000] p-10 max-w-[21cm] min-h-[27.9cm] mx-auto text-xs font-sans leading-normal shadow-2xl"
      style="background-color: #ffffff;"
    >
      
      <div class="flex justify-between border-b-4 border-[#1f3d64] pb-4 mb-2">
        
        <div class="flex items-center gap-2">
          <span class="w-24 h-24 rounded-full overflow-hidden border border-[#e5e7eb]">
              <img class="w-full h-full object-cover" src="../img/Logo2.png" alt="Logo">
          </span>
          <div>
              <h1 class="text-2xl font-black text-[#1f3d64] tracking-tighter italic">SERVIML</h1>
              <p class="text-[#4b5563] font-bold uppercase text-[11px] tracking-widest mt-1">Servicios Mecánicos</p>
          </div>
        </div>

        <div class="text-right">
          <h2 class="text-lg font-bold text-[#1f3d64]">INFORME FINAL</h2>
          <p class="text-md font-mono text-[#dc2626] font-bold">
              OT N° {{ route.params.id || '---' }}
          </p>
          <p class="text-[#6b7280] mt-1 text-[11px]">
              Fecha: {{ formatoFecha(informeData.created_at) }}
          </p>
          <div class="mt-2 inline-block bg-[#dcfce7] text-[#166534] px-2 py-1 rounded font-bold text-[10px] uppercase border border-[#bbf7d0]">
            Estado: Completado
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-10 mb-8">
        <div>
          <h3 class="font-bold text-[#1f3d64] border-b border-[#cbd5e1] mb-2 text-[11px] uppercase">De: ServiML</h3>
          <ul class="text-[#374151] space-y-1">
            <li><span class="font-bold text-[#111827]">Dirección:</span> Calle Las Lomas 108, Sitio 28</li>
            <li><span class="font-bold text-[#111827]">Ciudad:</span> La Serena / Coquimbo</li>
            <li><span class="font-bold text-[#111827]">Teléfono:</span> +56 9 5092 8056</li>
            <li><span class="font-bold text-[#111827]">Email:</span> contacto@serviml.cl</li>
          </ul>
        </div>

        <div>
          <h3 class="font-bold text-[#1f3d64] border-b border-[#cbd5e1] mb-2 text-[11px] uppercase">Para: Cliente</h3>
          <ul class="text-[#374151] space-y-1">
            <li>
              <span class="font-bold text-[#111827]">Cliente:</span> 
              {{ informeData.cliente_nombre || 'Sin Nombre' }}
            </li>
            <li>
              <span class="font-bold text-[#111827]">RUT:</span> 
              {{ informeData.cliente_rut || 'Sin RUT' }}
            </li>
            <li>
              <span class="font-bold text-[#111827]">Correo:</span> 
              {{ informeData.cliente_correo || 'Sin Correo' }}
            </li>
            <li>
              <span class="font-bold text-[#111827]">Fono:</span> 
              {{ informeData.cliente_telefono || 'Sin Teléfono' }}
            </li>
            <li>
              <span class="font-bold text-[#111827]">Vehículo:</span> 
              {{ informeData.vehiculo_modelo || 'Vehículo' }}
              <span v-if="informeData.vehiculo_patente" class="ml-2 bg-[#fef08a] px-1 border border-[#fde047] text-[#854d0e] font-bold rounded">
                  {{ informeData.vehiculo_patente }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div class="mb-8 border border-[#e5e7eb] rounded-lg overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#1f3d64] text-[#ffffff] text-[10px] uppercase tracking-wider">
              <th class="p-3 font-semibold">Descripción del Servicio / Repuesto</th>
              <th class="p-3 w-28">Total</th>
            </tr>
          </thead>
          <tbody class="text-[#1f2937] text-[11px]">
            
            <tr 
              v-for="(item, index) in detalle_presupuesto" 
              :key="index"
              class="bg-[#ffffff] shadow-lg border-b border-[#1f3d64]"
            >
              <td class="p-3 font-medium text-[#1f3d64]">{{ item.descripcion }}</td>
              <td class="p-3 text-right font-bold">
                {{ formatoPesos(item.valor_total) }} <!-- Aqui hay un bug y no muestra el valor correcto, anteriormente funcionaba so idk, cuando haga el merge veré q pasa pq no lo alteré, tendrá que ver con las tablas?-->
              </td>
            </tr>

            <tr v-if="datosEstacionamiento.total > 0" class="bg-yellow-50 shadow-lg border-b border-[#1f3d64]">
              <td class="p-3 font-medium text-[#1f3d64]">
                Servicio de Estacionamiento ({{ datosEstacionamiento.diasCobrar }} días facturables tras 3 días de gracia)
              </td>
              <td class="p-3 text-right font-bold text-red-600">
                {{ formatoPesos(datosEstacionamiento.total) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-between items-start gap-8">
        
        <div class="w-3/5 bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]">
          <h4 class="font-bold text-[#1f3d64] uppercase text-[10px] mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#1f3d64]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Observaciones Técnicas
          </h4>
          <div>
            <div v-for="(observacion, idx) in OrdenTrabajo.OT_bitacora" :key="idx" class="text-[#374151] text-[11px] mb-2">
              <p v-if="observacion.observacion">{{ observacion.observacion }}</p>
            </div>
          </div>
        </div>

        <div class="w-2/5">
          <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
            <span class="font-medium">Subtotal Neto</span>
            <span>{{ formatoPesos(informeData.total_neto) }}</span>
          </div>

          <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
            <span class="font-medium">IVA (19%)</span>
            <span>{{ formatoPesos(iva) }}</span>
          </div>

          <div v-if="datosEstacionamiento.total > 0" class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
            <span class="font-medium">Estacionamiento</span>
            <span>{{ formatoPesos(datosEstacionamiento.total) }}</span>
          </div>

          <div class="flex justify-between items-center bg-[#1f3d64] text-[#ffffff] p-3 rounded mt-2">
            <span class="font-bold text-md">TOTAL FINAL</span>
            <span class="font-bold text-md">{{ formatoPesos(totalFinalCalculado) }}</span>
          </div>
        </div>
      </div>

      <div class="mt-16 text-center border-t border-[#e5e7eb] pt-4">
        <p class="text-[#9ca3af] text-[9px] uppercase tracking-wide">
          Documento Generado Electrónicamente - ServiML
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
#elemento-a-imprimir {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}

@media print {
  .navbar, button {
    display: none !important;
  }
  body, .bg-gray-200 {
    background: white !important;
  }
  #elemento-a-imprimir {
    box-shadow: none !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
}
</style>