<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../../lib/supabaseClient.js";
import presupuestoCard from "../../components/presupuesto/presupuestoCard.vue";

import navbar from "../../components/componentes/navbar.vue";
import cargando from "../../components/componentes/cargando.vue";
const servicios = ref([]);
const loading = ref(true);

const handleInicioSemanaTimezone = () => {
    const fecha = new Date();
    const dia = fecha.getDay();
    const diferencia = dia === 0 ? 6 : dia - 1;
    fecha.setDate(fecha.getDate() - diferencia);
    fecha.setHours(0, 0, 0, 0); 
    return fecha.toISOString();
}

const obtenerPresupuestos = async () => {
  loading.value = true;
  
  try {
    const { data, error } = await supabase
        .from("presupuesto")
        .select("*, vehiculo(*)")
        .gte('created_at', handleInicioSemanaTimezone()) 
        .order("numero_folio", { ascending: false });

    if (error) throw error;

    if (data) {
        servicios.value = data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};
onMounted(async () => {
  await obtenerPresupuestos();
});
</script>

<template>
  <cargando v-if="loading"></cargando>
  <div v-else>
    <navbar
      titulo="ServiML"
      subtitulo="Presupuestos Semanales"
      class="navbar"
      searchInput="true"
    />
    <div class="contenedor pb-20">
      <div class="header-acciones flex justify-between items-center my-2 px-2">
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