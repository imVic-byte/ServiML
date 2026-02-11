<script setup>
import { RouterView } from 'vue-router'
import GlobalLoader from '@/components/componentes/globalLoader.vue'
import Footer from '@/components/componentes/footer.vue'

import { watch } from 'vue'
import { useInterfaz } from './stores/interfaz'

const uiStore = useInterfaz()
let safetyTimer = null

// Watchdog: Vigila el estado de loading
watch(
  () => uiStore.isLoading, // O como se llame tu variable de loading en la store de interfaz
  (newVal) => {
    if (newVal) {
      // Si se activa el loading, iniciamos una cuenta atrás de 10 segundos
      if (safetyTimer) clearTimeout(safetyTimer)
      safetyTimer = setTimeout(() => {
        console.warn('⚠️ ALERTA: El loading lleva mucho tiempo. Forzando desbloqueo.')
        uiStore.hideLoading()
      }, 10000) // 10 segundos máximo
    } else {
      // Si se desactiva, cancelamos la cuenta atrás
      if (safetyTimer) clearTimeout(safetyTimer)
    }
  }
) 
</script>

<template>
  <GlobalLoader />
  <div class="main-layout">
    <RouterView />
    <Footer v-if="$route.name !== 'login'" />
  </div>
</template>

<style>
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
}
</style>
