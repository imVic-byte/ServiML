<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const router = useRouter()
const userStore = useUserStore()

const handleLogin = async () => {
  try {
    await userStore.signIn(email.value, password.value)
    router.push('/') 
  } catch (error) {
    errorMsg.value = error.message
  }
}
</script>

<template>
  <div class="login-container">
    <div class="card">
      <h1>Iniciar Sesión</h1>
      <p>Bienvenido a ServiML</p>

      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label>Email</label>
          <input v-model="email" type="email" required placeholder="correo@ejemplo.com" />
        </div>

        <div class="input-group">
          <label>Contraseña</label>
          <input v-model="password" type="password" required placeholder="••••••" />
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

        <button type="submit">Ingresar</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f3f4f6;
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
  color: #1f3d64;
  margin-bottom: 0.5rem;
}
p {
  text-align: center;
  color: #6b7280;
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
button:hover {
  background-color: #1e40af;
}
</style>