<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import presupuestoCard from "../../components/presupuesto/presupuestoCard.vue";
import navbar from "../../components/componentes/navbar.vue";
import { useInterfaz } from '../../stores/interfaz.js'
import presupuestoList from '../../components/presupuesto/presupuestoList.vue'

const router = useRouter();
const servicios = ref([]);
const todosLosServicios = ref([]);
const uiStore = useInterfaz()
const showStats = ref(false)
let searchTimeout = null;

const esteMes = computed(() => {
  const fecha = new Date();
  const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
  return {
    inicio: inicioMes,
    fin: finMes
  }
})


const handleBusqueda = (texto) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    obtenerPresupuestos(texto);
  }, 500);
};

const obtenerPresupuestos = async (busqueda = '', esCargaInicial = false) => {
  let query = supabase.from("presupuesto");

  if (busqueda) {
    query = query
      .select("*, vehiculo!inner(*), cliente(*)")
      .ilike('vehiculo.patente', `%${busqueda}%`);
  } else {
    query = query.select("*, vehiculo(*), cliente(*)");
  }

  query = query.order("numero_folio", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error(error);
  } else if (data) {
    servicios.value = data;
    if (esCargaInicial) {
      todosLosServicios.value = data;
    }
  }
  uiStore.hideLoading()
};

const irACrear = () => {
  router.push({ name: "nuevo-presupuesto" });
};

const irADetalle = (id) => {
  router.push({ name: 'ver-presupuesto', params: { id } });
}

const formatearDinero = (monto) => {
    if (!monto) return '$0';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto);
}

const camelCase = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

const stats = computed(() => {
  if (!todosLosServicios.value.length) return { total: 0, pendientes: 0, confirmados: 0, dineroPendiente: 0 };
  const serviciosMes = todosLosServicios.value.filter(s => new Date(s.created_at) >= esteMes.value.inicio && new Date(s.created_at) <= esteMes.value.fin);
    const total = serviciosMes.length;
    const pendientes = serviciosMes.filter(s => s.estado === 1).length;
    const confirmados = serviciosMes.filter(s => s.estado === 2).length;
    const dineroPendiente = serviciosMes
        .filter(s => s.estado === 2)
        .reduce((acc, curr) => acc + (curr.total_final || 0), 0);

    return { total, pendientes, confirmados, dineroPendiente };
});

const claseEstado = (estado) => {
    switch(estado) {
        case 2: return {clase: 'bg-green-100 text-green-800 border-green-200', texto: 'Confirmado'};
        case 3: return {clase: 'bg-red-100 text-red-800 border-red-200', texto: 'Descartado'};
        case 1: return {clase: 'bg-yellow-100 text-yellow-800 border-yellow-200', texto: 'En espera'};
        default: return {clase: 'servi-adapt-bg servi-white-font border-gray-800', texto: 'Cerrado'};
    }
}

const formatearFecha = (fechaString) => {
  if (!fechaString) return '---'
  const fecha = new Date(fechaString)
  return fecha.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })
}

onMounted(async () => {
  uiStore.showLoading()
  await obtenerPresupuestos('', true);
});
</script>

<template>
  <div class="servi-white min-h-screen pb-15">
    <navbar
      titulo="ServiML"
      subtitulo="Gestión de Presupuestos"
      class="sticky top-0 z-50"
      searchInput="true"
      @buscar="handleBusqueda"
    />
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div class="hidden md:grid md:grid-cols-4 gap-4 mb-8">
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-800">
            <p class="text-xs servi-grey-font uppercase font-bold">Total Presupuestos / mes</p>
            <p class="text-2xl font-bold servi-grey-font">{{ stats.total }}</p>
        </div>
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-800">
            <p class="text-xs servi-grey-font uppercase font-bold">Pendientes / mes</p>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.pendientes }}</p>
        </div>
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-800">
            <p class="text-xs servi-grey-font uppercase font-bold">Confirmados / mes</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.confirmados }}</p>
        </div>
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-800">
            <p class="text-xs servi-grey-font uppercase font-bold">Flujo Potencial / mes</p>
            <p class="text-lg font-bold servi-white-font">{{ formatearDinero(stats.dineroPendiente) }}</p>
        </div>
      </div>
      <Transition name="slide-stats">
        <div v-show="showStats" class="md:hidden grid grid-cols-2 gap-3 mb-6">
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-800">
              <p class="text-xs servi-grey-font uppercase font-bold">Total / mes</p>
              <p class="text-xl font-bold servi-grey-font">{{ stats.total }}</p>
          </div>
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-800">
              <p class="text-xs servi-grey-font uppercase font-bold">Pendientes / mes</p>
              <p class="text-xl font-bold text-yellow-600">{{ stats.pendientes }}</p>
          </div>
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-800">
              <p class="text-xs servi-grey-font uppercase font-bold">Confirmados / mes</p>
              <p class="text-xl font-bold text-green-600">{{ stats.confirmados }}</p>
          </div>
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-800">
              <p class="text-xs servi-grey-font uppercase font-bold">Flujo Potencial / mes</p>
              <p class="text-lg font-bold servi-white-font">{{ formatearDinero(stats.dineroPendiente) }}</p>
          </div>
        </div>
      </Transition>

      <div class="flex justify-between items-center mb-6">
        <div>
            <h2 class="text-xl font-bold servi-grey-font">Listado de Presupuestos</h2>
            <p class="text-sm servi-grey-font">Administra y revisa el estado de tus cotizaciones</p>
        </div>
        <div class="flex items-center gap-2">
          <button 
            @click="showStats = !showStats" 
            class="md:hidden servi-adapt-bg servi-grey-font font-bold py-2 px-4 rounded-lg shadow-sm border border-gray-800 hover:opacity-80 transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-4 w-4 transition-transform duration-300" 
              :class="{ 'rotate-180': showStats }"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <button 
            @click="irACrear" 
            class="servi-yellow servi-blue-font font-bold py-2 px-6 rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span class="text-xl leading-none mb-1">+</span>
            <span class="hidden sm:inline">Nuevo Presupuesto</span>
          </button>
        </div>
      </div>

      <presupuestoList :servicios="servicios" />
      <div class="md:hidden grid grid-cols-1">
        <presupuestoCard
          v-for="item in servicios"
          :key="item.id"
          :data="item"
          @click="irADetalle(item.id)"
        />
      </div>  
      <div v-if="servicios.length === 0" class="servi-adapt-bg rounded-xl p-10 text-center shadow-sm border border-gray-800 md:hidden">
        <div class="servi-grey-font mb-2">
          <p class="servi-grey-font text-lg">No se encontraron presupuestos</p>
          <p class="text-sm servi-grey-font">Intenta cambiar el filtro de búsqueda o crea uno nuevo.</p>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.slide-stats-enter-active,
.slide-stats-leave-active {
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.slide-stats-enter-from,
.slide-stats-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
  transform: translateY(-10px);
}

.slide-stats-enter-to,
.slide-stats-leave-from {
  opacity: 1;
  max-height: 200px;
  transform: translateY(0);
}
</style>