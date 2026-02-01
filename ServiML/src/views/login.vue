<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

const router = useRouter()
const userStore = useUserStore()

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    // Si esta línea termina sin error, el login fue exitoso
    await userStore.signIn(email.value, password.value)
    
    // Redirección directa y forzada
    router.replace('/')
    
  } catch (error) {
    console.error("Error en login:", error)
    // Mensaje de error más amigable si es timeout
    if (error.message.includes('timeout')) {
        errorMsg.value = 'El servidor tarda en responder. Verifica tu conexión.'
    } else {
        errorMsg.value = 'Credenciales incorrectas o error de conexión.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card servi-blue">
      
      <div class="card-header">
        <img src="../img/Logo2.png" alt="Logo ServiML" class="logo">
        <h1>Iniciar Sesión</h1>
        <p>Sistema de Auditoría ServiML</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label>Correo Electrónico</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            placeholder="usuario@serviml.cl" 
            :disabled="loading"
          />
        </div>

        <div class="input-group">
          <label>Contraseña</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            placeholder="••••••••" 
            :disabled="loading"
          />
        </div>

        <div v-if="errorMsg" class="error-container">
          {{ errorMsg }}
        </div>

        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Autenticando...' : 'Ingresar al Sistema' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Definición de colores locales para consistencia */
.login-wrapper {
  --servi-blue: #1f3d64; /* Azul corporativo profundo */
  --servi-dark: #0f172a; /* Fondo oscuro */
  --servi-gold: #D8B462; /* Dorado brillante */
  --servi-gold-hover: #d97706; /* Dorado más oscuro para hover */
  --text-white: #f8fafc;
  
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at center, #1e293b 0%, var(--servi-dark) 100%);
  padding: 1rem;
}

.login-card {
  background-color: var(--servi-blue);
  width: 100%;
  max-width: 420px;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  text-align: center;
}

.logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 1rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

h1 {
  color: var(--servi-gold);
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
}

p {
  color: #94a3b8;
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

.input-group {
  margin-bottom: 1.25rem;
}

label {
  display: block;
  color: var(--servi-gold);
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  margin-left: 0.25rem;
}

input {
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  border: 2px solid transparent;
  background-color: rgba(255, 255, 255, 0.95);
  color: #334155;
  font-size: 1rem;
  transition: all 0.2s ease;
  outline: none;
  box-sizing: border-box; /* Asegura que el padding no rompa el ancho */
}

input:focus {
  background-color: #ffffff;
  border-color: var(--servi-gold);
  box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.2);
}

input:disabled {
  background-color: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}

.btn-primary {
  width: 100%;
  padding: 1rem;
  background-color: var(--servi-gold);
  color: var(--servi-blue);
  border: none;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  margin-top: 1rem;
  transition: transform 0.1s ease, background-color 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--servi-gold-hover);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.error-container {
  background-color: rgba(220, 38, 38, 0.15);
  border: 1px solid #ef4444;
  color: #fca5a5;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 1rem;
}
</style>