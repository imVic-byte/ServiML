<script setup>
import navbar from '../components/componentes/navbar.vue'
import { useUserStore } from '../stores/user.js'
import { computed } from 'vue'

const userStore = useUserStore()
const nombreCompleto = computed(() => {
  if (userStore.trabajador) {
    if (!userStore.trabajador.apellido) {
      return userStore.trabajador.nombre
    }
    return `${userStore.trabajador.nombre} ${userStore.trabajador.apellido}`
  }
  return 'Cargando...'
})
</script>
<template>
  <navbar :titulo="nombreCompleto" subtitulo="Dashboard" class="navbar" searchInput="false" />
  <div class="p-4 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Dashboard Resumen</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-600">
        <p class="text-xs font-bold text-gray-500 uppercase">Vehículos en Taller</p>
        <div class="flex items-center justify-between mt-2">
          <span class="text-3xl font-bold text-gray-800">a</span>
          <span class="text-2xl">🚗</span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-500">
        <p class="text-xs font-bold text-gray-500 uppercase">Presupuestos Semana</p>
        <div class="flex items-center justify-between mt-2">
          <span class="text-3xl font-bold text-gray-800">a</span>
          <span class="text-2xl">📋</span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500">
        <p class="text-xs font-bold text-gray-500 uppercase">OT sin Asignar</p>
        <div class="flex items-center justify-between mt-2">
          <span class="text-3xl font-bold text-red-600">a</span>
          <span class="text-2xl animate-pulse">⚠️</span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
        <p class="text-xs font-bold text-gray-500 uppercase">Ingresos Estimados (Mes)</p>
        <div class="flex items-center justify-between mt-2">
          <span class="text-xl font-bold text-gray-800">a</span>
          <span class="text-2xl">💰</span>
        </div>
      </div>

    </div>
  </div>
</template>