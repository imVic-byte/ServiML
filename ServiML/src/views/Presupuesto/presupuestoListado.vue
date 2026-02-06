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
const showStats = ref(false);
let searchTimeout = null;

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
    const total = servicios.value.length;
    const pendientes = servicios.value.filter(s => s.estado === 1).length;
    const confirmados = servicios.value.filter(s => s.estado === 2).length;
    const dineroPendiente = servicios.value
        .filter(s => s.estado === 1)
        .reduce((acc, curr) => acc + (curr.total_final || 0), 0);

    return { total, pendientes, confirmados, dineroPendiente };
});

const handleEstados = (estado) => {
  switch (estado) {
    case 2:
      return {clase: 'badge-confirmado', texto: 'Confirmado', contenedor: 'confirmado'}
    case 3:
      return {clase: 'badge-descartado', texto: 'Descartado', contenedor: 'descartado'}
    case 1:
      return {clase: 'badge-en-espera-de-confirmación', texto: 'En espera de confirmación', contenedor: 'en-espera'}
    default:
      return {clase: 'badge-cerrado', texto: 'Cerrado', contenedor: 'cerrado'}
  }
}
onMounted(async () => {
  uiStore.showLoading()
  await obtenerPresupuestos();
});
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <navbar
      titulo="ServiML"
      subtitulo="Gestión de Presupuestos"
      class="sticky top-0 z-50"
      searchInput="true"
      @buscar="handleBusqueda"
    />
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <div class="flex flex-col md:flex-row justify-between items-center mb-6">
        <div class="flex w-full md:w-auto flex-col">
            <h2 class="text-xl font-bold servi-blue-font">Listado de Presupuestos</h2>
            <p class="text-sm text-gray-500">Administra y revisa el estado de tus cotizaciones</p>
        </div>
        <div class="flex gap-2 ">
          <div class="md:hidden mb-4">
          <button 
            @click="showStats = !showStats"
            class="w-full flex justify-between items-center px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium shadow-sm active:bg-gray-50 transition-colors"
          >
            <span>
              {{ showStats ? 'Ocultar Resumen' : 'Ver Resumen' }}
            </span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-5 w-5 transform transition-transform duration-200"
              :class="{ 'rotate-180': showStats }"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
      </div>
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
                <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th class="p-4 font-semibold">Folio</th>
                    <th class="p-4 font-semibold">Cliente</th>
                    <th class="p-4 font-semibold">Vehículo</th>
                    <th class="p-4 font-semibold text-right">Monto Total</th>
                    <th class="p-4 font-semibold text-center">Estado</th>
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
                    <td class="p-4 text-right font-bold servi-blue-font">
                        {{ formatearDinero(item.total_final) }}
                    </td>
                    <td class="p-4 text-center">
                        <span :class="['px-3 py-1 rounded-full text-xs font-medium', handleEstados(item.estado).clase]">
                            {{ handleEstados(item.estado).texto }}
                        </span>
                    </td>
                    <td class="p-4 text-center">
                        <button class="text-gray-400 hover:text-blue-600 transition-colors" @click="irADetalle(item.id)"> 
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
      </div>

      <div class="md:hidden grid grid-cols-1 gap-4">
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
.badge-confirmado {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #36f04c5c;
  color: #1b5e20;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-descartado {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #ff4c4c;
  color: #ffffff;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-en-espera-de-confirmación {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #ffd900;
  color: #515151;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-cerrado {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #52026f;
  color: #ffffff;
  border-radius: 4px;
  text-transform: uppercase;
}
</style>