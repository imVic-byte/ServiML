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
let searchTimeout = null;

const handleBusqueda = (texto) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    obtenerPresupuestos(texto);
  }, 500);
};

const obtenerPresupuestos = async (busqueda = '') => {
  loading.value = true;
  let query = supabase.from("presupuesto");

  if (busqueda) {
    query = query
      .select("*, vehiculo!inner(*)")
      .ilike('vehiculo.patente', `%${busqueda}%`);
  } else {
    query = query.select("*, vehiculo(*)");
  }

  query = query.order("numero_folio", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error(error);
  } else if (data) {
    servicios.value = data;
  }
  loading.value = false;
};

const irACrear = () => {
  router.push({ name: "nuevo-presupuesto" });
};

onMounted(async () => {
  await obtenerPresupuestos();
});
</script>

<template>
  <div class="contenedor-principal">
    <navbar
      titulo="ServiML"
      subtitulo="Presupuestos"
      class="navbar"
      searchInput="true"
      @buscar="handleBusqueda"
    />
    
    <cargando v-if="loading && servicios.length === 0"></cargando>
    
    <div v-else class="contenedor pb-20">
      <div class="header-acciones flex justify-between items-center my-2 px-2">
        <h2 class="text-xl font-bold servi-blue-font">Presupuestos</h2>
        <button 
          @click="irACrear" 
          class="servi-yellow font-bold servi-blue-font p-2 sm:px-10 sm:py-4 rounded-full flex items-center justify-center transition-all hover:scale-105"
        >
          <span class="md:hidden text-xl px-2">+</span>
          <span class="hidden md:inline">Nuevo Presupuesto</span>
        </button>
      </div>

      <div v-if="servicios.length === 0" class="text-center py-10 text-gray-500">
        <p>No se encontraron presupuestos.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-1">
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
  z-index: 50;
}
</style>