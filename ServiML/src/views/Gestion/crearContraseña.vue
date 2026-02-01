<script setup>
import { ref } from 'vue';
import { supabase } from '../../lib/supabaseClient.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const password = ref('');
const confirmPassword = ref('');
const enviando = ref(false);
const errorMsg = ref('');

const actualizarPassword = async () => {
  if (password.value !== confirmPassword.value) {
    errorMsg.value = "Las contraseñas no coinciden.";
    return;
  }

  if (password.value.length < 6) {
    errorMsg.value = "La contraseña debe tener al menos 6 caracteres.";
    return;
  }

  enviando.value = true;
  errorMsg.value = '';

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    });

    if (error) throw error;

    alert("Contraseña establecida con éxito. Bienvenida/o al sistema.");
    router.push('/');
  } catch (error) {
    errorMsg.value = "Error al actualizar: " + error.message;
  } finally {
    enviando.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
      <h2 class="text-2xl font-bold servi-blue-font mb-2 text-center">Configura tu cuenta</h2>
      <p class="text-gray-500 text-sm text-center mb-6">Ingresa tu nueva contraseña para acceder al sistema.</p>

      <form @submit.prevent="actualizarPassword" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            class="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
          <input 
            v-model="confirmPassword" 
            type="password" 
            required 
            class="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button 
          type="submit" 
          :disabled="enviando"
          class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {{ enviando ? 'Guardando...' : 'Establecer Contraseña' }}
        </button>

        <p v-if="errorMsg" class="text-red-500 text-sm text-center font-bold">
          {{ errorMsg }}
        </p>
      </form>
    </div>
  </div>
</template>