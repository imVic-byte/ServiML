<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient";
import { useInterfaz } from "@/stores/interfaz";
import listadoFichas from '@/components/fichas/listitadefichas.vue'

const router = useRouter();
const interfaz = useInterfaz();
let searchTimeout = null;

const cotizaciones = ref([]);
const cotizacionesOriginales = ref([]);

const props = defineProps({
  busqueda: {
    type: String,
    default: ''
  }
});

import { watch } from "vue";
watch(() => props.busqueda, (texto) => {
  handleBusqueda(texto);
});

const handleBusqueda = (texto) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (!texto) {
      cotizaciones.value = [...cotizacionesOriginales.value]; 
    } else {
      const textoLower = texto.toLowerCase().trim();
      
      cotizaciones.value = cotizacionesOriginales.value.filter(c => {
        // Nombre directo en la cotización
        const nombreDirecto = `${c.nombre || ''} ${c.apellido || ''}`.toLowerCase();
        // Nombre del cliente desde la ficha de trabajo
        const clienteFicha = c.ficha_de_trabajo?.cliente;
        const nombreCliente = clienteFicha ? `${clienteFicha.nombre || ''} ${clienteFicha.apellido || ''}`.toLowerCase() : '';
        
        const vehiculosArray = obtenerVehiculos(c);
        const patenteCoincide = vehiculosArray.some(v => v.patente?.toLowerCase().includes(textoLower));
        const diagnostico = c.diagnostico?.toLowerCase() || '';
        
        return nombreDirecto.includes(textoLower) || 
               nombreCliente.includes(textoLower) ||
               patenteCoincide ||
               diagnostico.includes(textoLower);
      });
    }
  }, 300);
};

const abrirListadoFichas=ref(false)

const handleListadoFichas=()=>{
    abrirListadoFichas.value = !abrirListadoFichas.value
}

const irACrear = () => {
  abrirListadoFichas.value=true
};

const irADetalle = (cotizacion) => {
  router.push({ name: "ver-cotizacion-ficha-de-trabajo", params: {id:cotizacion.ficha_de_trabajo.id, cotizacion_id: cotizacion.id } });
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

const obtenerVehiculos = (c) => {
  let listaVehiculos = [];
  
  if (c.vehiculo) {
    listaVehiculos.push(c.vehiculo);
  }
  
  if (c.ficha_de_trabajo && c.ficha_de_trabajo.orden_trabajo) {
    c.ficha_de_trabajo.orden_trabajo.forEach(ot => {
      if (ot.vehiculo) {
        if (!listaVehiculos.some(v => v.id === ot.vehiculo.id)) {
          listaVehiculos.push(ot.vehiculo);
        }
      }
    });
  }

  if (listaVehiculos.length === 0 && c.ficha_de_trabajo && c.ficha_de_trabajo.vehiculo) {
    listaVehiculos.push(c.ficha_de_trabajo.vehiculo);
  }

  return listaVehiculos;
};

const stats = computed(() => {
  const total = cotizacionesOriginales.value.length;
  const pendientes = cotizacionesOriginales.value.filter(c => c.estado === 1).length;
  const aprobadas = cotizacionesOriginales.value.filter(c => c.estado === 2).length;
  const montoTotal = cotizacionesOriginales.value
    .filter(c => c.estado === 2)
    .reduce((acc, c) => acc + (c.total_final || 0), 0);
  return { total, pendientes, aprobadas, montoTotal };
});

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
    const {data,error} = await supabase
      .from("cotizaciones_ficha")
      .select(`
        *,
        ficha_de_trabajo (
          id,motivo_ingreso,
          cliente(nombre,apellido),
          orden_trabajo(vehiculo(id, marca, modelo, patente))
        )
      `) 
      .order('id', { ascending: false });
      
    if(error) throw error;
    
    cotizaciones.value = data;
    cotizacionesOriginales.value = data;
  } catch (error) {
    console.error("Error al obtener cotizaciones:", error);
  }
};
const loading = ref(false)

onMounted( async () => {
    loading.value = true
  await obtenerCotizaciones();
  loading.value = false
});

</script>

<template>
  <div>
    <!-- Stats Desktop -->
    <div class="hidden md:grid md:grid-cols-4 gap-4 mb-8">
      <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
          <p class="text-xs servi-grey-font uppercase font-bold">Total</p>
          <p class="text-2xl font-bold servi-grey-font">{{ stats.total }}</p>
      </div>
      <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
          <p class="text-xs servi-grey-font uppercase font-bold">Pendientes</p>
          <p class="text-2xl font-bold text-yellow-600">{{ stats.pendientes }}</p>
      </div>
      <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
          <p class="text-xs servi-grey-font uppercase font-bold">Aprobadas</p>
          <p class="text-2xl font-bold text-green-600">{{ stats.aprobadas }}</p>
      </div>
      <div class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100">
          <p class="text-xs servi-grey-font uppercase font-bold">Monto Total</p>
          <p class="text-lg font-bold servi-grey-font">{{ formatearDinero(stats.montoTotal) }}</p>
      </div>
    </div>

    <!-- Stats Mobile -->
    <div class="md:hidden grid grid-cols-2 gap-3 mb-6">
      <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
          <p class="text-xs servi-grey-font uppercase font-bold">Total</p>
          <p class="text-xl font-bold servi-grey-font">{{ stats.total }}</p>
      </div>
      <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
          <p class="text-xs servi-grey-font uppercase font-bold">Pendientes</p>
          <p class="text-xl font-bold text-yellow-600">{{ stats.pendientes }}</p>
      </div>
      <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
          <p class="text-xs servi-grey-font uppercase font-bold">Aprobadas</p>
          <p class="text-xl font-bold text-green-600">{{ stats.aprobadas }}</p>
      </div>
      <div class="servi-adapt-bg p-3 rounded-xl shadow-sm border border-gray-100">
          <p class="text-xs servi-grey-font uppercase font-bold">Monto Total</p>
          <p class="text-lg font-bold servi-grey-font">{{ formatearDinero(stats.montoTotal) }}</p>
      </div>
    </div>

    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
          <h2 class="text-xl font-bold servi-grey-font">Listado de Cotizaciones Iniciales</h2>
          <p class="text-sm servi-grey-font">Administra y revisa el estado de tus cotizaciones Iniciales</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="irACrear" 
          class="servi-yellow servi-grey-font font-bold py-2 px-6 rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
        >
          <span class="text-xl leading-none mb-1">+</span>
          <span class="hidden sm:inline">Nueva Cotización</span>
        </button>
      </div>
    </div>
    <div v-if="loading" class="flex justify-center items-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
    </div>
    <!-- Tabla Desktop -->
    <div v-if="!loading" class="hidden md:block servi-adapt-bg rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="servi-blue servi-yellow-font text-xs uppercase tracking-wider border-b border-gray-100">
            <th class="p-4 font-semibold">N°</th>
            <th class="p-4 font-semibold">Cliente</th>
            <th class="p-4 font-semibold">Vehículo</th>
            <th class="p-4 font-semibold">Comentario</th>
            <th class="p-4 font-semibold text-center">Emisión</th>
            <th class="p-4 font-semibold text-right">Monto Total</th>
            <th class="p-4 font-semibold text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cotizaciones" :key="item.id" 
              class="hover:opacity-80 transition-colors cursor-pointer"
              @click="irADetalle(item)">
            <td class="p-4 servi-grey-font">
              <div class="font-medium">{{ item.id }}</div>
            </td>
            <td class="p-4 servi-grey-font">
                <div class="font-medium">{{ camelCase(item.ficha_de_trabajo.cliente.nombre) }} {{ camelCase(item.ficha_de_trabajo.cliente.apellido) }}</div>
            </td>
            <td class="p-4 servi-grey-font">
              <div v-if="obtenerVehiculos(item).length > 0">
              <div v-for="(veh, index) in obtenerVehiculos(item)" :key="veh.id" class="mb-2">
                <div class="font-medium">{{ camelCase(veh.marca) }} {{ camelCase(veh.modelo) }}</div>
                <div class="text-xs text-gray-500 uppercase font-bold">{{ veh.patente }}</div>
              </div>
               </div>
              <div v-else class="text-gray-400 italic text-sm">Sin vehículo</div>
            </td>
            <td class="p-4 servi-grey-font">
              <span class="block max-w-[200px] truncate" :title="item.comentario">{{ item.comentario || 'No registrado' }}</span>
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
    <div v-if="!loading" class="md:hidden grid grid-cols-1">
      <div 
        v-for="item in cotizaciones" 
        :key="item.id"
        @click="irADetalle(item)"
        class="card-container servi-adapt-bg servi-grey-font"
        :class="claseEstadoCard(item.estado).contenedor"
      >
      <div class="card-header servi-grey-font flex justify-between pb-4">
        <span class="label">Cotización #{{ item.id }}</span>
        <span class="badge">{{ claseEstadoCard(item.estado).texto }}</span>
      </div>
        <div class="card-body servi-grey-font">
          <div class="info-row">
            <span class="label">Emisión:</span>
            <span class="valor">{{ formatearFecha(item.created_at) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Cliente:</span>
            <span class="valor">{{ camelCase(item.nombre) + ' ' + camelCase(item.apellido) }}</span>
          </div>
          <div class="info-row items-start" v-if="obtenerVehiculos(item).length > 0">
            <span class="label mt-1">Vehículo(s):</span>
            <span class="valor text-right">
              <div v-for="veh in obtenerVehiculos(item)" :key="veh.id" class="mb-2 last:mb-0">
                <div class="font-medium">{{ camelCase(veh.marca) }} {{ camelCase(veh.modelo) }}</div>
                <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{{ veh.patente }}</div>
              </div>
            </span>
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
      </div>
    </div>

    <listadoFichas v-if="abrirListadoFichas" @cerrar="handleListadoFichas()" />

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
</template>

<style scoped>
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
</style>
