<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import serviFooter from './components/componentes/footer.vue'
const userStore = useUserStore()

onMounted(() => {
  userStore.initializeAuth()
  console.log(userStore.loading)
})
</script>

<template>
  <div class="app-container">
    <router-view/>
    <div>
      <serviFooter v-if="!userStore.loading && userStore.user"/>
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
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
}
</style>