<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import navbar from '../components/componentes/navbar.vue'
import cargando from '../components/componentes/cargando.vue'

const userStore = useUserStore()
const router = useRouter()

// Ya no necesitamos un loading local, usamos el de la store que es la fuente de verdad

const manejarCierreSesion = async () => {
  try {
    // Aquí sí podemos forzar un estado de carga visual si queremos
    // pero idealmente deberíamos tener una propiedad 'processing' local
    // para no confundir con la carga inicial de datos.
    await userStore.signOut()
    router.replace('/login')
  } catch (error) {
    alert('Error al cerrar sesión: ' + error.message)
  }
}
</script>

<template>
  <cargando v-if="userStore.loading"></cargando>
  
  <div v-else>
    <navbar 
      :titulo="userStore.trabajador?.nombre || 'Usuario'" 
      subtitulo="Configuración" 
      class="navbar" 
      searchInput="false" 
    />
    <div class="max-h-screen flex flex-col justify-start items-center pt-40">
      <div class="flex flex-col justify-center items-center gap-4 p-3 border border-gray-200 rounded-xl shadow-md m-4 w-70">
        <button @click="manejarCierreSesion" class="servi-yellow servi-blue-font font-bold px-4 py-2 rounded-xl">
          Cerrar Sesión
        </button>
        <button @click="router.push('/gestion-usuarios')" class="servi-yellow servi-blue-font font-bold px-4 py-2 rounded-xl">
          Gestionar Usuarios
        </button>
      </div>
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