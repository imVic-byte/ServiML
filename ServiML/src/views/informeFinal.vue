<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "../lib/supabaseClient.js";
import navbar from "../components/componentes/navbar.vue";
import cargando from "../components/componentes/cargando.vue";
import html2pdf from "html2pdf.js";

const route = useRoute();
const informeFinal = ref(null);
const loading = ref(true);

const obtenerInformeFinal = async () => {
  const { data } = await supabase
    .from("informe_final")
    .select("*")
    .eq("ot_id", route.params.id)
  if (data) {
    informeFinal.value = data[0];
    console.log(informeFinal.value);
  }
  loading.value = false;
};

const traerDetalles = async () => {
    const {data} = await supabase
}

const formatoPesos = (valor) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor || 0);
};


const descargarPDF = () => {
  const elemento = document.getElementById("elemento-a-imprimir");
  const opciones = {
    margin: 0,
    filename: `Informe_ServiML_OT_${route.params.id}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opciones).from(elemento).save();
};

onMounted(() => {
  obtenerInformeFinal();
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

  <div v-else-if="informeFinal" class="bg-gray-200 min-h-screen py-10">
    
    <div class="max-w-[21cm] mx-auto mb-6 flex justify-end px-4">
      <button 
        @click="descargarPDF"
        class="bg-[#1f3d64] text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-blue-800 transition-colors flex items-center gap-2"
      >
        Descargar Informe PDF
      </button>
    </div>

    <div 
      id="elemento-a-imprimir" 
      class="bg-white text-black p-10 max-w-[21cm] min-h-[27.9cm] mx-auto text-xs font-sans leading-normal shadow-2xl"
    >
      <div class="flex justify-between border-b-4 border-[#1f3d64] pb-4 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-20 h-20 rounded-full overflow-hidden border border-gray-200">
            <img class="w-full h-full object-cover" src="../img/Logo2.png" alt="Logo">
          </div>
          <div>
            <h1 class="text-3xl font-black text-[#1f3d64] tracking-tighter italic">SERVIML</h1>
            <p class="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">Servicios Mecánicos Especializados</p>
          </div>
        </div>

        <div class="text-right">
          <h2 class="text-xl font-bold text-[#1f3d64] uppercase tracking-wider">Informe Final</h2>
          <p class="text-lg font-mono text-red-600 font-bold">
            Orden de Trabajo N° {{ route.params.id }}
          </p>
          <p class="text-gray-500 mt-1">
            Fecha Emisión: {{ informeFinal.fecha }}
          </p>
          <div class="mt-2 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold text-[10px] uppercase border border-green-200">
            Estado: Vehículo Entregado
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-10 mb-10">
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 class="font-bold text-[#1f3d64] border-b border-gray-300 mb-3 pb-1 text-[11px] uppercase tracking-tight">Datos del Taller</h3>
          <ul class="space-y-1.5 text-gray-700">
            <li><span class="font-bold text-gray-900">Dirección:</span> Calle Las Lomas 108, Sitio 28</li>
            <li><span class="font-bold text-gray-900">Ciudad:</span> La Serena / Coquimbo</li>
            <li><span class="font-bold text-gray-900">Contacto:</span> +56 9 5092 8056</li>
            <li><span class="font-bold text-gray-900">Email:</span> contacto@serviml.cl</li>
          </ul>
        </div>

        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 class="font-bold text-[#1f3d64] border-b border-gray-300 mb-3 pb-1 text-[11px] uppercase tracking-tight">Información del Cliente y Vehículo</h3>
          <ul class="space-y-1.5 text-gray-700">
            <li><span class="font-bold text-gray-900">Cliente:</span> {{ informeFinal.cliente_nombre }}</li>
            <li><span class="font-bold text-gray-900">Teléfono:</span> {{ informeFinal.cliente_telefono }}</li>
            <li><span class="font-bold text-gray-900">Email:</span> {{ informeFinal.cliente_correo }}</li>
            <li><span class="font-bold text-gray-900">Vehículo:</span> {{ informeFinal.vehiculo_modelo }}</li>
            <li>
              <span class="font-bold text-gray-900">Patente:</span> 
              <span class="ml-2 bg-yellow-400 px-2 py-0.5 border border-yellow-600 text-yellow-900 font-bold rounded text-[10px]">
                {{ informeFinal.vehiculo_patente }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div class="mb-10">
        <h3 class="font-bold text-[#1f3d64] mb-4 text-sm uppercase flex items-center gap-2">
          <div class="w-2 h-4 bg-[#1f3d64] rounded-full"></div>
          Resumen de Servicios Realizados
        </h3>
        <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#1f3d64] text-white text-[10px] uppercase tracking-widest">
                <th class="p-4 font-semibold">Descripción Técnica del Servicio</th>
                <th class="p-4 text-right w-40">Monto Subtotal</th>
              </tr>
            </thead>
            <tbody class="text-gray-800">
              <tr class="border-b border-gray-100">
                <td class="p-4">
                  <p class="font-bold text-gray-900 mb-1">Servicio de Mantención / Reparación General</p>
                  <p class="text-gray-500 leading-relaxed italic">
                    Se han completado todas las tareas descritas en la orden de trabajo según las especificaciones técnicas del vehículo {{ informeFinal.vehiculo_modelo }}.
                  </p>
                </td>
                <td class="p-4 text-right font-bold text-lg text-[#1f3d64]">
                  {{ formatoPesos(informeFinal.total_neto) }}
                </td>
              </tr>
              <tr class="h-32">
                <td colspan="2" class="p-4 text-gray-400 align-top text-[10px]">
                  * Este documento certifica que el vehículo ha sido probado y entregado conforme a los estándares de ServiML.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex justify-end gap-8">
        <div class="w-1/3">
          <div class="flex justify-between items-center py-2 border-b border-gray-100 text-gray-600">
            <span class="font-medium">Subtotal Neto</span>
            <span>{{ formatoPesos(informeFinal.total_neto) }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100 text-gray-600">
            <span class="font-medium">Impuestos (IVA 19%)</span>
            <span>{{ formatoPesos(informeFinal.total_final - informeFinal.total_neto) }}</span>
          </div>
          <div class="flex justify-between items-center bg-[#1f3d64] text-white p-4 rounded-xl mt-4 shadow-lg">
            <span class="font-bold text-lg">TOTAL PAGADO</span>
            <span class="font-bold text-lg">{{ formatoPesos(informeFinal.total_final) }}</span>
          </div>
        </div>
      </div>

      <div class="mt-20">
        <div class="grid grid-cols-2 gap-20 text-center">
          <div class="border-t border-gray-300 pt-4">
            <div class="h-16 mb-2"></div>
            <p class="font-bold text-gray-900 uppercase">Firma Técnico</p>
            <p class="text-[9px] text-gray-500">ServiML SpA</p>
          </div>
          <div class="border-t border-gray-300 pt-4">
            <div class="h-16 mb-2"></div>
            <p class="font-bold text-gray-900 uppercase">Firma Cliente</p>
            <p class="text-[9px] text-gray-500">Recibí conforme</p>
          </div>
        </div>
      </div>

      <div class="mt-12 text-center border-t border-gray-100 pt-6">
        <p class="text-gray-400 text-[9px] uppercase tracking-[0.2em]">
          Documento Informativo - ServiML Gestion de Flota
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
  body {
    background: white !important;
  }
}
</style>