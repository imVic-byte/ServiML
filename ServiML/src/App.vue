<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import serviFooter from './components/componentes/footer.vue'
import cargando from './components/componentes/cargando.vue'
const userStore = useUserStore()

onMounted(async () => {
  await userStore.initializeAuth()
})
</script>

<template>
  <div class="app-container">
    <div v-if="userStore.loading" class="loading-screen">
    </div>
    <div v-else>
      <router-view/>
      <serviFooter v-if="userStore.user"/>
    </div>
  </div>
</template>

<style>
.app-container {
  font-family: sans-serif;
  background-color: #f8f9fa;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
}
.loading-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  color: #333;
}
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
}
</style> 