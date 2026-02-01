<script setup>
import { ref } from 'vue';
import { useUserStore } from '../../stores/user.js';

const userStore = useUserStore();

const nuevoUsuario = ref({
  nombre: '',
  apellido: '',
  rut: '',
  email: '',
  telefono: '',
  rol: 'Mecánico'
});

const enviando = ref(false);
const mensaje = ref({ texto: '', tipo: '' });

const gestionarInvitacion = async () => {
  enviando.value = true;
  mensaje.value = { texto: '', tipo: '' };

  try {
    await userStore.invitarTrabajador(nuevoUsuario.value);
    mensaje.value = { texto: 'Invitación enviada con éxito.', tipo: 'success' };
    nuevoUsuario.value = { nombre: '', apellido: '', rut: '', email: '', telefono: '', rol: 'Mecánico' };
  } catch (error) {
    mensaje.value = { texto: 'Error: ' + error.message, tipo: 'error' };
  } finally {
    enviando.value = false;
  }
};
</script>

<template>
  <div class="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
    <h2 class="text-2xl font-bold mb-6 servi-blue-font">Registrar Nuevo Trabajador</h2>
    
    <form @submit.prevent="gestionarInvitacion" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Nombre</label>
        <input v-model="nuevoUsuario.nombre" type="text" required class="mt-1 block w-full border border-gray-300 rounded-md p-2" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Apellido</label>
        <input v-model="nuevoUsuario.apellido" type="text" required class="mt-1 block w-full border border-gray-300 rounded-md p-2" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">RUT</label>
        <input v-model="nuevoUsuario.rut" type="text" placeholder="12.345.678-9" required class="mt-1 block w-full border border-gray-300 rounded-md p-2" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Email</label>
        <input v-model="nuevoUsuario.email" type="email" required class="mt-1 block w-full border border-gray-300 rounded-md p-2" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Teléfono</label>
        <input v-model="nuevoUsuario.telefono" type="text" required class="mt-1 block w-full border border-gray-300 rounded-md p-2" />
      </div>

      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700">Rol en el Sistema</label>
        <select v-model="nuevoUsuario.rol" class="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white">
          <option value="Mecánico">Mecánico</option>
          <option value="Administrador">Administrador</option>
          <option value="Gerente">Gerente</option>
        </select>
      </div>

      <div class="md:col-span-2 mt-4">
        <button 
          type="submit" 
          :disabled="enviando"
          class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {{ enviando ? 'Enviando invitación...' : 'Crear Cuenta e Invitar' }}
        </button>
      </div>
    </form>

    <p v-if="mensaje.texto" :class="mensaje.tipo === 'success' ? 'text-green-600' : 'text-red-600'" class="mt-4 text-center font-bold">
      {{ mensaje.texto }}
    </p>
  </div>
</template>