<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import navbar from '../components/navbar.vue'
const router = useRouter()
const userStore = useUserStore()

const manejarCierreSesion = async () => {
  try {
    await userStore.logout()
    router.replace('/login')
  } catch (error) {
    alert('Error al cerrar sesión: ' + error.message)
  }
}
</script>
<template>
  <navbar :titulo="userStore.user?.user_metadata.full_name" subtitulo="Configuración" class="navbar" searchInput="false" />
      <div class="mt-2 flex flex-col justify-center items-center">
        <button @click="manejarCierreSesion" class="servi-yellow servi-blue-font font-bold px-4 py-2 rounded-full">Cerrar Sesión</button>
      </div>  
</template>