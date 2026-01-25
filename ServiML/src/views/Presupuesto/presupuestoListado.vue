<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import presupuestoCard from "../../components/presupuesto/presupuestoCard.vue";

import navbar from "../../components/componentes/navbar.vue";
import cargando from "../../components/componentes/cargando.vue";
const router = useRouter();
const servicios = ref([]);
const loading = ref(true);

const obtenerPresupuestos = async () => {
  const { data } = await supabase
    .from("presupuesto")
    .select("*, vehiculo(*)")
    .order("numero_folio", { ascending: false });

  if (data) {
    servicios.value = data;
  }
  loading.value = false;
};

const irACrear = () => {
  router.push({ name: "nuevo-presupuesto" });
};

onMounted(() => {
  obtenerPresupuestos();
});
</script>

<template>
  <cargando v-if="loading"></cargando>
  <div v-else>
    <navbar
      titulo="ServiML"
      subtitulo="Presupuestos"
      class="navbar"
      searchInput="true"
    />
    <div class="contenedor">
      <div class="header-acciones flex justify-between items-center my-2 px-2">
        <h2 class="text-xl font-bold servi-blue-font">Presupuestos</h2>
        <button @click="irACrear" class="servi-yellow font-bold servi-blue-font p-2 sm:px-10 sm:py-4 rounded-full flex items-center justify-center transition-all hover:scale-105">
          <span class="md:hidden text-xl px-2">+</span>
          <span class="hidden md:inline">Nuevo Presupuesto</span>
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-1">
        <presupuestoCard
          v-for="item in servicios"
          :key="item.id"
          :data="item"
        />
      </div>
    </div>
  </div>
</template>
<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
}
</style>