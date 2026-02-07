<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import ordenTrabajoCard from "../../components/ordenTrabajo/ordendetrabajoCard.vue";
import navbar from "../../components/componentes/navbar.vue";
import { useInterfaz } from '../../stores/interfaz.js'
import botonAsignar from '../../components/ordenTrabajo/botonAsignar.vue'

const router = useRouter();
const ordenes = ref([]);
const uiStore = useInterfaz()
const estados = ref([]);
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

const estaSemana = computed(() => {
  const fecha = new Date();
  const inicioSemana = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - fecha.getDay());
  const finSemana = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + (6 - fecha.getDay()));
  return {
    inicio: inicioSemana,
    fin: finSemana
  }
})

const obtenerEstados = async () => {
  const { data } = await supabase.from('tabla_estados').select('*');
  if (data) estados.value = data;
}

const handleEstados = (id) => {
  return estados.value.find((estado) => estado.id === id) || { nombre: 'Desconocido' };
} 

const obtenerOrdenes = async (busqueda = '') => {
  let query = supabase.from("orden_trabajo");

  if (busqueda) {
    query = query
      .select("*,presupuesto(*),vehiculo!inner(*),cliente(*),id_empleado(*)")
      .ilike('vehiculo.patente', `%${busqueda}%`);
  } else {
    query = query.select("*,presupuesto(*),vehiculo(*),cliente(*),id_empleado(*)");
  }

  query = query.order("id", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error(error);
  } else if (data) {
    ordenes.value = data;
  }
  uiStore.hideLoading()
};

const handleBusqueda = (texto) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    obtenerOrdenes(texto);
  }, 500);
};

const irACrear = () => {
  router.push({ name: "nueva-orden-de-trabajo" });
};

const irADetalle = (id) => {
  router.push({ name: "ver-orden-de-trabajo", params: { id } });
}

const formatearDinero = (monto) => {
    if (!monto) return '$0';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto);
}

const camelCase = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
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

const colorEstado = (nombreEstado) => {
    if (!nombreEstado) return 'bg-gray-100 text-gray-800 border-gray-200';
    const estado = nombreEstado.toLowerCase();
    
    if (estado.includes('terminad') || estado.includes('entregad') || estado.includes('finaliz')) {
        return 'bg-green-100 text-green-800 border-green-200';
    } else if (estado.includes('proceso') || estado.includes('taller')) {
        return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (estado.includes('espera') || estado.includes('pendiente')) {
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

const stats = computed(() => {
  if (!ordenes.value.length) return { total: 0, recientes: 0, sinAsignar: 0 };
  const ordenesMes = ordenes.value.filter(s => new Date(s.created_at) >= esteMes.value.inicio && new Date(s.created_at) <= esteMes.value.fin);
  const total = ordenesMes.length;
  const recientes = ordenes.value.filter(s => new Date(s.created_at) >= estaSemana.value.inicio && new Date(s.created_at) <= estaSemana.value.fin).length;
  const sinAsignar = ordenesMes.filter(s => s.id_empleado === null).length;

  return { total, recientes, sinAsignar };
});

onMounted(async () => {
  uiStore.showLoading()
  await obtenerEstados();
  await obtenerOrdenes();
});
</script>

<template>
  <div class="bg-gray-50 min-h-screen pb-15">
    <navbar
      titulo="ServiML"
      subtitulo="Órdenes de Trabajo"
      class="sticky top-0 z-50"
      searchInput="true"
      @buscar="handleBusqueda"
    />
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div class="hidden md:grid md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs text-gray-400 uppercase font-bold">Órdenes / mes</p>
            <p class="text-2xl font-bold servi-blue-font">{{ stats.total }}</p>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs text-gray-400 uppercase font-bold">Recientes</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.recientes }}</p>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs text-gray-400 uppercase font-bold">Sin asignar</p>
            <p class="text-lg font-bold text-gray-700">{{ stats.sinAsignar }}</p>
        </div>
      </div>

      <Transition name="slide-stats">
        <div v-show="showStats" class="md:hidden grid grid-cols-2 gap-3 mb-6">
          <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs text-gray-400 uppercase font-bold">Órdenes / mes</p>
              <p class="text-xl font-bold servi-blue-font">{{ stats.total }}</p>
          </div>
          <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs text-gray-400 uppercase font-bold">Recientes</p>
              <p class="text-xl font-bold text-green-600">{{ stats.recientes }}</p>
          </div>
          <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs text-gray-400 uppercase font-bold">Sin asignar</p>
              <p class="text-lg font-bold text-gray-700">{{ stats.sinAsignar }}</p>
          </div>
        </div>
      </Transition>

      <div class="flex justify-between items-center mb-6">
        <div>
            <h2 class="text-xl font-bold servi-blue-font">Listado de Órdenes</h2>
            <p class="text-sm text-gray-500">Gestiona los trabajos activos en el taller</p>
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
        </div>
      </div>

      <div v-if="ordenes.length === 0" class="bg-white rounded-xl p-10 text-center shadow-sm border border-gray-100">
        <div class="text-gray-400 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        </div>
        <p class="text-gray-500 text-lg">No hay órdenes de trabajo</p>
        <p class="text-sm text-gray-400">Crea una nueva orden para comenzar.</p>
      </div>

      <div v-else class="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="servi-blue servi-yellow-font text-xs uppercase tracking-wider border-b border-gray-100">
                    <th class="p-4 font-semibold">Nro.</th>
                    <th class="p-4 font-semibold">Vehículo</th>
                    <th class="p-4 font-semibold">Diágnostico inicial</th>
                    <th class="p-4 font-semibold text-center">Ingreso</th>
                    <th class="p-4 font-semibold text-center">Estado Actual</th>
                    <th class="p-4 font-semibold text-center">Encargado</th>
                    <th class="p-4 font-semibold text-center">Acción</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                <tr 
                    v-for="item in ordenes" 
                    :key="item.id" 
                    class="hover:bg-gray-50 transition-colors cursor-pointer"
                    @click="irADetalle(item.id)"
                >
                    <td class="p-4 font-medium text-gray-900">#{{ item.presupuesto.numero_folio }}</td>
                    <td class="p-4 text-gray-700">
                        <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold uppercase">{{ item.vehiculo?.patente }}</span>
                        <div class="text-xs text-gray-500 mt-1">{{ item.vehiculo?.marca }} {{ item.vehiculo?.modelo }}</div>
                    </td>
                    <td class="p-4 text-gray-700">
                        <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold block max-w-[200px] truncate">{{ item.presupuesto.diagnostico }}</span>
                    </td>
                    <td class="p-4 text-center whitespace-nowrap">
                      <span class="text-gray-400">{{ formatearFecha(item.created_at) }}</span>
                    </td>
                    <td class="p-4 text-center">
                        <span :class="['px-3 py-1 rounded-full text-xs font-medium border', colorEstado(handleEstados(item.estado_actual_id).nombre)]">
                            {{ handleEstados(item.estado_actual_id).nombre }}
                        </span>
                    </td>
                    <td class="p-4 text-center">
                        <span v-if="item.id_empleado" class="text-gray-400">{{ item.id_empleado.nombre }}</span>
                        <botonAsignar v-else :orden="item" @empleadoSeleccionado="obtenerOrdenes" />
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
        <ordenTrabajoCard
          v-for="item in ordenes"
          :key="item.id"
          :orden="item"
          :estado="handleEstados(item.estado_actual_id)"
          @asignacion-exitosa="() => obtenerOrdenes()"
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