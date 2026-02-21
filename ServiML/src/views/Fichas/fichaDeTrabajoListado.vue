<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import navbar from "../../components/componentes/navbar.vue";
import { supabase } from "../../lib/supabaseClient";
import { useInterfaz } from "@/stores/interfaz";

const router = useRouter();
const interfaz = useInterfaz();
const showStats = ref(false);
let searchTimeout = null;

const fichas = ref([]);
const fichasOriginales = ref([]);

const handleBusqueda = (texto) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (!texto || texto.trim() === '') {
      fichas.value = [...fichasOriginales.value];
    } else {
      const busqueda = texto.toLowerCase();
      fichas.value = fichasOriginales.value.filter(f =>
        f.id?.toString().includes(busqueda) ||
        f.cliente?.nombre?.toLowerCase().includes(busqueda) ||
        f.cliente?.apellido?.toLowerCase().includes(busqueda)
      );
    }
  }, 300);
};

const irADetalle = (id) => {
  router.push({ name: "ficha-de-trabajo", params: { id } });
};

const irACrear = () => {
  router.push({ name: "crear-ficha-de-trabajo" });
};

const camelCase = (texto) => {
  if (!texto) return "---";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

const formatearFecha = (fechaString) => {
  if (!fechaString) return "---";
  const fecha = new Date(fechaString);
  return fecha.toLocaleDateString("es-CL", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const stats = computed(() => {
  const total = fichasOriginales.value.length;
  const ingresadas = fichasOriginales.value.filter(f => f.estado === 1).length;
  const enProceso = fichasOriginales.value.filter(f => f.estado === 2).length;
  const terminadas = fichasOriginales.value.filter(f => f.estado === 3).length;
  return { total, ingresadas, enProceso, terminadas };
});

const obtenerFichas = async () => {
  try {
    const { data, error } = await supabase
      .from("ficha_de_trabajo")
      .select(`
        *,
        cliente ( nombre, apellido )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    
    fichasOriginales.value = data || [];
    fichas.value = [...fichasOriginales.value];

  } catch (error) {
    console.error("Error al obtener fichas de trabajo:", error);
  }
};

const estadosFicha = ref([]);

const obtenerEstadosFicha = async () => {
  try{
    const {data,error} = await supabase
    .from('tabla_estados_ficha')
    .select('*')
    if(error) throw error
    estadosFicha.value = data
  }
  catch(error){
    console.error("Error al obtener estados de ficha:", error);
    estadosFicha.value = []
  }
}

const handleEstados = (estado) => {
  const estadoEncontrado = estadosFicha.value.find(e => e.id === estado);
  if(estadoEncontrado){
    return {
      estado: estadoEncontrado.estado,
      color: estadoEncontrado.color,
      texto: estadoEncontrado.texto
    }
  }
  else{
    return {
      estado: "Desconocido",
      color: "#ffffff",
      texto: "#000000"
    }
  }
}

onMounted(async () => {
  interfaz.showLoading();
  await obtenerFichas();
  await obtenerEstadosFicha();
  interfaz.hideLoading();
});
</script>

<template>
  <div class="servi-white min-h-screen pb-15">
    <navbar
      titulo="ServiML"
      subtitulo="Fichas de Trabajo"
      class="sticky top-0 z-50"
      searchInput="true"
      @buscar="handleBusqueda"
    />
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div class="hidden md:grid md:grid-cols-4 gap-4 mb-8">
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs servi-grey-font uppercase font-bold">Total Fichas</p>
            <p class="text-2xl font-bold servi-grey-font">{{ stats.total }}</p>
        </div>
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs servi-grey-font uppercase font-bold">Ingresadas</p>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.ingresadas }}</p>
        </div>
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs servi-grey-font uppercase font-bold">En Proceso</p>
            <p class="text-2xl font-bold text-blue-600">{{ stats.enProceso }}</p>
        </div>
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs servi-grey-font uppercase font-bold">Terminadas</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.terminadas }}</p>
        </div>
      </div>

      <Transition name="slide-stats">
        <div v-show="showStats" class="md:hidden grid grid-cols-2 gap-3 mb-6">
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs servi-grey-font uppercase font-bold">Total</p>
              <p class="text-xl font-bold servi-grey-font">{{ stats.total }}</p>
          </div>
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs servi-grey-font uppercase font-bold">Ingresadas</p>
              <p class="text-xl font-bold text-yellow-600">{{ stats.ingresadas }}</p>
          </div>
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs servi-grey-font uppercase font-bold">En Proceso</p>
              <p class="text-xl font-bold text-blue-600">{{ stats.enProceso }}</p>
          </div>
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs servi-grey-font uppercase font-bold">Terminadas</p>
              <p class="text-xl font-bold text-green-600">{{ stats.terminadas }}</p>
          </div>
        </div>
      </Transition>

      <div class="flex justify-between items-center mb-6">
        <div>
            <h2 class="text-xl font-bold servi-grey-font">Listado de Fichas</h2>
            <p class="text-sm servi-grey-font">Administra las fichas de trabajo del taller</p>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            @click="irACrear" 
            class="servi-yellow servi-grey-font font-bold py-2 px-6 rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span class="text-xl leading-none mb-1">+</span>
            <span class="hidden sm:inline">Nueva Ficha</span>
          </button>

          <button 
            @click="showStats = !showStats" 
            class="md:hidden servi-adapt-bg servi-grey-font font-bold py-2 px-4 rounded-lg shadow-sm border border-gray-100 hover:opacity-80 transition-all flex items-center gap-2"
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

      <div class="hidden md:block servi-adapt-bg rounded-xl shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="servi-blue servi-yellow-font text-xs uppercase tracking-wider border-b border-gray-100">
              <th class="p-4 font-semibold">Ficha N°</th>
              <th class="p-4 font-semibold">Cliente</th>
              <th class="p-4 font-semibold">Motivo Ingreso</th>
              <th class="p-4 font-semibold text-center">Ingreso</th>
              <th class="p-4 font-semibold text-center">Estado</th>
              <th class="p-4 font-semibold text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in fichas" :key="item.id" 
                class="hover:opacity-80 transition-colors cursor-pointer"
                @click="irADetalle(item.id)">
              <td class="p-4 font-medium servi-grey-font">#{{ item.id }}</td>
              <td class="p-4 servi-grey-font">
                <div class="font-medium" v-if="item.cliente">
                  {{ camelCase(item.cliente.nombre) }} {{ camelCase(item.cliente.apellido) }}
                </div>
                <div v-else class="text-gray-400 italic">Sin cliente</div>
              </td>
              <td class="p-4 servi-grey-font">
                <span class="block max-w-[200px] truncate" :title="item.motivo_ingreso">
                  {{ item.motivo_ingreso || 'Sin descripción' }}
                </span>
              </td>
              <td class="p-4 text-center whitespace-nowrap">
                <span class="servi-grey-font">{{ formatearFecha(item.fecha_ingreso) }}</span>
              </td>
              <td class="p-4 text-center">
                <span class="px-2 py-1 rounded-full text-xs font-semibold" :style="{backgroundColor: handleEstados(item.estado).color, color: 'white'}">
                  {{ handleEstados(item.estado).estado }}
                </span> 
              </td>
              <td class="p-4 text-center">
                <button class="servi-grey-font hover:text-blue-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7-7" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="fichas.length === 0" class="p-10 text-center">
          <div class="servi-grey-font mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="servi-grey-font text-lg">No se encontraron fichas de trabajo</p>
            <p class="text-sm servi-grey-font">Intenta cambiar el filtro de búsqueda.</p>
          </div>
        </div>
      </div>

      <div class="md:hidden grid grid-cols-1">
        <RouterLink 
          v-for="item in fichas" 
          :key="item.id"
          :to="{ name: 'ficha-de-trabajo', params: { id: item.id } }" 
          class="card-container servi-adapt-bg servi-grey-font"
        >
          <div class="card-header servi-grey-font">
            <span class="folio">Ficha #{{ item.id }}</span>
            <span class="px-2 py-1 rounded-full text-xs font-semibold" :style="{backgroundColor: handleEstados(item.estado).color, color: 'white'}">{{ handleEstados(item.estado).estado }}</span>
          </div>
          <div class="card-body servi-grey-font">
            <div class="info-row">
              <span class="label">Ingreso:</span>
              <span class="valor">{{ formatearFecha(item.fecha_ingreso) }}</span>
            </div>
            <div class="info-row" v-if="item.cliente">
              <span class="label">Cliente:</span>
              <span class="valor">{{ camelCase(item.cliente.nombre) + ' ' + camelCase(item.cliente.apellido) }}</span>
            </div>
            <div class="info-row" v-if="item.motivo_ingreso">
              <span class="label">Motivo:</span>
              <span class="valor truncate max-w-[150px]">{{ item.motivo_ingreso }}</span>
            </div>
          </div>
        </RouterLink>
      </div>

      <div v-if="fichas.length === 0" class="servi-adapt-bg rounded-xl p-10 text-center shadow-sm border border-gray-100 md:hidden">
        <div class="servi-grey-font mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="servi-grey-font text-lg">No se encontraron fichas</p>
          <p class="text-sm servi-grey-font">Intenta cambiar el filtro de búsqueda.</p>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Animación stats mobile */
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

/* Cards mobile */
.card-container {
  display: block;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 10px;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 1rem;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.confirmado {
  border-left: 5px solid #1b992a92;
  border-right: 5px solid #1b992a92;
}

.descartado {
  border-left: 5px solid #e74d3cad;
  border-right: 5px solid #e74d3cad;
}

.en-espera {
  border-left: 5px solid #ffc800a5;
  border-right: 5px solid #ffc800a5;
}

.proceso {
  border-left: 5px solid #3498db90;
  border-right: 5px solid #3498db90;
}

.cerrado {
  border-left: 5px solid #52026f;
  border-right: 5px solid #52026f;
}

.card-container:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.folio {
  font-weight: bold;
}

.badge-aprobada {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #36f04c5c;
  border-radius: 4px;
  color: #0f0f0f;
  text-transform: uppercase;
}

.badge-rechazada {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #e74d3ce9;
  color: #ffffff;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-pendiente {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #ffc800a5;
  color: #292929;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-proceso {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #3498db65;
  color: #1a1a1a;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-cerrada {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #52026f;
  color: #ffffff;
  border-radius: 4px;
  text-transform: uppercase;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}
</style>