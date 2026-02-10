<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../lib/supabaseClient.js";
import navbar from "../components/componentes/navbar.vue";
import cargando from "../components/componentes/cargando.vue";
import html2pdf from "html2pdf.js";
import { enviarInformeFinal } from "../js/enviarInformeFinal.js";

const route = useRoute();
const router = useRouter();
const informeData = ref({});
const loading = ref(true);
const OrdenTrabajo = ref({});
const detalle_presupuesto = ref([]);
const enviandoCorreo = ref(false);
const iva = ref(0);

const bitacoraFiltrada = computed(() => {
  if (!OrdenTrabajo.value || !OrdenTrabajo.value.OT_bitacora) {
    return [];
  }
  return OrdenTrabajo.value.OT_bitacora.filter(item => item.observacion);
});

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
    if (route.query.enviar === 'true') {
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
      .select("*, cliente(*), vehiculo(*), presupuesto(*), OT_bitacora(*), OT_fotos_ingreso(*)")
      .eq("id", route.params.id)
      .single();
    if (errorDetalles) throw errorDetalles;
    OrdenTrabajo.value = data || {};
    
    if (OrdenTrabajo.value.presupuesto) {
        const { data: detalles, error2 } = await supabase
        .from('detalle_presupuesto')
        .select('*')
        .eq('id_presupuesto', OrdenTrabajo.value.presupuesto.id);
        
        if (error2) throw error2;
        detalle_presupuesto.value = detalles || [];
        iva.value = OrdenTrabajo.value.presupuesto.iva || 0;
    }
  } catch (error) {
    console.error(error);
  }
};

const traerFotosBitacora = async () => {
  if (!OrdenTrabajo.value.OT_bitacora) return;
  for (const item of OrdenTrabajo.value.OT_bitacora) {
    const { data } = await supabase
      .from('OT_Fotos')
      .select('*')
      .eq('id_OT_bitacora', item.id);
    item.fotos = data || [];
  }
};

const getOpcionesPDF = () => {
  return {
    margin: 0,
    filename: `Informe_ServiML_OT_${route.params.id}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        ignoreElements: (element) => element.classList.contains('no-print') 
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
};

const descargarPDF = () => {
  const elemento = document.getElementById("elemento-a-imprimir");
  html2pdf().set(getOpcionesPDF()).from(elemento).save();
};

const generarYEnviarPDF = async () => {
  if (enviandoCorreo.value) return;
  enviandoCorreo.value = true;
  try {
    const elemento = document.getElementById("elemento-a-imprimir");

    const pdfBlob = await html2pdf()
      .set(getOpcionesPDF())
      .from(elemento)
      .output('blob');

    const exito = await enviarInformeFinal(informeData.value.id, OrdenTrabajo.value.presupuesto.numero_folio, pdfBlob);
    if (!exito) throw new Error("Error al subir el informe");

    alert("Informe subido exitosamente.");

    router.replace({ query: null });

  } catch (error) {
    console.error("Error envío:", error);
    alert("El informe se generó pero hubo un error al enviarlo: " + error.message);
  } finally {
    enviandoCorreo.value = false;
  }
};

const camelCase = (str) => {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

onMounted(async () => {
  await obtenerDatos();
  await obtenerOT();
  await traerFotosBitacora();
});
</script>

<template>
  <navbar titulo="ServiML" subtitulo="Informe Final de Trabajo" class="navbar" searchInput="false" v-if="!loading" />

  <div v-if="loading" class="flex justify-center items-center h-screen">
    <cargando />
  </div>

  <div v-else class="bg-gray-200 min-h-screen py-10 relative">

    <div v-if="enviandoCorreo"
      class="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
      <p class="font-bold text-lg">Generando y enviando informe...</p>
      <p class="text-sm opacity-80">Por favor espera un momento.</p>
    </div>

    <div class="max-w-[21cm] mx-auto mb-6 flex justify-end px-4">
      <button @click="descargarPDF"
        class="bg-[#1f3d64] text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-[#162c4b] transition-colors flex items-center gap-2">
        Descargar Informe PDF
      </button>
    </div>

    <div id="elemento-a-imprimir"
      class="bg-[#ffffff] text-[#000000] p-10 max-w-[21cm] min-h-[27.9cm] mx-auto text-xs font-sans leading-normal shadow-2xl"
      style="background-color: #ffffff;">

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
          <div
            class="mt-2 inline-block bg-[#dcfce7] text-[#166534] px-2 py-1 rounded font-bold text-[10px] uppercase border border-[#bbf7d0]">
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
              {{ camelCase(informeData.cliente_nombre) || 'Sin Nombre' }} {{ camelCase(informeData.cliente_apellido) ||
              '' }}
            </li>
            <li>
              <span class="font-bold text-[#111827]">Correo:</span>
              {{ informeData.cliente_correo || 'Sin Correo' }}
            </li>
            <li>
              <span class="font-bold text-[#111827]">Fono:</span>
              +{{ informeData.cliente_codigo_pais }} {{ informeData.cliente_telefono || 'Sin Teléfono' }}
            </li>
            <li>
              <span class="font-bold text-[#111827]">Vehículo:</span>
              {{ informeData.vehiculo_marca }} {{ informeData.vehiculo_modelo }} {{ informeData.vehiculo_anio }}
              <span v-if="informeData.vehiculo_patente"
                class="ml-2 bg-[#fef08a] px-1 border border-[#fde047] text-[#854d0e] font-bold rounded">
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

            <tr v-for="(item, index) in detalle_presupuesto" :key="index"
              class="bg-[#ffffff] shadow-lg border-b border-[#1f3d64]">
              <td class="p-3 font-medium text-[#1f3d64]">{{ item.descripcion }}</td>
              <td class="p-3 text-right font-bold">
                {{ formatoPesos(item.monto) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-between items-center gap-8">
        <div class="w-full max-w-3xl bg-[#f8fafc] rounded-lg border border-[#e2e8f0] shadow-sm">
          <h4
            class="font-bold rounded-t-lg bg-[#1f3d64] text-[#ffffff] px-2 py-2 uppercase text-xs flex items-center gap-2 border-b border-[#e2e8f0]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Información general
          </h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-3">
            <div class="space-y-3">
              <div>
                <span class="text-xs text-slate-500 uppercase font-semibold block">Motivo Ingreso</span>
                <p class="text-sm text-[#1f3d64] font-medium">{{ OrdenTrabajo.motivo_ingreso }}</p>
              </div>
              <div>
                <span class="text-xs text-slate-500 uppercase font-semibold block">Diagnóstico del Técnico</span>
                <p class="text-sm text-[#1f3d64]">{{ OrdenTrabajo.diagnostico }}</p>
              </div>
              <div>
                <span class="text-xs text-slate-500 uppercase font-semibold block">Tipo de Trabajo</span>
                <p class="text-sm text-[#1f3d64]">{{ OrdenTrabajo.tipo_trabajo || 'Sin Tipo de Trabajo' }}</p>
              </div>
            </div>

            <div class="space-y-3">
              <div class="grid grid-cols-1 gap-4">
                <div>
                  <span class="text-xs text-slate-500 uppercase font-semibold block">Fecha Ingreso</span>
                  <p class="text-sm text-[#1f3d64]">{{ OrdenTrabajo.fecha_ingreso }}</p>
                </div>
                <div>
                  <span class="text-xs text-slate-500 uppercase font-semibold block">Encargado</span>
                  <p class="text-sm text-[#1f3d64]">{{ OrdenTrabajo.id_empleado }}</p>
                </div>
              </div>

              <div>
                <span class="text-xs text-slate-500 uppercase font-semibold block">Origen</span>
                <p class="text-sm text-[#1f3d64]">{{ OrdenTrabajo.origen_ingreso || 'Sin Origen' }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white p-2 rounded border border-[#e2e8f0]">
            <div class="flex justify-between items-center border-b border-slate-50 pb-1">
              <div class="flex w-full">
                <span class="text-xs text-slate-500 uppercase font-semibold block mb-3">Inventario</span>
              </div>
              <div class="flex w-full pl-2">
                <span class="text-xs text-slate-500 uppercase font-semibold block mb-3">Datos iniciales</span>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-[#1f3d64]">
              <div>
              <div class="flex justify-between items-center border-b border-slate-50 pb-1">
                <span>Documentos</span>
                <span class="font-semibold">{{ OrdenTrabajo.trae_documentos ? 'Si' : 'No' }}</span>
              </div>
              <div class="flex justify-between items-center border-b border-slate-50 pb-1">
                <span>Llaves</span>
                <span class="font-semibold">{{ OrdenTrabajo.trae_llaves ? 'Si' : 'No' }}</span>
              </div>
              <div class="flex justify-between items-center border-b border-slate-50 pb-1">
                <span>Candado Seg.</span>
                <span class="font-semibold">{{ OrdenTrabajo.trae_candado_seguridad ? 'Si' : 'No' }}</span>
              </div>
              <div class="flex justify-between items-center border-b border-slate-50 pb-1">
                <span>Panel Radio</span>
                <span class="font-semibold">{{ OrdenTrabajo.trae_panel_radio ? 'Si' : 'No' }}</span>
              </div>
              <div class="flex justify-between items-center border-b border-slate-50 pb-1">
                <span>Rueda Rep.</span>
                <span class="font-semibold">{{ OrdenTrabajo.trae_rueda_repuesto ? 'Si' : 'No' }}</span>
              </div>
              <div class="flex justify-between items-center border-b border-slate-50 pb-1">
                <span>Encendedor</span>
                <span class="font-semibold">{{ OrdenTrabajo.trae_encendedor ? 'Si' : 'No' }}</span>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-4 bg-white p-3 rounded border border-slate-100">
                <div>
                  <span class="text-xs text-slate-400 uppercase font-semibold block">Kilometraje</span>
                  <p class="text-sm font-bold text-slate-700">{{ OrdenTrabajo.kilometraje_inicial ?
                    OrdenTrabajo.kilometraje_inicial + ' km' : 'Sin Kilometraje' }}</p>
                </div>
                <div>
                  <span class="text-xs text-slate-400 uppercase font-semibold block">Combustible</span>
                  <p class="text-sm font-bold text-slate-700">{{ OrdenTrabajo.combustible_inicial ?
                    OrdenTrabajo.combustible_inicial + ' %' : 'Sin Combustible' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="w-2/5">
          <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
            <span class="font-medium">Subtotal</span>
            <span>{{ formatoPesos(informeData.sub_total) }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
            <span class="font-medium">Descuento</span>
            <span>{{ informeData.descuento_porcentaje }}%</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
            <span class="font-medium">Total Neto</span>
            <span>{{ formatoPesos(informeData.total_neto) }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
            <span class="font-medium">IVA (19%)</span>
            <span>{{ formatoPesos(informeData.iva) }}</span>
          </div>

          <div class="flex justify-between items-center bg-[#1f3d64] text-[#ffffff] p-3 rounded mt-2">
            <span class="font-bold text-md">TOTAL FINAL</span>
            <span class="font-bold text-md">{{ formatoPesos(informeData.total_final) }}</span>
          </div>
        </div>
      </div>
      <div class="mb-8 border border-[#e5e7eb] rounded-lg overflow-hidden mt-5">
        <div class="w-full text-left border-collapse">
          <div class="bg-[#1f3d64] text-[#ffffff] text-[10px] uppercase tracking-wider">
            <div class="p-3 font-semibold">Fotos de recepción</div>
          </div>
          <div class="text-[#1f2937] text-[11px] flex flex-wrap items-center">

            <div v-for="(item, index) in OrdenTrabajo.OT_fotos_ingreso" :key="index" class="bg-[#ffffff] shadow-lg m-2">
              <div class="p-3 font-medium text-[#1f3d64]">
                <img :src="item.url" alt="Imagen de recepción" class="w-30 h-30 object-cover">
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mb-8 border border-[#e5e7eb] rounded-lg overflow-hidden mt-5">
  <div class="w-full text-left border-collapse">
    <div class="bg-[#1f3d64] text-[#ffffff] text-[10px] uppercase tracking-wider">
      <div class="p-3 font-semibold">Hallazgos y observaciones</div>
    </div>
    <div class="text-[#1f2937] text-[11px] flex flex-wrap">

      <div v-for="(item, index) in bitacoraFiltrada" :key="index"
        class="bg-[#ffffff] shadow-lg border-b border-[#1f3d64] m-2 w-full">
        <div class="p-3 font-medium text-[#1f3d64]">
          <p>{{ item.observacion }}</p>
          <div v-if="item.fotos && item.fotos.length > 0" class="flex flex-wrap gap-2 mt-2">
            <img v-for="(foto, fIdx) in item.fotos" :key="fIdx" :src="foto.url" alt="Foto hallazgo"
              class="w-24 h-24 object-cover rounded border border-[#e5e7eb]" />
          </div>
          <span>{{ 'Fecha: ' + formatoFecha(item.created_at) }}</span>
        </div>
      </div>
      
    </div>
  </div>
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

  .navbar,
  button {
    display: none !important;
  }

  body,
  .bg-gray-200 {
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