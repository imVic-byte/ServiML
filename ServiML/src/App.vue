<script setup>
import { onMounted, watch } from "vue";
import { RouterView } from "vue-router";
import GlobalLoader from "@/components/componentes/globalLoader.vue";
import Footer from "@/components/componentes/footer.vue";
import { useInterfaz } from "./stores/interfaz";
import { useUserStore } from "./stores/user";

const uiStore = useInterfaz();
const userStore = useUserStore();
let safetyTimer = null
watch(
  () => uiStore.isLoading,

  (newVal) => {
    if (newVal) {
      if (safetyTimer) clearTimeout(safetyTimer);

      safetyTimer = setTimeout(() => {
        console.warn(
          "⚠️ ALERTA: El loading lleva mucho tiempo. Forzando desbloqueo."
        );

        uiStore.hideLoading();
      }, 10000);
    } else {
      if (safetyTimer) clearTimeout(safetyTimer);
    }
  }
);

onMounted(() => {
  userStore.initializeAuth();
});
</script>

<template>
  <GlobalLoader />
  <div class="app-container">
    <RouterView />
    <Footer v-if="$route.name !== 'login' && $route.name !== 'crear-contraseña'" />
  </div>
</template>

<style>
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
}
</style>
