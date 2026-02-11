<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../lib/supabaseClient.js";
import navbar from "../components/componentes/navbar.vue";
import html2pdf from "html2pdf.js";
import { enviarInformeFinal } from "../js/enviarInformeFinal.js";
import { useInterfaz } from "@/stores/interfaz.js";
const route = useRoute();
const router = useRouter();
const informeData = ref({});
const loading = ref(true);
const OrdenTrabajo = ref({});
const detalle_presupuesto = ref([]);
const enviandoCorreo = ref(false);
const iva = ref(0);
const interfaz = useInterfaz();

// --- NUEVO: Función para convertir URL a Base64 y evitar CORS ---
const convertirImagenABase64 = async (url) => {
  try {
    // Añadimos un timestamp para evitar caché del navegador
    const response = await fetch(url + '?t=' + new Date().getTime());
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("No se pudo convertir imagen (CORS bloqueó el fetch):", url);
    return url; // Retornamos la original si falla, aunque el PDF podría fallar igual
  }
};

const procesarImagenesParaPDF = async () => {
  // 1. Procesar fotos de ingreso
  if (OrdenTrabajo.value.OT_fotos_ingreso) {
    for (const item of OrdenTrabajo.value.OT_fotos_ingreso) {
      if (item.url) item.url = await convertirImagenABase64(item.url);
    }
  }
  // 2. Procesar fotos de bitácora
  if (OrdenTrabajo.value.OT_bitacora) {
    for (const item of OrdenTrabajo.value.OT_bitacora) {
      if (item.fotos) {
        for (const foto of item.fotos) {
          if (foto.url) foto.url = await convertirImagenABase64(foto.url);
        }
      }
    }
  }
};
// ---------------------------------------------------------------

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
    // Movemos el loading a false DESPUES de procesar todo en onMounted
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
    OrdenTrabajo.value = data || [];

    console.log("=== DATOS RECIBIDOS DE SUPABASE ===");
    console.log("Inicio:", OrdenTrabajo.value.fecha_estacionamiento);
    console.log("Término:", OrdenTrabajo.value.fecha_termino_estacionamiento);
    console.log("Objeto completo:", OrdenTrabajo.value);

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

    margin: [10,10,10,10],

    filename: `Informe_ServiML_OT_${route.params.id}.pdf`,

    image: { type: 'jpeg', quality: 0.98 },

    html2canvas: {

      scale: 2,

      useCORS: true,

      logging: false,

      ignoreElements: (element) => element.classList.contains('no-print'),

      onclone: (clonedDoc) => {

        // Remove stylesheets that contain oklch (Tailwind v4 base)

        const sheets = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');

        sheets.forEach(sheet => {

          try {

            const text = sheet.textContent || '';

            if (text.includes('oklch')) {

              // Replace oklch values in style tags

              sheet.textContent = text.replace(/oklch\([^)]*\)/g, 'transparent');

            }

          } catch (e) { /* ignore cross-origin sheets */ }

        });

        // Override any remaining computed oklch on elements

        const allElements = clonedDoc.querySelectorAll('*');

        const propsToCheck = ['color', 'background-color', 'border-color', 'outline-color', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color', 'text-decoration-color'];

        allElements.forEach(el => {

          const computed = clonedDoc.defaultView.getComputedStyle(el);

          propsToCheck.forEach(prop => {

            try {

              const val = computed.getPropertyValue(prop);

              if (val && val.includes('oklch')) {

                el.style.setProperty(prop, prop === 'color' ? '#000000' : 'transparent');

              }

            } catch (e) { /* skip */ }

          });

        });

      }

    },

    pagebreak: { mode: ['avoid-all', 'css', 'legacy'], before: '.page-break', avoid: '.avoid-break' },

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
    alert("Hubo un error al generar/enviar el informe. Revisa la consola.");
  } finally {
    enviandoCorreo.value = false;
  }
};

const datosEstacionamiento = computed(() => {
  if (!OrdenTrabajo.value.fecha_estacionamiento) {
    return { diasTotales: 0, diasCobrar: 0, total: 0 };
  }

  const fechaInicio = new Date(OrdenTrabajo.value.fecha_estacionamiento);
  const fechaFin = OrdenTrabajo.value.fecha_termino_estacionamiento
    ? new Date(OrdenTrabajo.value.fecha_termino_estacionamiento)
    : new Date();

  const diasTotales = Math.ceil(
    (fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)
  );

  let diasACobrar = diasTotales - 3;
  if (diasACobrar < 0) diasACobrar = 0;

  console.log("Cálculo Estacionamiento:", {
    fechaInicio,
    fechaFin,
    diasTotales,
    diasACobrar,
    total: diasACobrar * 5000
  });

  return {
    diasTotales,
    diasCobrar: diasACobrar,
    total: diasACobrar * 5000
  };
});

const totalFinalCalculado = computed(() => {
  const totalBase = informeData.value.total_final || 0;
  return totalBase + datosEstacionamiento.value.total;
});

onMounted( async () => {
  interfaz.showLoadingOverlay();
  await obtenerDatos();
  await obtenerOT();
  await traerFotosBitacora();
  console.log("Procesando imágenes para evitar CORS...");
  await procesarImagenesParaPDF();
  interfaz.hideLoadingOverlay();

  if (route.query.enviar === 'true') {
    setTimeout(() => {
      generarYEnviarPDF();
    }, 1500);
  }
});
</script>
<template>
  <navbar titulo="ServiML" subtitulo="Informe Final de Trabajo" class="navbar" searchInput="false"/>

  <div class="bg-gray-200 min-h-screen py-10 relative pb-20">

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
      class="bg-white text-black p-0 max-w-[21cm] mx-auto text-xs font-sans leading-normal shadow-2xl">
      
      <div class="p-10 pb-4 h-[27cm] relative"> <div class="flex justify-between border-b-4 border-[#1f3d64] pb-4 mb-2">
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

        <div class="grid grid-cols-2 gap-10 mb-6">
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
                {{ camelCase(informeData.cliente_nombre) || 'Sin Nombre' }} {{ camelCase(informeData.cliente_apellido) || '' }}
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

        <div class="mb-6 border border-[#e5e7eb] rounded-lg overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#1f3d64] text-[#ffffff] text-[10px] uppercase tracking-wider">
                <th class="p-3 font-semibold">Descripción del Servicio / Repuesto</th>
                <th class="p-3 w-28 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="text-[#1f2937] text-[11px]">
              <tr v-for="(item, index) in detalle_presupuesto" :key="index"
                class="bg-[#ffffff] border-b border-gray-100 last:border-0">
                <td class="p-3 font-medium text-[#1f3d64]">{{ item.descripcion }}</td>
                <td class="p-3 text-right font-bold">
                  {{ formatoPesos(item.monto) }}
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
          <div class="w-full max-w-3xl bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
            <h4
              class="font-bold rounded-t-lg bg-[#1f3d64] text-[#ffffff] px-3 py-2 uppercase text-xs flex items-center gap-2">
              Información general
            </h4>
            <div class="grid grid-cols-2 gap-x-6 gap-y-4 p-4">
              <div>
                <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Motivo Ingreso</span>
                <p class="text-xs text-[#1f3d64] font-semibold leading-relaxed">{{ OrdenTrabajo.motivo_ingreso }}</p>
              </div>
              <div>
                <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Diagnóstico</span>
                <p class="text-xs text-[#1f3d64] leading-relaxed">{{ OrdenTrabajo.diagnostico }}</p>
              </div>
              <div class="border-t border-slate-200 pt-2">
                <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Ingreso</span>
                <p class="text-xs text-[#1f3d64]">{{ OrdenTrabajo.fecha_ingreso }}</p>
              </div>
              <div class="border-t border-slate-200 pt-2">
                <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Tipo Trabajo</span>
                <p class="text-xs text-[#1f3d64]">{{ OrdenTrabajo.tipo_trabajo || 'General' }}</p>
              </div>
            </div>
          </div>

          <div class="w-2/5 pt-1">
            <div class="flex justify-between items-center py-1 border-b border-[#e5e7eb] text-[#374151]">
              <span class="font-medium text-xs">Subtotal</span>
              <span class="text-xs">{{ formatoPesos(informeData.sub_total) }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-[#e5e7eb] text-[#374151]">
              <span class="font-medium text-xs">Descuento</span>
              <span class="text-xs">{{ informeData.descuento_porcentaje }}%</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-[#e5e7eb] text-[#374151]">
              <span class="font-medium text-xs">Total Neto</span>
              <span class="text-xs">{{ formatoPesos(informeData.total_neto) }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-[#e5e7eb] text-[#374151]">
              <span class="font-medium text-xs">IVA (19%)</span>
              <span class="text-xs">{{ formatoPesos(informeData.iva) }}</span>
            </div>

            <div class="flex justify-between items-center bg-[#1f3d64] text-[#ffffff] p-2 rounded mt-3 shadow-sm">
              <span class="font-bold text-sm">TOTAL</span>
              <span class="font-bold text-lg">{{ formatoPesos(informeData.total_final) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="html2pdf__page-break"></div>

      <div class="p-10 pt-8 min-h-[26cm] bg-white relative">
        <div class="absolute top-0 left-0 w-full h-2 bg-[#1f3d64]"></div>
        
        <div class="flex justify-between items-end border-b border-gray-200 pb-2 mb-4">
          <div>
             <h2 class="text-xl font-bold text-[#1f3d64] uppercase tracking-tight">Informe Técnico Detallado</h2>
             <p class="text-xs text-gray-500">Anexo de inspección visual y bitácora de trabajo</p>
          </div>
          <div class="text-right">
             <p class="text-[10px] text-gray-400 font-mono">OT-{{ route.params.id }} / PÁGINA 2</p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4 mb-6"> <div class="col-span-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
             <h4 class="font-bold text-[#1f3d64] uppercase text-[10px] mb-2 border-b border-slate-200 pb-1">Inventario & Accesorios</h4>
             <ul class="space-y-1 text-[11px]"> <li class="flex justify-between items-center">
                  <span class="text-slate-600">Documentos</span>
                  <span :class="OrdenTrabajo.trae_documentos ? 'text-green-600 font-bold' : 'text-gray-400'">{{ OrdenTrabajo.trae_documentos ? '✔ Sí' : 'No' }}</span>
                </li>
                <li class="flex justify-between items-center">
                  <span class="text-slate-600">Llaves</span>
                  <span :class="OrdenTrabajo.trae_llaves ? 'text-green-600 font-bold' : 'text-gray-400'">{{ OrdenTrabajo.trae_llaves ? '✔ Sí' : 'No' }}</span>
                </li>
                <li class="flex justify-between items-center">
                  <span class="text-slate-600">Candado Seg.</span>
                  <span :class="OrdenTrabajo.trae_candado_seguridad ? 'text-green-600 font-bold' : 'text-gray-400'">{{ OrdenTrabajo.trae_candado_seguridad ? '✔ Sí' : 'No' }}</span>
                </li>
                <li class="flex justify-between items-center">
                  <span class="text-slate-600">Panel Radio</span>
                  <span :class="OrdenTrabajo.trae_panel_radio ? 'text-green-600 font-bold' : 'text-gray-400'">{{ OrdenTrabajo.trae_panel_radio ? '✔ Sí' : 'No' }}</span>
                </li>
                <li class="flex justify-between items-center">
                  <span class="text-slate-600">Rueda Rep.</span>
                  <span :class="OrdenTrabajo.trae_rueda_repuesto ? 'text-green-600 font-bold' : 'text-gray-400'">{{ OrdenTrabajo.trae_rueda_repuesto ? '✔ Sí' : 'No' }}</span>
                </li>
                <li class="flex justify-between items-center">
                  <span class="text-slate-600">Encendedor</span>
                  <span :class="OrdenTrabajo.trae_encendedor ? 'text-green-600 font-bold' : 'text-gray-400'">{{ OrdenTrabajo.trae_encendedor ? '✔ Sí' : 'No' }}</span>
                </li>
             </ul>
          </div>
          
          <div class="col-span-8">
            <div class="grid grid-cols-2 gap-4 mb-3">
               <div class="bg-white border border-slate-200 p-2 rounded shadow-sm text-center">
                  <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kilometraje</span>
                  <span class="block text-lg font-black text-[#1f3d64] mt-0.5">{{ OrdenTrabajo.kilometraje_inicial || '0' }} km</span>
               </div>
               <div class="bg-white border border-slate-200 p-2 rounded shadow-sm text-center">
                  <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Combustible</span>
                  <div class="w-full bg-gray-200 rounded-full h-2 mt-1.5 mb-1">
                    <div class="bg-[#1f3d64] h-2 rounded-full" :style="{ width: (OrdenTrabajo.combustible_inicial || 0) + '%' }"></div>
                  </div>
                  <span class="block text-[11px] font-bold text-[#1f3d64]">{{ OrdenTrabajo.combustible_inicial || '0' }}%</span>
               </div>
            </div>

            <div v-if="OrdenTrabajo.OT_fotos_ingreso && OrdenTrabajo.OT_fotos_ingreso.length > 0">
               <h4 class="font-bold text-[#1f3d64] uppercase text-[10px] mb-1">Registro Fotográfico de Ingreso</h4>
               <div class="flex gap-2 overflow-hidden h-24 bg-slate-100 p-1 rounded border border-slate-200">
                  <div v-for="(item, index) in OrdenTrabajo.OT_fotos_ingreso.slice(0, 3)" :key="index" class="relative w-1/3 h-full">
                     <img :src="item.url" crossorigin="anonymous" class="absolute inset-0 w-full h-full object-cover rounded-sm border border-slate-300">
                  </div>
               </div>
            </div>
            <div v-else class="h-24 bg-slate-50 rounded border border-dashed border-slate-300 flex items-center justify-center">
               <span class="text-xs text-slate-400">Sin registro fotográfico de ingreso</span>
            </div>
          </div>
        </div>

          <div v-if="datosEstacionamiento.total > 0" class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
            <span class="font-medium">Estacionamiento</span>
            <span>{{ formatoPesos(datosEstacionamiento.total) }}</span>
          </div>

          <div class="flex justify-between items-center bg-[#1f3d64] text-[#ffffff] p-3 rounded mt-2">
            <span class="font-bold text-md">TOTAL FINAL</span>
            <span class="font-bold text-md">{{ formatoPesos(totalFinalCalculado) }}</span>
          </div>
        <div class="mt-4">
           <h3 class="flex items-center gap-3 text-sm font-bold text-[#1f3d64] uppercase border-b-2 border-[#1f3d64] pb-1 mb-3">
              <span class="bg-[#1f3d64] text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">✔</span>
              Bitácora de Trabajo
           </h3>

           <div v-if="bitacoraFiltrada.length > 0" class="space-y-3">
              <div v-for="(item, index) in bitacoraFiltrada" :key="index" class="flex gap-3">
                 <div class="flex flex-col items-center">
                    <div class="w-1.5 h-1.5 rounded-full bg-[#1f3d64] mt-2"></div>
                    <div class="w-px h-full bg-slate-200 my-1" v-if="index !== bitacoraFiltrada.length - 1"></div>
                 </div>
                 <div class="flex-1 bg-white border border-l-4 border-l-[#1f3d64] border-gray-100 p-2 rounded shadow-sm">
                    <div class="flex justify-between items-start mb-1">
                       <p class="text-[11px] font-bold text-gray-800 uppercase">Observación</p>
                       <span class="text-[9px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{{ formatoFecha(item.created_at) }}</span>
                    </div>
                    <p class="text-[11px] text-gray-600 leading-snug mb-2">{{ item.observacion }}</p>
                    
                    <div v-if="item.fotos && item.fotos.length > 0" class="flex gap-2 mt-1 pt-2 border-t border-dashed border-gray-100">
                       <img v-for="(foto, fIdx) in item.fotos" :key="fIdx" :src="foto.url" class="w-16 h-16 object-cover rounded border border-gray-200">
                    </div>
                 </div>
              </div>
           </div>
           
           <div v-else class="text-center py-6 bg-slate-50 rounded border border-slate-100">
              <p class="text-xs text-slate-400">No se registraron observaciones adicionales.</p>
           </div>
        </div>

        <div class="absolute bottom-6 left-0 w-full px-10">
           <div class="flex justify-between items-end pt-4 border-t border-gray-300">
              <div class="text-center w-40">
                 <div class="h-8 mb-1"></div> 
                 <p class="text-[10px] border-t border-gray-400 pt-1 font-bold text-[#1f3d64]">Firma Responsable Taller</p>
              </div>
              <div class="text-center w-40">
                 <div class="h-8 mb-1"></div> 
                 <p class="text-[10px] border-t border-gray-400 pt-1 font-bold text-[#1f3d64]">Firma Cliente</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  </div>
</template>
<style scoped>
.html2pdf__page-break {
  page-break-before: always;
  break-before: always;
  height: 0;
  display: block;
}

#elemento-a-imprimir {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
</style>