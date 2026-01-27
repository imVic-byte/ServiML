<script setup>
import navbar from "../components/componentes/navbar.vue"
import filters from "../components/dashboard/dashboardFilters.vue"
import dashboardCard from "../components/dashboard/dashboardCard.vue"
import cargando from "../components/componentes/cargando.vue"
import { supabase } from "../lib/supabaseClient.js"
import { ref, onMounted } from "vue"
import { Wallet, Car, CheckCircle2, Clock } from 'lucide-vue-next'

const servicios = ref([])
const loading = ref(true)

// Datos simulados
const kpis = {
  ingresos: '$ 2.450.000',
  pendientes: 4,
  listos: 12,
  tiempoPromedio: '2 Días'
}

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
  
  <div v-else class="min-h-screen bg-[#f3f4f6] pb-20">
    <navbar titulo="ServiML" subtitulo="Resumen General" class="sticky top-0 z-50" searchInput="true" />
    
    <main class="container mx-auto max-w-6xl px-4 py-6">
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div class="flex justify-between items-start">
            <div class="p-2 bg-blue-50 rounded-lg">
              <Wallet class="w-6 h-6 text-[#1f3d64]" />
            </div>
            <span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+15%</span>
          </div>
          <div>
            <p class="text-gray-500 text-xs font-medium uppercase tracking-wider">Ingresos Mes</p>
            <p class="text-2xl font-bold text-[#1f3d64]">{{ kpis.ingresos }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div class="flex justify-between items-start">
            <div class="p-2 bg-orange-50 rounded-lg">
              <Car class="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <div>
            <p class="text-gray-500 text-xs font-medium uppercase tracking-wider">En Taller</p>
            <p class="text-2xl font-bold text-gray-800">{{ kpis.pendientes }} <span class="text-sm font-normal text-gray-400">Autos</span></p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div class="flex justify-between items-start">
            <div class="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 class="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div>
            <p class="text-gray-500 text-xs font-medium uppercase tracking-wider">Listos</p>
            <p class="text-2xl font-bold text-gray-800">{{ kpis.listos }} <span class="text-sm font-normal text-gray-400">Autos</span></p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div class="flex justify-between items-start">
            <div class="p-2 bg-purple-50 rounded-lg">
              <Clock class="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p class="text-gray-500 text-xs font-medium uppercase tracking-wider">Tiempo Prom.</p>
            <p class="text-2xl font-bold text-gray-800">{{ kpis.tiempoPromedio }}</p>
          </div>
        </div>
      </div>

      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 class="text-xl font-bold text-[#1f3d64]">Órdenes Activas</h2>
        <filters />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <dashboardCard 
          v-for="servicio in servicios" 
          :key="servicio.id" 
          :servicio="servicio" 
        />
      </div>
      
      <div v-if="servicios.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
        <div class="bg-gray-100 p-4 rounded-full mb-3">
          <Car class="w-8 h-8 text-gray-300" />
        </div>
        <p>No hay trabajos activos por ahora.</p>
      </div>

    </main>
  </div>
</template>