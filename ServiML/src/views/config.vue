<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import navbar from '../components/componentes/navbar.vue'
import { useInterfaz } from '../stores/interfaz.js'
import { onMounted } from 'vue'

const userStore = useUserStore()
const router = useRouter()
const uiStore = useInterfaz()


const manejarCierreSesion = async () => {
  try {
    await userStore.signOut()
    router.replace('/login')
  } catch (error) {
    alert('Error al cerrar sesión: ' + error.message)
  }
}
onMounted(() => {
  uiStore.showLoading()
  setTimeout(() => {
    uiStore.hideLoading()
  }, 1000)
})

</script>
<template>

  <div class="min-h-screen bg-gray-50 font-sans pb-20">
    <navbar subtitulo="Panel de Control ServiML" class="navbar shadow-sm" searchInput="false" />

    <div class="container mx-auto px-6 mt-2 pb-15">

      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-800">Hola, {{ userStore.trabajador?.nombre?.split(' ')[0] || 'Usuario'
          }}</h2>
        <p class="text-gray-600">¿Qué deseas administrar hoy?</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

        <div @click="router.push('/perfil')"
          class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-blue-400 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div
            class="bg-blue-100 text-blue-600 p-4 rounded-full mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A7.5 7.5 0 0 1 4.501 20.118Z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-blue-700 mb-1">Mi Perfil</h3>
          <p class="text-sm text-gray-500">Mis datos y seguridad</p>
        </div>

        <div @click="router.push('/gestion-usuarios')"
          class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-blue-400 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div
            class="bg-indigo-100 text-indigo-600 p-4 rounded-full mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-blue-700 mb-1">Usuarios</h3>
          <p class="text-sm text-gray-500">Administrar equipo</p>
        </div>

        <div @click="router.push('/vehiculos')"
          class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-yellow-400 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div
            class="bg-yellow-100 text-yellow-600 p-4 rounded-full mb-4 group-hover:bg-yellow-500 group-hover:text-white transition-colors duration-300">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-8 h-8">
              <path
                d="M5 13H8M2 9L4 10L5.27064 6.18807C5.53292 5.40125 5.66405 5.00784 5.90729 4.71698C6.12208 4.46013 6.39792 4.26132 6.70951 4.13878C7.06236 4 7.47705 4 8.30643 4H15.6936C16.523 4 16.9376 4 17.2905 4.13878C17.6021 4.26132 17.8779 4.46013 18.0927 4.71698C18.3359 5.00784 18.4671 5.40125 18.7294 6.18807L20 10L22 9M16 13H19M6.8 10H17.2C18.8802 10 19.7202 10 20.362 10.327C20.9265 10.6146 21.3854 11.0735 21.673 11.638C22 12.2798 22 13.1198 22 14.8V17.5C22 17.9647 22 18.197 21.9616 18.3902C21.8038 19.1836 21.1836 19.8038 20.3902 19.9616C20.197 20 19.9647 20 19.5 20H19C17.8954 20 17 19.1046 17 18C17 17.7239 16.7761 17.5 16.5 17.5H7.5C7.22386 17.5 7 17.7239 7 18C7 19.1046 6.10457 20 5 20H4.5C4.03534 20 3.80302 20 3.60982 19.9616C2.81644 19.8038 2.19624 19.1836 2.03843 18.3902C2 18.197 2 17.9647 2 17.5V14.8C2 13.1198 2 12.2798 2.32698 11.638C2.6146 11.0735 3.07354 10.6146 3.63803 10.327C4.27976 10 5.11984 10 6.8 10Z"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-yellow-600 mb-1">Flota de Autos</h3>
          <p class="text-sm text-gray-500">Gestión de vehículos</p>
        </div>

        <div @click="router.push('/clientes')"
          class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-blue-400 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div
            class="bg-cyan-100 text-cyan-600 p-4 rounded-full mb-4 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M13 7L11.8845 4.76892C11.5634 4.1268 11.4029 3.80573 11.1634 3.57116C10.9516 3.36373 10.6963 3.20597 10.4161 3.10931C10.0992 3 9.74021 3 9.02229 3H5.2C4.0799 3 3.51984 3 3.09202 3.21799C2.71569 3.40973 2.40973 3.71569 2.21799 4.09202C2 4.51984 2 5.0799 2 6.2V7M2 7H17.2C18.8802 7 19.7202 7 20.362 7.32698C20.9265 7.6146 21.3854 8.07354 21.673 8.63803C22 9.27976 22 10.1198 22 11.8V16.2C22 17.8802 22 18.7202 21.673 19.362C21.3854 19.9265 20.9265 20.3854 20.362 20.673C19.7202 21 18.8802 21 17.2 21H6.8C5.11984 21 4.27976 21 3.63803 20.673C3.07354 20.3854 2.6146 19.9265 2.32698 19.362C2 18.7202 2 17.8802 2 16.2V7ZM15.5 17.5L14 16M15 13.5C15 15.433 13.433 17 11.5 17C9.567 17 8 15.433 8 13.5C8 11.567 9.567 10 11.5 10C13.433 10 15 11.567 15 13.5Z"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-blue-700 mb-1">Clientes</h3>
          <p class="text-sm text-gray-500">Cartera de clientes</p>
        </div>

        <div @click="router.push('/deudas')"
          class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-orange-400 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div
            class="bg-orange-100 text-orange-600 p-4 rounded-full mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 15.75h.008v.008H12v-.008ZM12 12.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-orange-700 mb-1">Deudas y Abonos</h3>
          <p class="text-sm text-gray-500">Cuentas por cobrar</p>
        </div>

        <div @click="router.push('/finanzas')"
          class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-green-400 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div
            class="bg-green-100 text-green-600 p-4 rounded-full mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-green-700 mb-1">Finanzas</h3>
          <p class="text-sm text-gray-500">Ingresos y Egresos</p>
        </div>

        <div @click="router.push('/gastos')"
          class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-red-300 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div
            class="bg-red-100 text-red-500 p-4 rounded-full mb-4 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-red-600 mb-1">Gastos Mensuales</h3>
          <p class="text-sm text-gray-500">Control de costos</p>
        </div>
        <div @click="router.push('/serviml')"
          class="group bg-white rounded-2xl p-6 cursor-pointer shadow-md border-2 border-transparent hover:border-blue-800 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div
            class="bg-blue-900 text-yellow-500 p-4 rounded-full mb-4 group-hover:bg-yellow-600 group-hover:text-blue-900 transition-colors duration-300">
            <svg class="w-8 h-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 7.205c4.418 0 8-1.165 8-2.602C20 3.165 16.418 2 12 2S4 3.165 4 4.603c0 1.437 3.582 2.602 8 2.602ZM12 22c4.963 0 8-1.686 8-2.603v-4.404c-.052.032-.112.06-.165.09a7.75 7.75 0 0 1-.745.387c-.193.088-.394.173-.6.253-.063.024-.124.05-.189.073a18.934 18.934 0 0 1-6.3.998c-2.135.027-4.26-.31-6.3-.998-.065-.024-.126-.05-.189-.073a10.143 10.143 0 0 1-.852-.373 7.75 7.75 0 0 1-.493-.267c-.053-.03-.113-.058-.165-.09v4.404C4 20.315 7.037 22 12 22Zm7.09-13.928a9.91 9.91 0 0 1-.6.253c-.063.025-.124.05-.189.074a18.935 18.935 0 0 1-6.3.998c-2.135.027-4.26-.31-6.3-.998-.065-.024-.126-.05-.189-.074a10.163 10.163 0 0 1-.852-.372 7.816 7.816 0 0 1-.493-.268c-.055-.03-.115-.058-.167-.09V12c0 .917 3.037 2.603 8 2.603s8-1.686 8-2.603V7.596c-.052.031-.112.059-.165.09a7.816 7.816 0 0 1-.745.386Z"/>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800 group-hover:text-blue-900 mb-1">ServiML</h3>
          <p class="text-sm text-gray-500">Control de ServiML</p>
        </div>

        <div @click="manejarCierreSesion"
          class="group col-span-2 md:col-span-1 bg-red-50 rounded-2xl p-6 cursor-pointer shadow-sm border-2 border-red-100 hover:border-red-500 hover:bg-red-100 hover:shadow-md transition-all duration-300 ease-in-out flex flex-row md:flex-col items-center justify-center gap-4 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            class="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          <div class="text-left md:text-center">
            <h3 class="text-lg font-bold text-red-700 mb-0 md:mb-1 leading-tight">Cerrar Sesión</h3>
            <p class="text-sm text-red-400 hidden md:block">Salir de forma segura</p>
          </div>
        </div>


      </div>
    </div>
    <span class="version-label">Versión 1.2</span>
  </div>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.version-label {
  position: fixed;
  bottom: 90px;
  right: 16px;
  font-size: 0.75rem;
  color: #9ca3af;
  user-select: none;
  pointer-events: none;
}
</style>