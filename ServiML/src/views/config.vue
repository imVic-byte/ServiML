<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import navbar from '../components/componentes/navbar.vue'
import cargando from '../components/componentes/cargando.vue'
const router = useRouter()
const userStore = useUserStore()
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
      </div>  
  </div>
</template>