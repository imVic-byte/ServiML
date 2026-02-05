<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import ordenTrabajoCard from "../../components/ordenTrabajo/ordendetrabajoCard.vue";
import navbar from "../../components/componentes/navbar.vue";
import { useInterfaz } from '../../stores/interfaz.js'

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
    .eq('estado_actual_id', 1)
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
    <navbar
      titulo="ServiML"
      subtitulo="OT Sin Asignar"
      class="navbar"
      searchInput="true"
    />
    <div class="contenedor pb-20">
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
</template>
<style scoped>
.navbar {
  position: sticky;
  top: 0;
}
</style>