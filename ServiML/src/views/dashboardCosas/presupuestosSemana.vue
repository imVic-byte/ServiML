<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../../lib/supabaseClient.js";
import presupuestoCard from "../../components/presupuesto/presupuestoCard.vue";
import { useInterfaz } from '../../stores/interfaz.js'
import navbar from "../../components/componentes/navbar.vue";
const servicios = ref([]);
const uiStore = useInterfaz()

const handleInicioSemanaTimezone = () => {
    const fecha = new Date();
    const dia = fecha.getDay();
    const diferencia = dia === 0 ? 6 : dia - 1;
    fecha.setDate(fecha.getDate() - diferencia);
    fecha.setHours(0, 0, 0, 0); 
    return fecha.toISOString();
}

const obtenerPresupuestos = async () => {
  
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
    uiStore.hideLoading()
  }
};
onMounted(async () => {
  uiStore.showLoading()
  await obtenerPresupuestos();
});
</script>

<template>
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
</template>
<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
}
</style>