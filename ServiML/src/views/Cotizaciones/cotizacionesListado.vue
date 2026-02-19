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

const cotizaciones = ref([]);

const handleBusqueda = (texto) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (!texto) {
      cotizaciones.value = [...cotizaciones.value];
    } else {
      cotizaciones.value = cotizaciones.value.filter(c =>
        c.vehiculo?.patente?.toLowerCase().includes(texto.toLowerCase()) ||
        c.cliente?.nombre?.toLowerCase().includes(texto.toLowerCase()) ||
        c.cliente?.apellido?.toLowerCase().includes(texto.toLowerCase())
      );
    }
  }, 300);
};

const irACrear = () => {
  router.push({ name: "crear-cotizacion" });
};

const irADetalle = (id) => {
  router.push({ name: "ver-cotizacion", params: { id } });
};

const formatearDinero = (monto) => {
  if (!monto) return "$0";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(monto);
};

const camelCase = (texto) => {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

const formatearFecha = (fechaString) => {
  if (!fechaString) return "---";
  const fecha = new Date(fechaString);
  return fecha.toLocaleDateString("es-CL", { year: "numeric", month: "numeric", day: "numeric" });
};

const stats = computed(() => {
  const total = cotizaciones.value.length;
  const pendientes = cotizaciones.value.filter(c => c.estado === 1).length;
  const aprobadas = cotizaciones.value.filter(c => c.estado === 2).length;
  const montoTotal = cotizaciones.value
    .filter(c => c.estado === 2)
    .reduce((acc, c) => acc + (c.total_final || 0), 0);
  return { total, pendientes, aprobadas, montoTotal };
});

const claseEstado = (estado) => {
  switch (estado) {
    case 2: return { clase: "bg-green-100 text-green-800 border-green-200", texto: "Aprobada" };
    case 3: return { clase: "bg-red-100 text-red-800 border-red-200", texto: "Rechazada" };
    case 1: return { clase: "bg-yellow-100 text-yellow-800 border-yellow-200", texto: "Pendiente" };
    default: return { clase: "servi-adapt-bg servi-white-font border-gray-100", texto: "Cerrada" };
  }
};

const claseEstadoCard = (estado) => {
  switch (estado) {
    case 2: return { clase: "badge-aprobada", texto: "Aprobada", contenedor: "confirmado" };
    case 3: return { clase: "badge-rechazada", texto: "Rechazada", contenedor: "descartado" };
    case 1: return { clase: "badge-pendiente", texto: "Pendiente", contenedor: "en-espera" };
    default: return { clase: "badge-cerrada", texto: "Cerrada", contenedor: "cerrado" };
  }
};

const obtenerCotizaciones = async () => {
  try {
    const {data,error} = await supabase.from("cotizacion").select("*").order('id', { ascending: false });
    if(error){
      throw error;
    }
    cotizaciones.value = data;
  } catch (error) {
    console.error("Error al obtener cotizaciones:", error);
  }
};

onMounted( async () => {
  interfaz.showLoading();
  await obtenerCotizaciones();
  interfaz.hideLoading();
});

</script>

<template>
  <div class="servi-white min-h-screen pb-15">
    <navbar
      titulo="ServiML"
      subtitulo="Gestión de Cotizaciones"
      class="sticky top-0 z-50"
      searchInput="true"
      @buscar="handleBusqueda"
    />
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- Stats Desktop -->
      <div class="hidden md:grid md:grid-cols-4 gap-4 mb-8">
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs servi-grey-font uppercase font-bold">Total / mes</p>
            <p class="text-2xl font-bold servi-grey-font">{{ stats.total }}</p>
        </div>
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs servi-grey-font uppercase font-bold">Pendientes / mes</p>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.pendientes }}</p>
        </div>
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs servi-grey-font uppercase font-bold">Aprobadas / mes</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.aprobadas }}</p>
        </div>
        <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
            <p class="text-xs servi-grey-font uppercase font-bold">Monto Total / mes</p>
            <p class="text-lg font-bold servi-grey-font">{{ formatearDinero(stats.montoTotal) }}</p>
        </div>
      </div>

      <!-- Stats Mobile -->
      <Transition name="slide-stats">
        <div v-show="showStats" class="md:hidden grid grid-cols-2 gap-3 mb-6">
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs servi-grey-font uppercase font-bold">Total / mes</p>
              <p class="text-xl font-bold servi-grey-font">{{ stats.total }}</p>
          </div>
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs servi-grey-font uppercase font-bold">Pendientes / mes</p>
              <p class="text-xl font-bold text-yellow-600">{{ stats.pendientes }}</p>
          </div>
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs servi-grey-font uppercase font-bold">Aprobadas / mes</p>
              <p class="text-xl font-bold text-green-600">{{ stats.aprobadas }}</p>
          </div>
          <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
              <p class="text-xs servi-grey-font uppercase font-bold">Monto Total / mes</p>
              <p class="text-lg font-bold servi-grey-font">{{ formatearDinero(stats.montoTotal) }}</p>
          </div>
        </div>
      </Transition>

      <!-- Header con botones -->
      <div class="flex justify-between items-center mb-6">
        <div>
            <h2 class="text-xl font-bold servi-grey-font">Listado de Cotizaciones</h2>
            <p class="text-sm servi-grey-font">Administra y revisa el estado de tus cotizaciones</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Botón toggle stats mobile -->
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
          
          <!-- Botón nueva cotización -->
          <button 
            @click="irACrear" 
            class="servi-yellow servi-grey-font font-bold py-2 px-6 rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span class="text-xl leading-none mb-1">+</span>
            <span class="hidden sm:inline">Nueva Cotización</span>
          </button>
        </div>
      </div>

      <!-- Tabla Desktop -->
      <div class="hidden md:block servi-adapt-bg rounded-xl shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="servi-blue servi-yellow-font text-xs uppercase tracking-wider border-b border-gray-100">
              <th class="p-4 font-semibold">Número</th>
              <th class="p-4 font-semibold">Cliente</th>
              <th class="p-4 font-semibold">Diagnostico</th>
              <th class="p-4 font-semibold text-center">Emisión</th>
              <th class="p-4 font-semibold text-right">Monto Total</th>
              <th class="p-4 font-semibold text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in cotizaciones" :key="item.id" 
                class="hover:opacity-80 transition-colors cursor-pointer"
                @click="irADetalle(item.id)">
              <td class="p-4 font-medium servi-grey-font">#{{ item.id }}</td>
              <td class="p-4 servi-grey-font">
                <div class="font-medium">{{ camelCase(item.nombre) }} {{ camelCase(item.apellido) }}</div>
              </td>
              <td class="p-4 servi-grey-font">
                <span class="block max-w-[200px] truncate" :title="item.diagnostico">{{ camelCase(item.diagnostico) }}</span>
              </td>
              <td class="p-4 text-center whitespace-nowrap">
                <span class="servi-grey-font">{{ formatearFecha(item.created_at) }}</span>
              </td>
              <td class="p-4 text-right font-bold servi-grey-font">
                {{ formatearDinero(item.total_final) }}
              </td>
              <td class="p-4 text-center">
                <button class="servi-grey-font hover:text-blue-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Empty state tabla -->
        <div v-if="cotizaciones.length === 0" class="p-10 text-center">
          <div class="servi-grey-font mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="servi-grey-font text-lg">No se encontraron cotizaciones</p>
            <p class="text-sm servi-grey-font">Intenta cambiar el filtro de búsqueda o crea una nueva.</p>
          </div>
        </div>
      </div>

      <!-- Cards Mobile -->
      <div class="md:hidden grid grid-cols-1">
        <RouterLink 
          v-for="item in cotizaciones" 
          :key="item.id"
          :to="{ name: 'ver-cotizacion', params: { id: item.id } }" 
          class="card-container servi-adapt-bg servi-grey-font"
          :class="claseEstadoCard(item.estado).contenedor"
        >
          <div class="card-header servi-grey-font">
            <span class="folio">#{{ item.id }}</span>
          </div>
          <div class="card-body servi-grey-font">
            <div class="info-row">
              <span class="label">Emisión:</span>
              <span class="valor">{{ formatearFecha(item.created_at) }}</span>
            </div>
            <div class="info-row" v-if="item.cliente">
              <span class="label">Cliente:</span>
              <span class="valor">{{ camelCase(item.nombre) + ' ' + camelCase(item.apellido) }}</span>
            </div>
            <div class="info-row" v-if="item.diagnostico">
              <span class="label">Descripción:</span>
              <span class="valor truncate">{{ item.diagnostico }}</span>
            </div>
            <div class="divider"></div>
            <div class="totales">
              <div class="total-row">
                <span>Subtotal</span>
                <span>{{ formatearDinero(item.subtotal) }}</span>
              </div>
              <div class="total-row">
                <span>IVA</span>
                <span>{{ formatearDinero(item.iva) }}</span>
              </div>
              <div class="total-row final">
                <span>Total</span>
                <span class="precio-grande">{{ formatearDinero(item.total_final) }}</span>
              </div>
            </div>
          </div>
        </RouterLink>
      </div>

      <!-- Empty state mobile -->
      <div v-if="cotizaciones.length === 0" class="servi-adapt-bg rounded-xl p-10 text-center shadow-sm border border-gray-100 md:hidden">
        <div class="servi-grey-font mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="servi-grey-font text-lg">No se encontraron cotizaciones</p>
          <p class="text-sm servi-grey-font">Intenta cambiar el filtro de búsqueda o crea una nueva.</p>
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
}

.divider {
  height: 1px;
  background-color: #eee;
  margin: 0.3rem 0;
}

.total-row {
  display: flex;
  justify-content: space-between;
}

.total-row.final {
  font-weight: bold;
  font-size: 1rem;
}

.card-footer {
  text-align: right;
  font-size: 0.8rem;
}
</style>
