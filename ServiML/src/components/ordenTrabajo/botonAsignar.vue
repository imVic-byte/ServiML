<script setup>
import { ref } from 'vue';
import { supabase } from '../../lib/supabaseClient.js';

const props = defineProps({
    orden: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['asignacion-exitosa', 'empleadoSeleccionado'])

const modalAsignar = ref(false)
const empleados = ref([])
const empleadoSeleccionado = ref(null)

const obtenerEmpleados = async () => {
    const { data } = await supabase.from('trabajadores').select('*').eq('activo', true);
    if (data) empleados.value = data;
    else console.error('Error al obtener empleados');
}

const abrirModal = async () =>{
    empleadoSeleccionado.value = null;
    modalAsignar.value = true;
    await obtenerEmpleados();
}

const asignarOrden = async () => {
    if (!empleadoSeleccionado.value) return;
    const { error } = await supabase.from('orden_trabajo').update({ id_empleado: empleadoSeleccionado.value.id }).eq('id', props.orden.id);
    if (error) {
        console.error(error);
    } else {
        modalAsignar.value = false;
        emit('empleadoSeleccionado', empleadoSeleccionado.value);
    }
    const { error:error2 } = await supabase
        .from('OT_bitacora')
        .insert({
            ot_id: props.orden.id,
            nuevo_estado_id: 10,
            tipo_evento: 'Orden asignada a técnico',
        })
    if (error2) console.error(error2);
    else {
        modalAsignar.value = false;
    }
}

</script>
<template>
    <button @click.stop="abrirModal" class="mt-2 flex rounded-lg servi-yellow servi-grey-font justify-center items-center px-3 py-2 w-full mx-auto transition-colors hover:bg-yellow-400">
        <span class="font-bold text-sm mr-2">Asignar Técnico</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
    </button>
</template>