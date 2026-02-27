<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient.js';
import volver from '@/components/componentes/volver.vue';
import navbar from '@/components/componentes/navbar.vue';

const mostrarStats = ref(false);
const cargando = ref(true);
const fichasGastos = ref([]);

const router = useRouter();
const route = useRoute();

const obtenerGastosMensuales = async () => {
  cargando.value = true;
  try {
    const { data, error } = await supabase
      .from('gastos_fijos') 
      .select('*')
      .order('fecha', { ascending: false });

    if (error) throw error;
    
    fichasGastos.value = data || [];
  } catch (error) {
    console.error("Error al obtener los gastos fijos:", error.message);
  } finally {
    cargando.value = false;
  }
};

onMounted(() => {
  obtenerGastosMensuales();
});

const gastoTotalAnual = computed(() => {
  return fichasGastos.value.reduce((acc, ficha) => acc + Number(ficha.total_general || 0), 0);
});

const gastoMesActual = computed(() => {
  if (fichasGastos.value.length === 0) return 0;
  return fichasGastos.value[0].total_general || 0;
});

const fichasPorAprobar = computed(() => {
  return fichasGastos.value.filter(ficha => ficha.estado === 1).length;
});

const formatearDinero = (monto) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto || 0);
};

const formatearMes = (fechaString) => {
  if (!fechaString) return 'Mes Desconocido';
  const fecha = new Date(fechaString + 'T00:00:00'); 
  const opciones = { month: 'long', year: 'numeric' };
  const formato = fecha.toLocaleDateString('es-CL', opciones);
  return formato.charAt(0).toUpperCase() + formato.slice(1);
};

const textoEstado = (estadoNumerico) => {
  return estadoNumerico === 1 ? 'Pendiente' : 'Cerrado';
};

const handleRedirigir = (id) => {
  router.push({ name: 'ver-gasto', params: { id } });
};

const handleRegistrar = () => {
  router.push({ name: 'crear-gasto' });
};
</script>

<template>
  <div class="min-h-screen servi-white font-sans">
    <navbar titulo="ServiML" :subtitulo="'Gastos de la Empresa'" class="navbar"></navbar>
    <div class="max-w-6xl mx-auto space-y-6 pt-5 pb-30 px-4 md:px-8">
      <button @click="router.push('/configuracion')"
          class="mb-4 flex items-center gap-1 text-sm servi-grey-font hover:opacity-80 transition cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
      
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 class="text-xl md:text-3xl font-bold servi-grey-font border-l-4 border-yellow-500 pl-3">
          Gastos de la Empresa
        </h1>
        <div class="flex gap-2 justify-between">
          <button 
            @click="mostrarStats = !mostrarStats" 
            class="md:hidden servi-blue text-white py-3 rounded-full font-semibold shadow-sm flex justify-between items-center px-4"
          >
            <span>Resumen Financiero</span>
            <span class="text-white font-bold"> {{ mostrarStats ? ' -' : ' +' }}</span>
          </button>
          <button @click="handleRegistrar" class="servi-yellow rounded-full md:w-auto px-5 py-2.5 shadow-md font-semibold text-sm">
            <p class="md:hidden">+</p>
            <p class="hidden md:block">Registrar Mes</p>
          </button>
        </div>
      </div>

      <div :class="mostrarStats ? 'block' : 'hidden md:grid'" class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div class="servi-blue p-4 md:p-5 rounded-lg shadow-lg border-b-4 border-yellow-500 relative overflow-hidden">
          <h3 class="text-white text-xs md:text-sm font-bold uppercase tracking-wider">Gasto Total Registrado</h3>
          <p class="text-2xl md:text-3xl font-extrabold text-yellow-500 mt-1 md:mt-2">{{ formatearDinero(gastoTotalAnual) }}</p>
        </div>
        
        <div class="servi-blue p-4 md:p-5 rounded-lg shadow-lg border-b-4 border-slate-300">
          <h3 class="text-white text-xs md:text-sm font-bold uppercase tracking-wider">Último Mes</h3>
          <p class="text-2xl md:text-3xl font-bold text-white mt-1 md:mt-2">{{ formatearDinero(gastoMesActual) }}</p>
        </div>
        
        <div class="servi-blue p-4 md:p-5 rounded-lg shadow-lg border-b-4 border-slate-300">
          <h3 class="text-white text-xs md:text-sm font-bold uppercase tracking-wider">Por Aprobar</h3>
          <p class="text-2xl md:text-3xl font-bold text-white mt-1 md:mt-2">{{ fichasPorAprobar }} Ficha(s)</p>
        </div>
      </div>

      <div v-if="cargando" class="flex justify-center items-center py-10">
        <p class="servi-grey-font font-bold">Cargando registros...</p>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 gap-3 md:hidden mt-4">
          <div v-if="fichasGastos.length === 0" class="text-center text-gray-500 py-4">
            No hay gastos registrados aún.
          </div>
          
          <div v-for="ficha in fichasGastos" :key="ficha.id" class="servi-blue p-4 rounded-lg shadow-lg">
            <div class="flex justify-between items-center mb-2">
              <span class="font-bold text-white text-base capitalize">{{ formatearMes(ficha.fecha) }}</span>
              <span 
                :class="ficha.estado === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'"
                class="px-2 py-0.5 rounded text-xs font-bold"
              >
                {{ textoEstado(ficha.estado) }}
              </span>
            </div>
            <div class="flex justify-between items-center mb-3">
              <span class="text-white/80 text-sm">Total:</span>
              <span class="font-bold text-white text-lg">{{ formatearDinero(ficha.total_general) }}</span>
            </div>
            <button @click="handleRedirigir(ficha.id)" class="w-full servi-yellow py-2.5 rounded-md font-semibold text-sm">
              Ver Ficha
            </button>
          </div>
        </div>

        <div class="hidden md:block servi-adapt-bg rounded-lg shadow-md overflow-hidden mt-6">
          <table class="min-w-full">
            <thead class="servi-blue text-white">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Mes de Operación</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Total Gastos</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Estado</th>
                <th class="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="fichasGastos.length === 0">
                <td colspan="4" class="px-6 py-4 text-center text-gray-500 font-medium">No hay registros de gastos disponibles.</td>
              </tr>
              
              <tr v-for="ficha in fichasGastos" :key="ficha.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap font-medium servi-grey-font capitalize">{{ formatearMes(ficha.fecha) }}</td>
                <td class="px-6 py-4 whitespace-nowrap font-bold servi-grey-font">{{ formatearDinero(ficha.total_general) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    :class="ficha.estado === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'"
                    class="px-3 py-1 rounded-full text-xs font-bold"
                  >
                    {{ textoEstado(ficha.estado) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap flex servi-grey-font justify-center">
                  <button @click="handleRedirigir(ficha.id)" class="hover:text-blue-600 p-1 rounded-full hover:bg-slate-200 transition-colors" title="Ver detalle">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      
    </div>
  </div>
</template>