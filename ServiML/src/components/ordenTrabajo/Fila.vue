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
})

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

const irADetalle = (id) => {
    router.push({ name: "ver-orden-de-trabajo", params: { id } });
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
    <tr class="hover:opacity-80 transition-colors cursor-pointer" @click="irADetalle(orden.id)">
        <td class="p-4 font-medium servi-white-font">#{{ orden.id }}</td>
        <td class="p-4 servi-white-font">
            <span class="servi-adapt-bg servi-white-font px-2 py-1 rounded text-xs font-bold uppercase">
                {{ orden.vehiculo?.patente }}
            </span>
            <div class="text-xs servi-grey-font mt-1">{{ orden.vehiculo?.marca }} {{ orden.vehiculo?.modelo }}</div>
        </td>
        <td class="p-4 servi-white-font">
            <span class="servi-adapt-bg servi-white-font px-2 py-1 rounded text-xs font-bold block max-w-[200px] truncate">
                {{ orden.presupuesto?.diagnostico }}
            </span>
        </td>
        <td class="p-4 text-center whitespace-nowrap">
            <span class="servi-grey-font">{{ formatearFecha(orden.fecha_ingreso) }}</span>
        </td>
        <td class="p-4 text-center">
            <span class="px-3 py-1 rounded-full text-xs font-medium"
                :style="{ backgroundColor: estado.color}"
                :class="!estado.texto ? 'text-black' : 'text-white'">
                {{ estado.estado }}
            </span>
        </td>
        <td class="p-4 text-center" @click.stop>
            <span v-if="orden.id_empleado" class="servi-grey-font">{{ orden.trabajadores?.nombre }}</span>
            <button v-if="!empleadoAsignado" @click="abrirModalAsignar" class="mt-2 flex rounded-lg servi-yellow servi-grey-font justify-center items-center px-3 py-2 w-full mx-auto transition-colors hover:bg-yellow-400 cursor-pointer">
                <span class="font-bold text-sm mr-2">Asignar Técnico</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
      </svg>
            </button>
        </td>
        <td class="p-4 text-center">
            <button class="servi-grey-font hover:text-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </td>
    </tr>
    <div v-if="modalAsignar" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="servi-white servi-grey-font rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
      
      <div class="px-6 py-4">
        <h2 class="text-lg font-bold servi-grey-font">Asignar Responsable</h2>
        <p class="text-sm servi-grey-font">OT #{{ orden.presupuesto?.numero_folio }} - {{ orden.vehiculo?.patente }}</p>
      </div>

      <div class="p-6">
        <label class="block text-sm font-medium mb-2">Seleccione un técnico</label>
        <select v-model="empleadoSeleccionado" class="w-full rounded-lg px-3 py-2.5 servi-blue servi-white-font font-bold">
          <option value="" disabled>-- Seleccionar --</option>
          <option v-for="emple in empleados" :key="emple.id" :value="emple.id">
            {{ emple.nombre }} {{ emple.apellido }}
          </option>
        </select>
      </div>

      <div class="px-6 py-4 flex justify-end gap-3">
        <button @click="modalAsignar = false" class="px-4 py-2 text-sm font-medium servi-grey-font rounded-lg cursor-pointer">
          Cancelar
        </button>
        <button 
          @click="asignarOrden" 
          :disabled="!empleadoSeleccionado || cargando"
          class="px-4 py-2 text-s servi-blue servi-white-font rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          <span v-if="cargando">Guardando...</span>
          <span v-else>Confirmar</span>
        </button>
      </div>
    </div>
  </div>
</template>