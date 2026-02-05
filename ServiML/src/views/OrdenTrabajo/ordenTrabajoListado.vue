<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import ordenTrabajoCard from "../../components/ordenTrabajo/ordendetrabajoCard.vue";
import navbar from "../../components/componentes/navbar.vue";
import { useInterfaz } from '../../stores/interfaz.js'

const router = useRouter();
const ordenes = ref([]);
const uiStore = useInterfaz()
const estados = ref([]);
let searchTimeout = null;

const obtenerEstados = async () => {
  const { data } = await supabase.from('tabla_estados').select('*');
  if (data) estados.value = data;
}

const handleEstados = (id) => {
  return estados.value.find((estado) => estado.id === id);
} 

const obtenerOrdenes = async (busqueda = '') => {
  
  let query = supabase.from("orden_trabajo");

  if (busqueda) {
    query = query
      .select("*,presupuesto(*),vehiculo!inner(*),cliente(*)")
      .ilike('vehiculo.patente', `%${busqueda}%`);
  } else {
    query = query.select("*,presupuesto(*),vehiculo(*),cliente(*)");
  }

  query = query.order("id", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error(error);
  } else if (data) {
    ordenes.value = data;
  }
  uiStore.hideLoading()
};

const handleBusqueda = (texto) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    obtenerOrdenes(texto);
  }, 500);
};

const irACrear = () => {
  router.push({ name: "nueva-orden-de-trabajo" });
};

onMounted(async () => {
  uiStore.showLoading()
  await obtenerEstados();
  await obtenerOrdenes();
});
</script>

<template>
  <div class="contenedor-principal">
    <navbar
      titulo="ServiML"
      subtitulo="Ordenes de Trabajo"
      class="navbar"
      searchInput="true"
      @buscar="handleBusqueda"
    />
    
    <div class="contenedor pb-20">

      <div v-if="ordenes.length === 0" class="text-center py-10 text-gray-500">
        <p>No se encontraron órdenes de trabajo.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-1">
        <ordenTrabajoCard
          v-for="item in ordenes"
          :key="item.id"
          :orden="item"
          :estado="handleEstados(item.estado_actual_id)"
          @asignacion-exitosa="() => obtenerOrdenes()"
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