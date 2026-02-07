<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import presupuestoCard from "../../components/presupuesto/presupuestoCard.vue";
import navbar from "../../components/componentes/navbar.vue";
import { useInterfaz } from '../../stores/interfaz.js'

const router = useRouter();
const servicios = ref([]);
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

const obtenerPresupuestos = async (busqueda = '') => {
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

const stats = computed(() => {
  if (!servicios.value) return { total: 0, pendientes: 0, confirmados: 0, dineroPendiente: 0 };
  const serviciosMes = servicios.value.filter(s => new Date(s.created_at) >= esteMes.value.inicio && new Date(s.created_at) <= esteMes.value.fin);
    const total = serviciosMes.length;
    const pendientes = serviciosMes.filter(s => s.estado === 1).length;
    const confirmados = serviciosMes.filter(s => s.estado === 2).length;
    const dineroPendiente = serviciosMes
        .filter(s => s.estado === 1)
        .reduce((acc, curr) => acc + (curr.total_final || 0), 0);

    return { total, pendientes, confirmados, dineroPendiente };
});

const claseEstado = (estado) => {
    switch(estado) {
        case 2: return {clase: 'bg-green-100 text-green-800 border-green-200', texto: 'Confirmado'};
        case 3: return {clase: 'bg-red-100 text-red-800 border-red-200', texto: 'Descartado'};
        case 1: return {clase: 'bg-yellow-100 text-yellow-800 border-yellow-200', texto: 'En espera'};
        default: return {clase: 'bg-gray-100 text-gray-800 border-gray-200', texto: 'Cerrado'};
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
  await obtenerPresupuestos();
});
</script>

<template>
  <div class="bg-gray-50 min-h-screen pb-15">
    <navbar
      titulo="ServiML"
      subtitulo="Gestión de Presupuestos"
      class="sticky top-0 z-50"
      searchInput="true"
      @buscar="handleBusqueda"
    />
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div class="hidden md:grid md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs text-gray-400 uppercase font-bold">Total Presupuestos / mes</p>
            <p class="text-2xl font-bold servi-blue-font">{{ stats.total }}</p>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs text-gray-400 uppercase font-bold">Pendientes / mes</p>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.pendientes }}</p>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs text-gray-400 uppercase font-bold">Confirmados / mes</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.confirmados }}</p>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs text-gray-400 uppercase font-bold">Flujo Potencial / mes</p>
            <p class="text-lg font-bold text-gray-700">{{ formatearDinero(stats.dineroPendiente) }}</p>
        </div>
      </div>
      <Transition name="slide-stats">
        <div v-show="showStats" class="md:hidden grid grid-cols-2 gap-3 mb-6">
          <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs text-gray-400 uppercase font-bold">Total / mes</p>
              <p class="text-xl font-bold servi-blue-font">{{ stats.total }}</p>
          </div>
          <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs text-gray-400 uppercase font-bold">Pendientes / mes</p>
              <p class="text-xl font-bold text-yellow-600">{{ stats.pendientes }}</p>
          </div>
          <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs text-gray-400 uppercase font-bold">Confirmados / mes</p>
              <p class="text-xl font-bold text-green-600">{{ stats.confirmados }}</p>
          </div>
          <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs text-gray-400 uppercase font-bold">Flujo Potencial / mes</p>
              <p class="text-lg font-bold text-gray-700">{{ formatearDinero(stats.dineroPendiente) }}</p>
          </div>
        </div>
      </Transition>

      <div class="flex justify-between items-center mb-6">
        <div>
            <h2 class="text-xl font-bold servi-blue-font">Listado de Presupuestos</h2>
            <p class="text-sm text-gray-500">Administra y revisa el estado de tus cotizaciones</p>
        </div>
        <div class="flex items-center gap-2">
          <button 
            @click="showStats = !showStats" 
            class="md:hidden bg-white servi-blue-font font-bold py-2 px-4 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2"
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

      <div v-if="servicios.length === 0" class="bg-white rounded-xl p-10 text-center shadow-sm border border-gray-100">
        <div class="text-gray-400 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        </div>
        <p class="text-gray-500 text-lg">No se encontraron presupuestos</p>
        <p class="text-sm text-gray-400">Intenta cambiar el filtro de búsqueda o crea uno nuevo.</p>
      </div>

      <div v-else class="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="servi-blue servi-yellow-font text-xs uppercase tracking-wider border-b border-gray-100">
                    <th class="p-4 font-semibold">Folio</th>
                    <th class="p-4 font-semibold">Cliente</th>
                    <th class="p-4 font-semibold">Vehículo</th>
                    <th class="p-4 font-semibold">Diagnóstico</th>
                    <th class="p-4 font-semibold text-center">Emisión</th>
                    <th class="p-4 font-semibold text-right">Monto Total</th>
                    <th class="p-4 font-semibold text-center">Estado</th>
                    <th class="p-4 font-semibold text-center">Vencimiento</th>
                    <th class="p-4 font-semibold text-center">Acción</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                <tr 
                    v-for="item in servicios" 
                    :key="item.id" 
                    class="hover:bg-gray-50 transition-colors cursor-pointer"
                    @click="irADetalle(item.id)"
                >
                    <td class="p-4 font-medium text-gray-900">#{{ item.numero_folio }}</td>
                    <td class="p-4 text-gray-700">
                        <div class="font-medium">{{ item.cliente?.nombre }} {{ item.cliente?.apellido }}</div>
                        <div class="text-xs text-gray-400">{{ item.cliente?.email }}</div>
                    </td>
                    <td class="p-4 text-gray-700">
                        <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold">{{ item.vehiculo?.patente }}</span>
                        <div class="text-xs text-gray-500 mt-1">{{ item.vehiculo?.marca }} {{ item.vehiculo?.modelo }}</div>
                    </td>
                    <td class="p-4 text-gray-700">
                        <span class="block max-w-[200px] truncate" :title="item.diagnostico">{{ item.diagnostico }}</span>
                    </td>
                    <td class="p-4 text-center whitespace-nowrap">
                      <span class="text-gray-400">{{ formatearFecha(item.created_at) }}</span>
                    </td>
                    <td class="p-4 text-right font-bold servi-blue-font">
                        {{ formatearDinero(item.total_final) }}
                    </td>
                    <td class="p-4 text-center">
                        <span :class="['px-3 py-1 rounded-full text-xs font-medium border', claseEstado(item.estado).clase]">
                            {{ claseEstado(item.estado).texto }}
                        </span>
                    </td>
                    <td class="p-4 text-center">
                        <span v-if="item.estado===1" class="text-gray-400 hover:text-blue-600 transition-colors">
                            {{ formatearFecha(item.vencimiento) }}
                        </span>
                        <span v-else class="text-gray-400 hover:text-blue-600 transition-colors">
                            --- 
                        </span>
                    </td>
                    <td class="p-4 text-center">
                        <button class="text-gray-400 hover:text-blue-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
      </div>

      <div class="md:hidden grid grid-cols-1">
        <presupuestoCard
          v-for="item in servicios"
          :key="item.id"
          :data="item"
          @click="irADetalle(item.id)"
        />
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