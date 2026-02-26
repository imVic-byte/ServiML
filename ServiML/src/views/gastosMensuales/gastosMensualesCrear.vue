<script setup>
import {ref,computed} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import navbar from '@/components/componentes/navbar.vue';
import volver from '@/components/componentes/volver.vue';
import jsPDF from 'jspdf';

const route = useRoute();
const router = useRouter();

const id = route.params.id;

const fechaActual = new Date().toLocaleDateString('es-CL', {
  month: 'long',
  year: 'numeric'
});

const fecha = ref('');
const concepto = ref('');
const monto = ref('');
const categoria = ref('');
const comprobante = ref('');

const categorias = ref([
  { id: 1, nombre: 'Administrativo' },
  { id: 2, nombre: 'Operacional' },
]);

const total = computed(() => {
  return categorias.value.reduce((acc, categoria) => {
    return acc + categoria.monto;
  }, 0);
});

const agregarGasto = () => {
  const gasto = {
    id: Date.now(),
    fecha: fecha.value,
    concepto: concepto.value,
    monto: monto.value,
    categoria: categoria.value,
    comprobante: comprobante.value,
  };
  categorias.value.push(gasto);
  fecha.value = '';
  concepto.value = '';
  monto.value = '';
  categoria.value = '';
  comprobante.value = '';
};

const eliminarGasto = (id) => {
  categorias.value = categorias.value.filter((gasto) => gasto.id !== id);
};

const exportarPDF = () => {
  const pdf = new jsPDF();
  pdf.text('Ficha de Gastos', 10, 10);
  pdf.text('Febrero 2026', 10, 20);
  pdf.text('Total: ' + total.value, 10, 30);
  pdf.save('ficha_gastos.pdf');
};

const cerrarMes = () => {
  router.push('/gastos-mensuales');
};

</script>
<template>
  <div class="min-h-screen servi-white font-sans">
    <navbar titulo="ServiML" :subtitulo="'Crear ficha de gastos fijos'" class="navbar"></navbar>
    <div class="max-w-7xl mx-auto pt-5 pb-30 px-4 md:px-8">
      
      <div class="mb-6">
        <volver></volver>
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-2">
          <h1 class="text-xl md:text-3xl font-bold servi-grey-font border-l-4 border-yellow-500 pl-3">
            Ficha de Gastos: Febrero 2026
          </h1>
          <div class="flex gap-2 w-full md:w-auto">
            <button @click="exportarPDF" class="flex-1 md:flex-none bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded shadow-sm hover:bg-slate-100 font-semibold text-sm">
              Exportar PDF
            </button>
            <button @click="cerrarMes" class="flex-1 md:flex-none servi-blue text-white px-5 py-2 rounded shadow-md font-semibold text-sm">
              Cerrar Mes
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="lg:col-span-2 space-y-6">
          
          <div class="servi-adapt-bg rounded-lg shadow-sm overflow-hidden">
            <div class="servi-blue px-6 py-4 border-b-4 border-yellow-500">
              <h2 class="text-lg font-bold text-white">Registrar Nuevo Gasto</h2>
            </div>
            
            <form class="p-6 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="text-sm font-bold servi-grey-font mb-1">Concepto / Descripción</label>
                  <input type="text" class="border border-gray-100 rounded-md p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none servi-grey-font" placeholder="Ej. Pago de internet">
                </div>
                
                <div class="flex flex-col">
                  <label class="text-sm font-bold servi-grey-font mb-1">Monto</label>
                  <input type="number" class="border border-gray-100 rounded-md p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none servi-grey-font" placeholder="0.00">
                </div>
                
                <div class="flex flex-col">
                  <label class="text-sm font-bold servi-grey-font mb-1">Categoría</label>
                  <select class="border border-gray-100 rounded-md p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none servi-grey-font">
                    <option class="servi-adapt-bg servi-grey-font" v-for="categoria in categorias" :key="categoria.id" :value="categoria.nombre">{{ categoria.nombre }}</option>
                  </select>
                </div>
                
                <div class="flex flex-col">
                  <label class="text-sm font-bold servi-grey-font mb-1">Fecha de Emisión</label>
                  <input type="date" class="border border-gray-100 rounded-md p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none servi-grey-font">
                </div>
              </div>
              
              <div class="flex flex-col">
                <label class="text-sm font-bold servi-grey-font mb-1">Comprobante (Opcional)</label>
                <div class="border-2 border-dashed border-slate-300 rounded-md p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                  <span class="servi-grey-font text-sm font-medium">Haz clic o arrastra un archivo aquí</span>
                </div>
              </div>

              <div class="flex justify-end pt-2">
                <button type="button" class="bg-yellow-500 text-slate-900 px-6 py-2 rounded-md font-bold shadow-sm hover:bg-yellow-400 transition-colors">
                  Agregar a la Ficha
                </button>
              </div>
            </form>
          </div>

          <div class="servi-adapt-bg rounded-lg shadow-sm">
            <div class="border-yellow-500 border-b-4 px-4 md:px-6 py-3 md:py-4 rounded-t-lg servi-blue flex justify-between items-center text-white">
              <h2 class="text-base md:text-lg font-bold">Detalle de Gastos Ingresados</h2>
              <span class="text-xs md:text-sm font-semibold">2 ítems</span>
            </div>
            
            <!-- Mobile: Card view -->
            <div class="md:hidden p-3 space-y-3">
              <div class="p-3 rounded-lg border border-gray-100">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <p class="font-medium servi-grey-font text-sm">Licencia de Software Anual</p>
                    <p class="text-xs servi-grey-font mt-0.5">12 Feb 2026</p>
                  </div>
                  <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">Administrativo</span>
                </div>
                <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                  <span class="font-bold servi-grey-font">$1,200.00</span>
                  <button class="text-red-500 hover:text-red-700 font-bold text-sm">Eliminar</button>
                </div>
              </div>
            </div>

            <!-- Desktop: Table view -->
            <div class="hidden md:block overflow-x-auto">
              <table class="min-w-full">
                <thead>
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-bold servi-grey-font uppercase">Fecha</th>
                    <th class="px-6 py-3 text-left text-xs font-bold servi-grey-font uppercase">Concepto</th>
                    <th class="px-6 py-3 text-left text-xs font-bold servi-grey-font uppercase">Categoría</th>
                    <th class="px-6 py-3 text-right text-xs font-bold servi-grey-font uppercase">Monto</th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm servi-grey-font">12 Feb 2026</td>
                    <td class="px-6 py-4 text-sm servi-grey-font font-medium">Licencia de Software Anual</td>
                    <td class="px-6 py-4 whitespace-nowrap"><span class="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold border border-slate-200">Administrativo</span></td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm servi-grey-font font-bold text-right">$1,200.00</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button class="text-red-500 hover:text-red-700 font-bold">Eliminar</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        <div class="lg:col-span-1 order-first lg:order-none">
          <div class="servi-adapt-bg rounded-lg shadow-lg border-t-4 border-yellow-500 p-4 md:p-6 lg:sticky lg:top-6">
            <h2 class="text-lg md:text-xl font-bold mb-4 md:mb-6 servi-grey-font">Resumen del Mes</h2>
            
            <div class="space-y-3 md:space-y-4 mb-6 md:mb-8">
              <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                <span class="servi-grey-font text-sm">Total Administrativo</span>
                <span class="font-bold servi-grey-font">$1,200.00</span>
              </div>
              <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                <span class="servi-grey-font text-sm">Total Operacional</span>
                <span class="font-bold servi-grey-font">$0.00</span>
              </div>
            </div>

            <div class="servi-blue p-3 md:p-4 rounded-lg flex justify-between items-center mb-4 md:mb-6">
              <span class="text-xs md:text-sm font-bold text-yellow-500 uppercase tracking-wider">Total General</span>
              <span class="text-xl md:text-2xl font-bold text-white">$1,650.00</span>
            </div>
            
            <p class="text-xs servi-grey-font text-center mt-3 md:mt-4">Estado actual: Pendiente de Revisión</p>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>