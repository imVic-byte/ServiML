<script setup>
import navbar from "../components/componentes/navbar.vue"
import filters from "../components/dashboard/dashboardFilters.vue"
import dashboardCard from "../components/dashboard/dashboardCard.vue"
import cargando from "../components/componentes/cargando.vue"
import { supabase } from "../lib/supabaseClient.js"
import { ref, onMounted } from "vue"

const servicios = ref([])
const loading = ref(true)

const obtenerServicios = async () => {
  const { data, error } = await supabase.from('servicios').select('*')
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
  
  <div v-else class="min-h-screen bg-gray-50 pb-20"> <navbar titulo="ServiML" subtitulo="Dashboard" class="sticky top-0 z-50" searchInput="true" />
    
    <main class="container mx-auto max-w-6xl">
      <filters />
      
      <div class="px-4 mt-4 mb-2">
        <h2 class="text-xl font-bold text-[#1f3d64]">Resumen de Servicios</h2>
      </div>

      <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <dashboardCard 
          v-for="servicio in servicios" 
          :key="servicio.id" 
          :servicio="servicio" 
        />
      </div>
      
      <div v-if="servicios.length === 0" class="text-center py-10 text-gray-400">
        <p>No hay información disponible para mostrar.</p>
      </div>
    </main>
  </div>
</template>

<style scoped>

</style>