<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../../lib/supabaseClient.js";
import ordenTrabajoCard from "../../components/ordenTrabajo/ordendetrabajoCard.vue";
import navbar from "../../components/componentes/navbar.vue";
import cargando from "../../components/componentes/cargando.vue";
const ordenes = ref([]);
const loading = ref(true);
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
    .eq('estado_actual_id', 6)
    .order("id", { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    ordenes.value = data;
  }
  loading.value = false;
};

onMounted(async () => {
  await obtenerEstados();
  await obtenerOrdenes();
});
</script>

<template>
  <cargando v-if="loading"></cargando>
  <div v-else>
    <navbar
      titulo="ServiML"
      subtitulo="OT Por Entregar"
      class="navbar"
      searchInput="true"
    />
    <div class="contenedor pb-20">
      <div class="header-acciones flex justify-between items-center my-2 px-2">
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-1">
        <ordenTrabajoCard
          v-for="item in ordenes"
          :key="item.id"
          :orden="item"
          :estado="handleEstados(item.estado_actual_id)"
          @asignacion-exitosa="obtenerOrdenes"
        />
      </div>
    </div>
  </div>
</template>
<style scoped>
.navbar {
  position: sticky;
  top: 0;
}
</style>