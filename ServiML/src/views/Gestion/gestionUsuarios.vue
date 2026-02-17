<script setup>
import { ref, onMounted } from 'vue';
import navbar from '../../components/componentes/navbar.vue';
import {useInterfaz} from '../../stores/interfaz.js';
import { supabase } from '../../lib/supabaseClient.js'; 
import { useRouter } from 'vue-router';

const router = useRouter();
const trabajadores = ref([]);
const cargando = ref(true);
const errorMsg = ref('');
const interfaz = useInterfaz();

const obtenerTrabajadores = async () => {
  try {
    cargando.value = true;
    const { data, error } = await supabase
      .from('trabajadores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    trabajadores.value = data;
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    cargando.value = false;
  }
};

const invitarUsuario = () => {
  router.push('/invitar-usuarios');
}

const alternarEstado = async (id, estadoActual) => {
  if (estadoActual) {
    if (!confirm('¿Está seguro de que desea desactivar este usuario?')) {
      return;
    }
  }
  useInterfaz.showLoadingOverlay();
  try {
    const { error } = await supabase
      .from('trabajadores')
      .update({ activo: !estadoActual})
      .eq('id', id);

    if (error) throw error;
    
    const index = trabajadores.value.findIndex(t => t.id === id);
    if (index !== -1) {
      trabajadores.value[index].activo = !estadoActual;
    }
  } catch (error) {
    alert('Error al actualizar estado: ' + error.message);
  } finally {
    useInterfaz.hideLoadingOverlay();
  }
};

const RecuperarContraseña = async (id) => {
  useInterfaz.showLoadingOverlay();
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(trabajadores.value.find(t => t.id === id).email,{
      redirectTo: 'http://app.serviml.cl/crear-contrasena'
    });
    if (error) throw error;
    alert('Se ha enviado un correo electrónico para restablecer la contraseña.');
  } catch (error) {
    alert('Error al restablecer la contraseña: ' + error.message);
  } finally {
    useInterfaz.hideLoadingOverlay();
  }
}

onMounted(async () => {
  interfaz.showLoading();
  await obtenerTrabajadores();
  interfaz.hideLoading();
});
</script>

<template>
  <div class="servi-white min-h-screen">
  <navbar class="navbar" titulo="Gestión de Personal" subtitulo="Administra los usuarios y sus permisos de acceso." />
  <div class="p-6 servi-white min-h-screen">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-end items-center mb-6 sm:justify-between">
        <div class="sm:block hidden">
          <h1 class="text-2xl font-bold servi-grey-font">Gestión de Personal</h1>
          <p class="text-sm servi-grey-font mt-1">Administra los usuarios y sus permisos de acceso.</p>
        </div>
        <div class="flex gap-2">
          <button 
          @click="obtenerTrabajadores" 
          class="px-4 cursor-pointer py-2 servi-yellow servi-grey-font border border-gray-100 rounded-lg text-sm font-medium hover:opacity-80 shadow-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
        <button @click="invitarUsuario" class="px-4 cursor-pointer py-2 servi-yellow servi-grey-font border border-gray-100 rounded-lg text-sm font-medium hover:opacity-80 shadow-sm transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
        </button>
        </div>
      </div>

      <div class="rounded-xl shadow-sm overflow-hidden">
        <div v-if="cargando" class="p-8 text-center servi-grey-font">
          Cargando datos del personal...
        </div>

        <div v-else-if="errorMsg" class="p-8 text-center text-red-600 bg-red-50">
          {{ errorMsg }}
        </div>

        <div v-else>
          <!-- Mobile: Cards -->
          <div class="md:hidden space-y-3 p-4">
            <div 
              v-for="trabajador in trabajadores" 
              :key="'card-' + trabajador.id" 
              class="servi-adapt-bg rounded-xl border border-gray-100 shadow-sm p-4 space-y-3"
            >
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {{ trabajador.nombre ? trabajador.nombre.charAt(0).toUpperCase() : '?' }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-bold servi-grey-font truncate">{{ trabajador.nombre }} {{ trabajador.apellido }}</div>
                  <div class="text-xs servi-grey-font">RUT: {{ trabajador.rut || 'No registrado' }}</div>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <span 
                    class="px-2 py-0.5 text-xs font-semibold rounded-full"
                    :class="{
                      'bg-purple-100 text-purple-800': trabajador.rol === 'Administrador',
                      'bg-blue-100 text-blue-800': trabajador.rol === 'Gerente',
                      'servi-adapt-bg servi-grey-font': trabajador.rol === 'Mecánico' || trabajador.rol === 'Trabajador',
                      'servi-yellow-font': trabajador.rol === 'Soporte'
                    }"
                  >
                    {{ trabajador.rol }}
                  </span>
                  <span 
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="trabajador.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  >
                    <span class="w-1.5 h-1.5 mr-1 rounded-full" :class="trabajador.activo ? 'bg-green-400' : 'bg-red-400'"></span>
                    {{ trabajador.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </div>

              <div class="border-t border-gray-100 pt-2 space-y-1">
                <div class="flex items-center gap-2 text-xs servi-grey-font">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span class="truncate">{{ trabajador.email }}</span>
                </div>
                <div class="flex items-center gap-2 text-xs servi-grey-font">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span>{{ trabajador.telefono || 'Sin teléfono' }}</span>
                </div>
              </div>

              <div class="flex gap-2 pt-1">
                <button 
                  @click="alternarEstado(trabajador.id, trabajador.activo)"
                  class="flex-1 text-xs font-semibold servi-yellow px-3 py-2 rounded-lg text-center cursor-pointer"
                >
                  {{ trabajador.activo ? 'Desactivar' : 'Activar' }}
                </button>
                <button 
                  @click="RecuperarContraseña(trabajador.id)"
                  class="flex-1 text-xs font-semibold servi-yellow px-3 py-2 rounded-lg text-center cursor-pointer"
                >
                  Recuperar Contraseña
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop: Table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100">
              <thead class="servi-blue servi-yellow-font">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">Trabajador</th>
                  <th scope="col" class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">Contacto</th>
                  <th scope="col" class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">Rol</th>
                  <th scope="col" class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">Estado</th>
                  <th scope="col" class="px-6 py-3 text-center text-sm font-medium uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="servi-adapt-bg divide-y divide-gray-100">
                <tr v-for="trabajador in trabajadores" :key="trabajador.id" class="hover:opacity-80 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center servi-grey-font">
                      <div class="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {{ trabajador.nombre ? trabajador.nombre.charAt(0).toUpperCase() : '?' }}
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium servi-grey-font">{{ trabajador.nombre }} {{ trabajador.apellido }}</div>
                        <div class="text-sm servi-grey-font">RUT: {{ trabajador.rut || 'No registrado' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm servi-grey-font">{{ trabajador.email }}</div>
                    <div class="text-sm servi-grey-font">{{ trabajador.telefono || 'Sin teléfono' }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="{
                        'bg-purple-100 text-purple-800': trabajador.rol === 'Administrador',
                        'bg-blue-100 text-blue-800': trabajador.rol === 'Gerente',
                        'servi-adapt-bg servi-grey-font': trabajador.rol === 'Mecánico' || trabajador.rol === 'Trabajador',
                        'servi-yellow-font': trabajador.rol === 'Soporte'
                      }"
                    >
                      {{ trabajador.rol }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="trabajador.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    >
                      <span class="w-1.5 h-1.5 mr-1.5 rounded-full" :class="trabajador.activo ? 'bg-green-400' : 'bg-red-400'"></span>
                      {{ trabajador.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-2 py-2 w-full h-full flex flex-col justify-center items-center whitespace-nowrap text-center text-sm font-medium gap-2">
                    <button 
                      @click="alternarEstado(trabajador.id, trabajador.activo)"
                      class="text-indigo-600 cursor-pointer hover:text-indigo-900 font-semibold servi-yellow px-2 py-1 rounded-lg"
                    >
                      {{ trabajador.activo ? 'Desactivar' : 'Activar' }}
                    </button>
                    <button 
                      @click="RecuperarContraseña(trabajador.id)"
                      class="text-indigo-600 cursor-pointer hover:text-indigo-900 font-semibold servi-yellow px-2 py-1 rounded-lg"
                    >
                      Recuperar Contraseña
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>