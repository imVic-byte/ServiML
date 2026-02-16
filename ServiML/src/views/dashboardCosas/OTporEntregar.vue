<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../../lib/supabaseClient.js";
import ordenTrabajoCard from "../../components/ordenTrabajo/ordendetrabajoCard.vue";
import ordentrabajoListado from '../../components/ordenTrabajo/ordentrabajoListado.vue';
import navbar from "../../components/componentes/navbar.vue";
import { useInterfaz } from '../../stores/interfaz.js'

const ordenes = ref([]);
const uiStore = useInterfaz()
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
    .in('estado_actual_id', [6,9])
    .order("id", { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    console.log(data)
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
      subtitulo="OT Por Entregar"
      class="sticky top-0 z-50"
    />
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-bold servi-blue-font">OT Por Entregar</h2>
          <p class="text-sm text-gray-500">Órdenes de trabajo listas para entregar al cliente</p>
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
        <div v-if="ordenes.length === 0" class="servi-adapt-bg rounded-xl p-10 text-center shadow-sm border border-gray-100">
        <div class="text-gray-400 mb-2">
          <p class="text-gray-500 text-lg">No hay órdenes por entregar</p>
          <p class="text-sm text-gray-400">Todas las órdenes han sido entregadas.</p>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      </div>

      

    </div>
  </div>
</template>