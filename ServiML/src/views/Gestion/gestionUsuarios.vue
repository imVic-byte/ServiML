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
  }
};

onMounted(async () => {
  interfaz.showLoading();
  await obtenerTrabajadores();
  interfaz.hideLoading();
});
</script>

<template>
  <navbar class="navbar" titulo="Gestión de Personal" subtitulo="Administra los usuarios y sus permisos de acceso." />
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-end items-center mb-6 sm:justify-between">
        <div class="sm:block hidden">
          <h1 class="text-2xl font-bold text-gray-900">Gestión de Personal</h1>
          <p class="text-sm text-gray-500 mt-1">Administra los usuarios y sus permisos de acceso.</p>
        </div>
        <div class="flex gap-2">
          <button 
          @click="obtenerTrabajadores" 
          class="px-4 cursor-pointer py-2 servi-yellow servi-blue-font border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
        <button @click="invitarUsuario" class="px-4 cursor-pointer py-2 servi-yellow servi-blue-font border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
        </button>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div v-if="cargando" class="p-8 text-center text-gray-500">
          Cargando datos del personal...
        </div>

        <div v-else-if="errorMsg" class="p-8 text-center text-red-600 bg-red-50">
          {{ errorMsg }}
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="servi-blue servi-yellow-font">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">
                  Trabajador
                </th>
                <th scope="col" class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">
                  Contacto
                </th>
                <th scope="col" class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">
                  Rol
                </th>
                <th scope="col" class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" class="px-6 py-3 text-right text-sm font-medium uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="trabajador in trabajadores" :key="trabajador.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {{ trabajador.nombre ? trabajador.nombre.charAt(0).toUpperCase() : '?' }}
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ trabajador.nombre }} {{ trabajador.apellido }}
                      </div>
                      <div class="text-sm text-gray-500">
                        RUT: {{ trabajador.rut || 'No registrado' }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ trabajador.email }}</div>
                  <div class="text-sm text-gray-500">{{ trabajador.telefono || 'Sin teléfono' }}</div>
                </td>

                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="{
                      'bg-purple-100 text-purple-800': trabajador.rol === 'Administrador',
                      'bg-blue-100 text-blue-800': trabajador.rol === 'Gerente',
                      'bg-gray-100 text-gray-800': trabajador.rol === 'Mecánico' || trabajador.rol === 'Trabajador'
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

                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    @click="alternarEstado(trabajador.id, trabajador.activo)"
                    class="text-indigo-600 hover:text-indigo-900 font-semibold"
                  >
                    {{ trabajador.activo ? 'Desactivar' : 'Activar' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>