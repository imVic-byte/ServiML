<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const nombre = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const cargando = ref(false)

const userStore = useUserStore()
const router = useRouter()

const handleRegister = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Las contraseñas no coinciden'
    return
  }

  if (password.value.length < 6) {
    errorMsg.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  try {
    cargando.value = true
    const data = await userStore.register(email.value, password.value, nombre.value)
    
    if (data.session) {
      router.push('/')
    } else if (data.user) {
      successMsg.value = 'Cuenta creada. Por favor verifica tu correo electrónico para continuar.'
    }
    
  } catch (error) {
    errorMsg.value = error.message
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="register-container">
    <div class="card">
      <h1>Crear Cuenta</h1>
      <p class="subtitle">Registrar nuevo usuario en ServiML</p>

      <form @submit.prevent="handleRegister" v-if="!successMsg">
        <div class="input-group">
          <label>Nombre Completo</label>
          <input v-model="nombre" type="text" required placeholder="Juan Pérez" />
        </div>

        <div class="input-group">
          <label>Email</label>
          <input v-model="email" type="email" required placeholder="usuario@serviml.cl" />
        </div>

        <div class="input-group">
          <label>Contraseña</label>
          <input v-model="password" type="password" required placeholder="Mínimo 6 caracteres" />
        </div>

        <div class="input-group">
          <label>Confirmar Contraseña</label>
          <input v-model="confirmPassword" type="password" required placeholder="Repite la contraseña" />
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

        <button type="submit" :disabled="cargando">
          {{ cargando ? 'Procesando...' : 'Registrarse' }}
        </button>
      </form>

      <div v-else class="success-message">
        <h3>¡Registro Exitoso!</h3>
        <p>{{ successMsg }}</p>
        <button @click="router.push('/login')">Ir al Login</button>
      </div>

      <div class="footer-link">
        <p>¿Ya tienes cuenta? <router-link to="/login">Inicia sesión aquí</router-link></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f3f4f6;
  padding: 1rem;
}
.card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}
h1 {
  text-align: center;
  color: #1a3a8a;
  margin: 0;
}
.subtitle {
  text-align: center;
  color: #6b7280;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}
.input-group {
  margin-bottom: 1rem;
}
label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}
input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-sizing: border-box;
}
.error {
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #fee2e2;
  border-radius: 4px;
}
.success-message {
  text-align: center;
  color: #059669;
}
button {
  width: 100%;
  padding: 0.75rem;
  background-color: #1a3a8a;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
}
button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}
.footer-link {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
}
a {
  color: #1a3a8a;
  text-decoration: none;
  font-weight: bold;
}
</style>