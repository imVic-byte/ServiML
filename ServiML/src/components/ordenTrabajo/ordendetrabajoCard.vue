<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../../lib/supabaseClient.js';

const router = useRouter();
const empleados = ref([]);
const modalAsignar = ref(false);
const empleadoSeleccionado = ref('');
const cargando = ref(false);

const props = defineProps({
  orden: {
    type: Object,
    required: true
  },
  estado: {
    type: Object,
    required: true
  }
});

const empleadoAsignado = ref(props.orden.id_empleado);
const emit = defineEmits(['asignacion-exitosa']);

const traerEmpleados = async () => {
  const { data, error } = await supabase
    .from('trabajadores')
    .select('*')
    .eq('activo', true);
  if (data) {
    empleados.value = data;
  }
  if (error) {
    console.error('Error al obtener empleados:', error);
    alert('Error al obtener empleados');
  }
}

const abrirModalAsignar = async () => {
  empleadoSeleccionado.value = '';
  await traerEmpleados();
  modalAsignar.value = true;
}

const asignarOrden = async () => {
  if (!empleadoSeleccionado.value) return;

  cargando.value = true;
  
  const { error } = await supabase
    .from('orden_trabajo')
    .update({ 
      id_empleado: empleadoSeleccionado.value,
    })
    .eq('id', props.orden.id);
  
  const { error2 } = await supabase
    .from('OT_bitacora')
    .insert({
      ot_id: props.orden.id,
      nuevo_estado_id:10,
      tipo_evento: 'Orden asignada a técnico'
    })
  empleadoAsignado.value = empleadoSeleccionado.value;
  cargando.value = false;

  if (error) {
    console.error('Error al asignar:', error);
    alert('Error al asignar la orden');
  } else {
    modalAsignar.value = false;
    emit('asignacion-exitosa');
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
</script>
<template>
  <div :class="estado.estado + ' border-t-10'" :style="{ borderTopColor: estado.color }" class="servi-adapt-bg servi-blue-font mx-2 card-shadow p-3 mb-3 flex flex-col gap-2 overflow-hidden transition-all hover:shadow-md">
    
    <div class="flex justify-between items-start border-b border-gray-800 pb-2">
      <div class="flex flex-col">
        <span class="font-bold servi-grey-font text-xl">#{{ orden.id || '---' }}</span>
      </div>
      <span :style="{ backgroundColor: estado.color, color: estado.texto }" class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-sm">
        {{ estado.estado }}
      </span>
    </div>

    <div class="flex flex-col gap-1 text-sm">
      <div class="flex justify-between items-center">
        <span class="servi-grey-font">Cliente:</span>
        <span class="font-semibold servi-grey-font text-right truncate w-40">{{ orden.cliente?.nombre || 'Sin Cliente' }}</span>
      </div>
      
      <div class="flex justify-between items-center">
        <span class="servi-grey-font">Vehículo:</span>
        <div class="text-right">
          <span class="font-bold block servi-grey-font text-base">{{ orden.vehiculo?.patente || 'S/P' }}</span>
        </div>
      </div>
      
      <div class="mt-2 servi-adapt-bg p-2 rounded text-xs servi-grey-font italic line-clamp-2">
        "{{ orden.motivo_ingreso }}"
      </div>
      <div class="info-row" v-if="orden.fecha_ingreso">
        <span class="label servi-grey-font">Fecha Ingreso: </span>
        <span class="valor servi-grey-font"> {{ formatearFecha(orden.fecha_ingreso) }}</span>
      </div>
    </div>

    <div class="flex mt-2 pt-2 border-t border-gray-800 items-center justify-between">
      
      <RouterLink :to="{ name: 'ver-orden-de-trabajo', params: { id: orden.id } }" class="servi-blue servi-white-font p-2 rounded-lg w-full text-center transition-transform hover:scale-110 shadow-sm">
        <span class="servi-white-font text-sm">Ver Detalles</span>
      </RouterLink>
    </div>

    <button v-if="!empleadoAsignado" @click="abrirModalAsignar" class="mt-2 flex rounded-lg servi-yellow servi-blue-font justify-center items-center px-3 py-2 w-full mx-auto transition-colors hover:bg-yellow-400">
      <span class="font-bold text-sm mr-2">Asignar Técnico</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
      </svg>
    </button>
  </div>

  <div v-if="modalAsignar" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="servi-blue servi-yellow-font rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
      
      <div class="px-6 py-4">
        <h2 class="text-lg font-bold servi-yellow-font">Asignar Responsable</h2>
        <p class="text-sm servi-white-font">OT #{{ orden.presupuesto?.numero_folio }} - {{ orden.vehiculo?.patente }}</p>
      </div>

      <div class="p-6">
        <label class="block text-sm font-medium mb-2">Seleccione un técnico</label>
        <select v-model="empleadoSeleccionado" class="w-full rounded-lg px-3 py-2.5 servi-yellow servi-blue-font font-bold">
          <option value="" disabled>-- Seleccionar --</option>
          <option v-for="emple in empleados" :key="emple.id" :value="emple.id">
            {{ emple.nombre }} {{ emple.apellido }}
          </option>
        </select>
      </div>

      <div class="px-6 py-4 flex justify-end gap-3">
        <button @click="modalAsignar = false" class="px-4 py-2 text-sm font-medium servi-yellow servi-blue-font rounded-lg">
          Cancelar
        </button>
        <button 
          @click="asignarOrden" 
          :disabled="!empleadoSeleccionado || cargando"
          class="px-4 py-2 text-s servi-yellow servi-blue-font rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span v-if="cargando">Guardando...</span>
          <span v-else>Confirmar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-shadow {
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>