<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import ordenTrabajoCard from "../../components/ordenTrabajo/ordendetrabajoCard.vue";
import navbar from "../../components/componentes/navbar.vue";
import { useInterfaz } from '../../stores/interfaz.js'
import ordentrabajoListado from '../../components/ordenTrabajo/ordentrabajoListado.vue'

const uiStore = useInterfaz()
const router = useRouter();
const ordenes = ref([]);
const estados = ref([]);

const obtenerEstados = async () => {
  const { data } = await supabase.from('tabla_estados').select('*');
  estados.value = data;
}

const handleEstados = (id) => {
  const estado = estados.value.find((estado) => estado.id === id);
  return estado
} 

const obtenerOrdenes = async () => {
  const { data, error } = await supabase
    .from("orden_trabajo")
    .select("*,vehiculo(*),cliente(*),presupuesto(*)")
    .is('id_empleado', null)
    .order("id", { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    ordenes.value = data;
  }
  uiStore.hideLoading()
};

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
      subtitulo="OT Sin Asignar"
      class="sticky top-0 z-50"
    />
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <div class="flex justify-between items-center mb-6">
        <div class="block">
            <h2 class="text-xl font-bold servi-blue-font">OT Sin Asignar</h2>
            <p class="text-sm text-gray-500">Órdenes de trabajo pendientes de asignación</p>
        </div>
      </div>

      <ordentrabajoListado :ordenes="ordenes" :estados="estados" @actualizar="obtenerOrdenes()" />

      <div class="md:hidden grid grid-cols-1">
        <ordenTrabajoCard
          v-for="item in ordenes"
          :key="item.id"
          :orden="item"
          :estado="handleEstados(item.estado_actual_id)"
          @asignacion-exitosa="obtenerOrdenes"
        />
      </div>

      <div v-if="ordenes.length === 0" class="bg-white rounded-xl p-10 text-center shadow-sm border border-gray-100">
        <div class="text-gray-400 mb-2">
          <p class="text-gray-500 text-lg">No se encontraron órdenes sin asignar</p>
          <p class="text-sm text-gray-400">Todas las órdenes tienen un técnico asignado.</p>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

    </div>
  </div>
</template>