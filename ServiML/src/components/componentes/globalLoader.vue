<script setup>
import { useInterfaz } from '@/stores/interfaz'
import { storeToRefs } from 'pinia'
import cargando2 from './cargando2.vue';

const uiStore = useInterfaz()
const { isLoading } = storeToRefs(uiStore)
</script>
<template>
  <cargando2 />
  <div v-if="isLoading" class="loader-overlay servi-blue">
    <img src="/GIF.svg" alt="Cargando" class="custom-loader" />
  </div>
</template>

<style scoped>
.loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  pointer-events: auto;
}

.custom-loader {
  width: 150px;
  height: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>