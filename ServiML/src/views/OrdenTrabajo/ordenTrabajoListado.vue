<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import ordenTrabajoCard from "../../components/ordenTrabajo/ordendetrabajoCard.vue";
import navbar from "../../components/componentes/navbar.vue";
import { useInterfaz } from '../../stores/interfaz.js'
import ordentrabajoListado from '../../components/ordenTrabajo/ordentrabajoListado.vue'
import { useUserStore } from '../../stores/user'
const router = useRouter();
const ordenes = ref([]);
const todasLasOrdenes = ref([]);
const uiStore = useInterfaz()
const userStore = useUserStore()
const estados = ref([]);
const showStats = ref(false)
let searchTimeout = null;
const esTrabajador = computed(() => userStore.isTrabajador)
const Todas = ref(esTrabajador.value ? false : true)

const handleTodas = () => {
  Todas.value = !Todas.value
  obtenerOrdenes()
}

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

const obtenerOrdenes = async (busqueda = '', esCargaInicial = false) => {
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
    if (!Todas.value) {
      ordenes.value = data.filter((orden) => orden.id_empleado?.id === userStore.user.id)
    }
    if (esCargaInicial) {
      todasLasOrdenes.value = data;
    }
  }
  uiStore.hideLoading()
};

const handleBusqueda = (texto) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    obtenerOrdenes(texto);
  }, 500);
};

const stats = computed(() => {
  if (!todasLasOrdenes.value.length) return { total: 0, recientes: 0, sinAsignar: 0 };
  const ordenesMes = todasLasOrdenes.value.filter(s => new Date(s.created_at) >= esteMes.value.inicio && new Date(s.created_at) <= esteMes.value.fin);
  const total = ordenesMes.length;
  const recientes = todasLasOrdenes.value.filter(s => new Date(s.created_at) >= estaSemana.value.inicio && new Date(s.created_at) <= estaSemana.value.fin).length;
  const sinAsignar = ordenesMes.filter(s => s.id_empleado === null).length;

  return { total, recientes, sinAsignar };
});

onMounted(async () => {
  uiStore.showLoading()
  await obtenerEstados();
  await obtenerOrdenes('', true);
});
</script>

<template>
  <div class="servi-white min-h-screen pb-15">
    <navbar
      titulo="ServiML"
      subtitulo="Órdenes de Trabajo"
      class="sticky top-0 z-50"
      searchInput="true"
      @buscar="handleBusqueda"
    />
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div class="hidden md:grid md:grid-cols-3 gap-4 mb-8">
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs servi-grey-font uppercase font-bold">Órdenes / mes</p>
            <p class="text-2xl font-bold servi-grey-font">{{ stats.total }}</p>
        </div>
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs servi-grey-font uppercase font-bold">Recientes</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.recientes }}</p>
        </div>
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs servi-grey-font uppercase font-bold">Sin asignar</p>
            <p class="text-lg font-bold servi-grey-font">{{ stats.sinAsignar }}</p>
        </div>
      </div>

      <Transition name="slide-stats">
        <div v-show="showStats" class="md:hidden grid grid-cols-2 gap-3 mb-6">
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs servi-grey-font uppercase font-bold">Órdenes / mes</p>
              <p class="text-xl font-bold servi-grey-font">{{ stats.total }}</p>
          </div>
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs servi-grey-font uppercase font-bold">Recientes</p>
              <p class="text-xl font-bold text-green-600">{{ stats.recientes }}</p>
          </div>
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs servi-grey-font uppercase font-bold">Sin asignar</p>
              <p class="text-lg font-bold servi-grey-font">{{ stats.sinAsignar }}</p>
          </div>
        </div>
      </Transition>

      <div class="flex justify-between items-center mb-6">
        <div class="md:block hidden">
            <h2 class="text-xl font-bold servi-grey-font">Listado de Órdenes</h2>
            <p class="text-sm servi-grey-font">Gestiona los trabajos activos en el taller</p>
        </div>
        <div class="flex justify-end w-full items-center gap-2">

          <button @click="handleTodas()" class="servi-blue cursor-pointer rounded-full text-white font-bold py-2 px-4 shadow-sm border border-gray-100 hover:opacity-80 transition-all flex items-center gap-2">
            {{ Todas ? 'Ver mis OTs' : 'Ver todas' }}
          </button>
          
          <button 
            @click="showStats = !showStats" 
            class="md:hidden servi-adapt-bg cursor-pointer servi-grey-font font-bold py-2 px-4 rounded-full shadow-sm border border-gray-100 hover:opacity-80 transition-all flex items-center gap-2"
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
      <ordentrabajoListado :ordenes="ordenes" :estados="estados" @actualizar="obtenerOrdenes()"  />
      <div class="md:hidden grid grid-cols-1">
        <ordenTrabajoCard
          v-for="item in ordenes"
          :key="item.id"
          :orden="item"
          :estado="handleEstados(item.estado_actual_id)"
          @asignacion-exitosa="() => obtenerOrdenes()"
        />
      </div>
      <div v-if="ordenes.length === 0" class="servi-adapt-bg rounded-xl p-10 text-center shadow-sm border border-gray-100 md:hidden">
        <div class="servi-grey-font mb-2">
          <p v-if="esTrabajador" class="servi-grey-font text-lg">No se encontraron tus ordenes de trabajo</p>
          <p v-else class="servi-grey-font text-lg">No se encontraron ordenes de trabajo</p>
          <p class="text-sm servi-grey-font">Intenta cambiar el filtro de búsqueda.</p>
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