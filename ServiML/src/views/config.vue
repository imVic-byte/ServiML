<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import navbar from '../components/componentes/navbar.vue'
import cargando from '../components/componentes/cargando.vue'

const userStore = useUserStore()
const router = useRouter()

const manejarCierreSesion = async () => {
  try {
    await userStore.signOut()
    router.replace('/login')
  } catch (error) {
    alert('Error al cerrar sesión: ' + error.message)
  }
}
</script>
<template>
  <cargando v-if="userStore.loading"></cargando>
  
  <div v-else class="min-h-screen bg-gray-50 font-sans pb-20">
    <navbar 
      subtitulo="Panel de Control ServiML" 
      class="navbar shadow-sm" 
      searchInput="false" 
    />
    
    <div class="container mx-auto px-6 mt-2 pb-15">
      
      <div class="mb-8">
         <h2 class="text-2xl font-bold text-gray-800">Hola, {{ userStore.trabajador?.nombre?.split(' ')[0] || 'Usuario' }}</h2>
         <p class="text-gray-600">¿Qué deseas administrar hoy?</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        
        <div @click="router.push('/perfil')" 
             class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-blue-400 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div class="bg-blue-100 text-blue-600 p-4 rounded-full mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A7.5 7.5 0 0 1 4.501 20.118Z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-blue-700 mb-1">Mi Perfil</h3>
          <p class="text-sm text-gray-500">Mis datos y seguridad</p>
        </div>

        <div @click="router.push('/gestion-usuarios')" 
             class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-blue-400 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div class="bg-indigo-100 text-indigo-600 p-4 rounded-full mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-blue-700 mb-1">Usuarios</h3>
          <p class="text-sm text-gray-500">Administrar equipo</p>
        </div>

        <div @click="router.push('/autos')" 
             class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-yellow-400 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div class="bg-yellow-100 text-yellow-600 p-4 rounded-full mb-4 group-hover:bg-yellow-500 group-hover:text-white transition-colors duration-300">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0 1.5 1.5 0 0 1 3 0ZM18.75 18.75a1.5 1.5 0 0 1-3 0 1.5 1.5 0 0 1 3 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5h-15l-2.25-2.625a1.125 1.125 0 0 1-.25-.656V4.5a1.125 1.125 0 0 1 1.125-1.125h16.5a1.125 1.125 0 0 1 1.125 1.125v2.719c0 .237-.09.465-.25.656L19.5 10.5Z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-yellow-600 mb-1">Flota de Autos</h3>
          <p class="text-sm text-gray-500">Gestión de vehículos</p>
        </div>

         <div @click="router.push('/clientes')" 
             class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-blue-400 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div class="bg-cyan-100 text-cyan-600 p-4 rounded-full mb-4 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.67.38m-4.5-8.006c-1.536-.143-3.088-.248-4.654-.313m4.5 8.006a2.18 2.18 0 0 0-1.661-.75h-2.25c-.632 0-1.22.27-1.661.75m4.5-8.006c-1.084.065-2.164.158-3.233.275m-3.25 8.006a2.18 2.18 0 0 1-1.661-.75m-4.5 0c.194.165.42.295.67.38m4.5-8.006c1.536-.143 3.088-.248 4.654-.313m-4.5 8.006a2.18 2.18 0 0 1-1.661-.75H8.25c-.632 0-1.22.27-1.661.75m0 0v4.25m0-4.25a2.18 2.18 0 0 1-.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25a3 3 0 0 0-3-3h-3a3 3 0 0 0-3 3v1.5" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-blue-700 mb-1">Clientes</h3>
          <p class="text-sm text-gray-500">Cartera de clientes</p>
        </div>

        <div @click="router.push('/finanzas')" 
             class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-green-400 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div class="bg-green-100 text-green-600 p-4 rounded-full mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-green-700 mb-1">Finanzas</h3>
          <p class="text-sm text-gray-500">Ingresos y Egresos</p>
        </div>

        <div @click="router.push('/gastos')" 
             class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-red-300 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div class="bg-red-100 text-red-500 p-4 rounded-full mb-4 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-red-600 mb-1">Gastos Mensuales</h3>
          <p class="text-sm text-gray-500">Control de costos</p>
        </div>

        <div @click="manejarCierreSesion" 
             class="group col-span-2 md:col-span-1 bg-red-50 rounded-2xl p-6 cursor-pointer shadow-sm border-2 border-red-100 hover:border-red-500 hover:bg-red-100 hover:shadow-md transition-all duration-300 ease-in-out flex flex-row md:flex-col items-center justify-center gap-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          <div class="text-left md:text-center">
             <h3 class="text-lg font-bold text-red-700 mb-0 md:mb-1 leading-tight">Cerrar Sesión</h3>
             <p class="text-sm text-red-400 hidden md:block">Salir de forma segura</p>
          </div>
        </div>

      </div> </div>
  </div>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
}
</style>