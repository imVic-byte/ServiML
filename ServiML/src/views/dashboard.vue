<script setup>
import navbar from "../components/componentes/navbar.vue"
import filters from "../components/dashboard/dashboardFilters.vue"
import dashboardCard from "../components/dashboard/dashboardCard.vue"
import { supabase } from "../lib/supabaseClient.js"
import { ref, onMounted } from "vue"
import cargando from "../components/componentes/cargando.vue"

const servicios = ref([])
const loading = ref(true)

const obtenerServicios = async () => {
  const {data, error} = await supabase.from('servicios').select('*')
  if (data) {
    servicios.value = data
  }
  loading.value = false
}

onMounted(() => {
  obtenerServicios()
})
</script>
<template>
  <cargando v-if="loading"></cargando>
  <div v-else class="body">
    <navbar titulo="ServiML" subtitulo="Dashboard" class="navbar" searchInput="true" />
    <filters />
    <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      <dashboardCard v-for="servicio in servicios" :key="servicio.id" :servicio="servicio" />
    </div>
  </div>
</template>
<style scoped>

.section-header h2 {
  font-size: 20px;
  font-weight: bold;
}

.section-header a:hover {
  background-color: #1f3d64;
  color: white;
}
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
}
</style>
