<script setup>
import { ref } from 'vue';
import {useRoute, useRouter} from 'vue-router';
import volver from '@/components/componentes/volver.vue';
import navbar from '@/components/componentes/navbar.vue';

const mostrarStats = ref(false);
const router = useRouter();
const route = useRoute();

const handleRedirigir = (id) => {
  router.push({name: 'ver-gasto', params: {id}});
}

const handleRegistrar = () => {
  router.push({name: 'crear-gasto'});
}

</script>
<template>
  <div class="min-h-screen servi-white font-sans">
    <navbar titulo="ServiML" :subtitulo="'Gastos de la Empresa'" class="navbar"></navbar>
    <div class="max-w-6xl mx-auto space-y-6 pt-5 pb-30 px-4 md:px-8">
      <volver></volver>
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 class="text-xl md:text-3xl font-bold servi-grey-font border-l-4 border-yellow-500 pl-3">
          Gastos de la Empresa
        </h1>
        <div class="flex gap-2 justify-between">
        <button 
        @click="mostrarStats = !mostrarStats" 
        class="md:hidden servi-blue text-white py-3 rounded-full font-semibold shadow-sm flex justify-between items-center px-4"
      >
        <span>Resumen Financiero</span>
        <span class="text-white font-bold"> {{ mostrarStats ? ' -' : ' +' }}</span>
      </button>
          <button @click="handleRegistrar" class="servi-yellow rounded-full md:w-auto px-5 py-2.5 shadow-md font-semibold text-sm">
          <p class="md:hidden">+</p>
          <p class="hidden md:block">Registrar Mes</p>
        </button>
        </div>
      </div>
      <div :class="mostrarStats ? 'block' : 'hidden md:grid'" class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div class="servi-blue p-4 md:p-5 rounded-lg shadow-lg border-b-4 border-yellow-500 relative overflow-hidden">
          <h3 class="text-white text-xs md:text-sm font-bold uppercase tracking-wider">Gasto Total Anual</h3>
          <p class="text-2xl md:text-3xl font-extrabold text-yellow-500 mt-1 md:mt-2">$15,420.00</p>
        </div>
        
        <div class="servi-blue p-4 md:p-5 rounded-lg shadow-lg border-b-4 border-slate-300">
          <h3 class="text-white text-xs md:text-sm font-bold uppercase tracking-wider">Mes Actual (Feb)</h3>
          <p class="text-2xl md:text-3xl font-bold text-white mt-1 md:mt-2">$2,450.00</p>
        </div>
        
        <div class="servi-blue p-4 md:p-5 rounded-lg shadow-lg border-b-4 border-slate-300">
          <h3 class="text-white text-xs md:text-sm font-bold uppercase tracking-wider">Por Aprobar</h3>
          <p class="text-2xl md:text-3xl font-bold text-white mt-1 md:mt-2">1 Ficha</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 md:hidden mt-4">
        <div class="servi-blue p-4 rounded-lg shadow-lg">
          <div class="flex justify-between items-center mb-2">
            <span class="font-bold text-white text-base">Febrero 2026</span>
            <span class="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold">Pendiente</span>
          </div>
          <div class="flex justify-between items-center mb-3">
            <span class="text-white/80 text-sm">Total:</span>
            <span class="font-bold text-white text-lg">$2,450.00</span>
          </div>
          <button class="w-full servi-yellow py-2.5 rounded-md font-semibold text-sm">
            Ver Ficha
          </button>
        </div>
      </div>

      <div class="hidden md:block servi-adapt-bg rounded-lg shadow-md overflow-hidden mt-6">
        <table class="min-w-full">
          <thead class="servi-blue text-white">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Mes de Operación</th>
              <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Total Gastos</th>
              <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Estado</th>
              <th class="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="px-6 py-4 whitespace-nowrap font-medium servi-grey-font">Febrero 2026</td>
              <td class="px-6 py-4 whitespace-nowrap font-bold servi-grey-font">$2,450.00</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">Pendiente</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap flex servi-grey-font justify-center text-right text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
    </div>
  </div>
</template>
