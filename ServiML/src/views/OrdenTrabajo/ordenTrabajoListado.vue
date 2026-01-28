<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import ordenTrabajoCard from "../../components/ordenTrabajo/ordendetrabajoCard.vue";
import navbar from "../../components/componentes/navbar.vue";
import cargando from "../../components/componentes/cargando.vue";
const router = useRouter();
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
    .select("*,presupuesto(*),vehiculo(*),cliente(*)")
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

const irACrear = () => {
  router.push({ name: "nueva-orden-de-trabajo" });
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
      subtitulo="Ordenes de Trabajo"
      class="navbar"
      searchInput="true"
    />
    <div class="contenedor">
      <div class="header-acciones flex justify-between items-center my-2 px-2">
        <h2 class="text-xl font-bold servi-blue-font">Ordenes de Trabajo</h2>
        <button
          @click="irACrear"
          class="servi-yellow font-bold servi-blue-font p-2 sm:px-10 sm:py-4 rounded-full flex items-center justify-center transition-all hover:scale-105"
        >
          <span class="md:hidden text-xl px-2">+</span>
          <span class="hidden md:inline">Nueva Orden de Trabajo</span>
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-1">
        <ordenTrabajoCard
          v-for="item in ordenes"
          :key="item.id"
          :orden="item"
          :estado="handleEstados(item.estado_actual_id)"
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