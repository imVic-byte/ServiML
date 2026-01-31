<script setup>
import { onMounted } from 'vue';
import serviFooter from "./components/componentes/footer.vue";
import { useUserStore } from "./stores/user";
import { supabase } from "./lib/supabaseClient";

const userStore = useUserStore();

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    userStore.user = session.user;
  }
  supabase.auth.onAuthStateChange((_event, session) => {
    userStore.user = session?.user || null;
    }
  ); 
});
</script>

<template>
  <div class="app-container">
    <router-view/>
    <div v-if="userStore.user">
      <serviFooter />
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