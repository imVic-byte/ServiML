<script setup>
import { RouterView } from 'vue-router'
import GlobalLoader from '@/components/componentes/globalLoader.vue'
import Footer from '@/components/componentes/footer.vue'
</script>

<template>
  <GlobalLoader />
  <div class="main-layout">
    <RouterView />
    <Footer />
  </div>
</template>