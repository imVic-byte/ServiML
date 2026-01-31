<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import navbar from '../components/componentes/navbar.vue'
import cargando from '../components/componentes/cargando.vue'

const userStore = useUserStore()
userStore.obtenerTrabajador()
const isGerente = userStore.isGerente
console.log(isGerente)
const router = useRouter()
const loading = ref(true)

const manejarCierreSesion = async () => {
  try {
    await userStore.logout()
    router.replace('/login')
  } catch (error) {
    alert('Error al cerrar sesión: ' + error.message)
  }
}
onMounted(() => {
  loading.value = false
})
</script>
<template>
  <cargando v-if="loading"></cargando>
  <div v-else>
  <navbar :titulo="userStore.user?.user_metadata.full_name" subtitulo="Configuración" class="navbar" searchInput="false" />
      <div class="mt-2 flex flex-col justify-center items-center">
        <button @click="manejarCierreSesion" class="servi-yellow servi-blue-font font-bold px-4 py-2 rounded-full">Cerrar Sesión</button>
        <button v-if="isGerente" @click="router.push('/gestion-usuarios')" class="servi-yellow servi-blue-font font-bold px-4 py-2 rounded-full">Gestionar Usuarios</button>
      </div> 
  </div>
</template>
<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
}
</style>