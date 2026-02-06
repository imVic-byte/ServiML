<script setup>
import { RouterView } from 'vue-router'
import GlobalLoader from '@/components/componentes/globalLoader.vue'
import Footer from '@/components/componentes/footer.vue'
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
