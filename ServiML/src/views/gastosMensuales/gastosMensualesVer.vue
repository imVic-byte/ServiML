<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient.js';
import navbar from '@/components/componentes/navbar.vue';
import html2pdf from 'html2pdf.js';
import GastosMensualesPDF from './gastosMensualesPDF.vue';
import modal from '@/components/componentes/modal.vue';

const route = useRoute();
const router = useRouter();
const idFicha = route.params.id;

const cargando = ref(true);
const ficha = ref(null);
const detalles = ref([]);

const modalState = ref({ visible: false, titulo: '', mensaje: '', exito: true, rutaDestino: null });

const cerrarModal = () => {
  modalState.value.visible = false;
  if (modalState.value.rutaDestino) {
    router.push(modalState.value.rutaDestino);
    modalState.value.rutaDestino = null;
  }
};

const cargarFicha = async () => {
  cargando.value = true;
  try {
    const { data: dataFicha, error: errorFicha } = await supabase
      .from('gastos_fijos')
      .select('*')
      .eq('id', idFicha)
      .single();

    if (errorFicha) throw errorFicha;
    ficha.value = dataFicha;

    const { data: dataDetalles, error: errorDetalles } = await supabase
      .from('detalle_gastos_fijos')
      .select('*')
      .eq('id_gastos_fijos', idFicha)
      .order('fecha_emision', { ascending: false });

    if (errorDetalles) throw errorDetalles;
    detalles.value = dataDetalles || [];

  } catch (error) {
    console.error("Error al cargar la ficha:", error.message);
    modalState.value = { visible: true, titulo: 'Error', mensaje: 'No se pudo cargar la información de esta ficha.', exito: false, rutaDestino: '/gastos' };
  } finally {
    cargando.value = false;
  }
};

onMounted(() => {
  if (idFicha) {
    cargarFicha();
  } else {
    router.push('/gastos');
  }
});

const formatearDinero = (valor) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor || 0);
};

const formatearMes = (fechaString) => {
  if (!fechaString) return '';
  const fecha = new Date(fechaString + 'T00:00:00');
  const opciones = { month: 'long', year: 'numeric' };
  const formato = fecha.toLocaleDateString('es-CL', opciones);
  return formato.charAt(0).toUpperCase() + formato.slice(1);
};

const formatearFechaNormal = (fechaString) => {
  if (!fechaString) return '';
  const fecha = new Date(fechaString + 'T00:00:00');
  return fecha.toLocaleDateString('es-CL');
};

const textoEstado = (estadoNumerico) => {
  return estadoNumerico === 1 ? 'Pendiente' : 'Cerrado';
};

const mostrarConfirmacionCierre = ref(false);

const solicitarCerrarMes = () => {
  mostrarConfirmacionCierre.value = true;
};

const confirmarCierreMes = async () => {
  mostrarConfirmacionCierre.value = false; 
  cargando.value = true;
  
  try {
    const { error } = await supabase
      .from('gastos_fijos')
      .update({ estado: 2 }) 
      .eq('id', idFicha);

    if (error) throw error;
    let fechaSinGuiones = ficha.value.fecha.replace('-','').replace('-','');
    const { data: dataTransaccion, error: errorTransaccion } = await supabase
      .from('transacciones')
      .insert({
        fecha: new Date().toISOString(),
        descripcion: `Cierre de mes ${formatearMes(ficha.value.fecha)}`,
        cantidad:1,
        valor_iva_incluido: ficha.value.total_general,
        documento: 'Cierre de mes',
        nro_documento:fechaSinGuiones,
        proveedor:'ServiML',
        forma_pago:'Cierre de mes',
        tipo: 'PAGO',
        observacion:'Cierre de mes',
        id_ficha_gastos: idFicha
      })
      .select()
      .single();

    if (errorTransaccion) throw errorTransaccion;

    for (const detalle of detalles.value) {
      const { error: errorDetalle } = await supabase
        .from('transacciones_detalle')
        .insert({
          id_transaccion: dataTransaccion.id,
          url: detalle.comprobante
        })
        .select()
        .single();

      if (errorDetalle) throw errorDetalle;
    }
      
    ficha.value.estado = 2;

    modalState.value = { 
      visible: true, 
      titulo: '¡Mes Cerrado!', 
      mensaje: 'La ficha mensual ha sido cerrada exitosamente y ahora es de solo lectura.', 
      exito: true, 
      rutaDestino: null 
    };

  } catch (error) {
    console.error("Error al cerrar el mes:", error.message);
    modalState.value = { 
      visible: true, 
      titulo: 'Error', 
      mensaje: 'Hubo un error al intentar cerrar el mes.', 
      exito: false, 
      rutaDestino: null 
    };
  } finally {
    cargando.value = false;
  }
};

const exportarPDF = () => {
  const element = document.getElementById('reporte-gastos-imprimir');
  if (!element) return;

  const opciones = {
    margin: 0,
    filename: `Reporte_Gastos_${ficha.value.fecha}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opciones).from(element).save();
};

const irAEditar = () => {
  router.push({ name: 'editar-gasto', params: { id: idFicha } });
};
</script>

<template>
  <div class="min-h-screen servi-white font-sans">
    <navbar titulo="ServiML" :subtitulo="'Detalle de Gastos'" class="navbar"></navbar>
    <div class="max-w-7xl mx-auto pt-5 pb-30 px-4 md:px-8">

      <button @click="router.push('/gastos')"
        class="mb-4 flex items-center gap-1 text-sm servi-grey-font hover:opacity-80 transition cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </button>

      <div v-if="cargando" class="flex flex-col items-center justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
        <p class="servi-grey-font font-bold">Cargando detalles de la ficha...</p>
      </div>

      <template v-else-if="ficha">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4 mb-6">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <h1 class="text-xl md:text-3xl font-bold servi-grey-font border-l-4 border-yellow-500 pl-3 capitalize">
                Ficha: {{ formatearMes(ficha.fecha) }}
              </h1>
              <span :class="ficha.estado === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'"
                class="px-3 py-1 rounded-full text-xs font-bold">
                {{ textoEstado(ficha.estado) }}
              </span>
            </div>
            <p class="text-sm servi-grey-font pl-4">ID de Registro: #{{ ficha.id }}</p>
          </div>

          <div class="flex gap-2 w-full md:w-auto">
            <button @click="exportarPDF"
              class="flex-1 md:flex-none bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded shadow-sm hover:bg-slate-100 font-semibold text-sm">
              Descargar PDF
            </button>
            <button v-if="ficha.estado === 1" @click="irAEditar"
              class="flex-1 md:flex-none servi-yellow text-slate-900 px-5 py-2 rounded shadow-md font-semibold text-sm">
              Editar Ficha
            </button>
            <button @click="solicitarCerrarMes" v-if="ficha.estado === 1"
              class="flex-1 md:flex-none bg-red-500 text-white px-5 py-2 rounded shadow-md font-semibold text-sm hover:bg-red-600">
              Cerrar Mes
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div class="lg:col-span-2 space-y-6">
            <div class="servi-adapt-bg rounded-lg shadow-sm border border-gray-100">
              <div
                class="border-yellow-500 border-b-4 px-4 md:px-6 py-3 md:py-4 rounded-t-lg servi-blue flex justify-between items-center text-white">
                <h2 class="text-base md:text-lg font-bold">Desglose de Gastos</h2>
                <span class="text-xs md:text-sm font-semibold">{{ detalles.length }} ítems</span>
              </div>

              <div v-if="detalles.length === 0" class="p-6 text-center text-gray-500 font-medium">
                Esta ficha no tiene gastos detallados registrados.
              </div>

              <div v-else class="md:hidden p-3 space-y-3">
                <div v-for="gasto in detalles" :key="gasto.id" class="p-3 rounded-lg border border-gray-100">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <p class="font-bold servi-grey-font text-sm">{{ gasto.descripcion }}</p>
                      <p class="text-xs servi-grey-font mt-0.5">{{ formatearFechaNormal(gasto.fecha_emision) }}</p>
                    </div>
                    <span
                      class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">{{
                      gasto.categoria }}</span>
                  </div>
                  <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <span class="font-bold text-blue-600">{{ formatearDinero(gasto.monto) }}</span>
                    <a v-if="gasto.comprobante" :href="gasto.comprobante" target="_blank"
                      class="text-xs font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Ver adjunto
                    </a>
                  </div>
                </div>
              </div>

              <div v-if="detalles.length > 0" class="hidden md:block overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-bold servi-grey-font uppercase">Concepto
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-bold servi-grey-font uppercase">Fecha</th>
                      <th class="px-6 py-3 text-left text-xs font-bold servi-grey-font uppercase">Categoría
                      </th>
                      <th class="px-6 py-3 text-center text-xs font-bold servi-grey-font uppercase">Adjunto
                      </th>
                      <th class="px-6 py-3 text-right text-xs font-bold servi-grey-font uppercase">Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="gasto in detalles" :key="gasto.id" class="border-t border-gray-100 hover:bg-slate-50">
                      <td class="px-6 py-4 text-sm servi-grey-font font-medium">{{ gasto.descripcion }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm servi-grey-font">{{
                        formatearFechaNormal(gasto.fecha_emision) }}</td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          class="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold border border-slate-200">{{
                          gasto.categoria }}</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-center">
                        <a v-if="gasto.comprobante" :href="gasto.comprobante" target="_blank"
                          class="inline-flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                          title="Ver comprobante">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Abrir
                        </a>
                        <span v-else class="text-xs text-gray-300 font-medium italic">N/A</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold text-right">{{
                        formatearDinero(gasto.monto) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="lg:col-span-1 order-first lg:order-none">
            <div class="servi-adapt-bg rounded-xl shadow-lg border-t-4 border-yellow-500 p-4 md:p-6 lg:sticky lg:top-6">
              <h2 class="text-lg md:text-xl font-bold mb-4 md:mb-6 servi-grey-font uppercase tracking-wide">Resumen
                Financiero</h2>

              <div class="space-y-3 md:space-y-4 mb-6 md:mb-8">
                <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span class="servi-grey-font text-sm font-medium">Total Administrativo</span>
                  <span class="font-bold servi-grey-font">{{ formatearDinero(ficha.total_administrativo) }}</span>
                </div>
                <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span class="servi-grey-font text-sm font-medium">Total Operacional</span>
                  <span class="font-bold servi-grey-font">{{ formatearDinero(ficha.total_operacional) }}</span>
                </div>
              </div>

              <div class="servi-blue p-3 md:p-4 rounded-xl flex justify-between items-center mb-4 md:mb-6 shadow-md">
                <span class="text-xs md:text-sm font-bold text-yellow-500 uppercase tracking-wider">Total General</span>
                <span class="text-xl md:text-2xl font-bold text-white">{{ formatearDinero(ficha.total_general) }}</span>
              </div>
            </div>
          </div>

        </div>
      </template>

    </div>
    <div class="absolute -left-[9999px] top-0">
      <GastosMensualesPDF v-if="ficha" :ficha="ficha" :detalles="detalles" />
    </div>
    <div v-if="mostrarConfirmacionCierre" class="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/60 backdrop-blur-sm">
      <div class="servi-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="bg-red-500 px-6 py-4 flex justify-between items-center text-white">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Confirmar Cierre
          </h3>
          <button @click="mostrarConfirmacionCierre = false" class="text-white hover:text-red-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-6 space-y-3">
          <p class="servi-grey-font font-medium">¿Estás seguro de que deseas cerrar este mes?</p>
          <p class="text-sm text-red-600 font-semibold bg-red-50 p-3 rounded-lg border border-red-100">
            Al confirmar, esta ficha pasará a modo "Solo Lectura". Ya no podrás editar, agregar ni eliminar más gastos.
          </p>
        </div>
        <div class="servi-blue px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
          <button @click="mostrarConfirmacionCierre = false" class="px-4 py-2 text-sm font-medium text-white hover:bg-gray-200 hover:text-gray-800 rounded-lg transition-colors cursor-pointer">
            Cancelar
          </button>
          <button @click="confirmarCierreMes" class="px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-md transition-all cursor-pointer">
            Sí, cerrar mes
          </button>
        </div>
      </div>
    </div>

    <modal v-if="modalState.visible" :titulo="modalState.titulo" :mensaje="modalState.mensaje" :exito="modalState.exito" @cerrar="cerrarModal" />
  </div>
</template>