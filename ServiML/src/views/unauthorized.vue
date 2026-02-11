<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const volverAlInicio = () => {
  router.push('/')
}
</script>

<template>
  <div class="unauthorized-container">
    <div class="card">
      <div class="icon-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="lock-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>

      <h1>Acceso Restringido</h1>
      
      <p class="message">
        Lo sentimos, tu perfil de usuario no tiene los permisos necesarios para visualizar esta sección.
      </p>

      <div class="divider"></div>

      <p class="sub-message">
        Si crees que esto es un error, contacta al administrador del sistema.
      </p>

      <button @click="volverAlInicio" class="btn-back">
        Volver al Dashboard
      </button>
    </div>
  </div>
</template>

<style scoped>
.unauthorized-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f1f5f9;
  padding: 1rem;
}

.card {
  background-color: white;
  width: 100%;
  max-width: 420px;
  padding: 3rem 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  text-align: center;
  border: 1px solid #e2e8f0;
}

.icon-wrapper {
  background-color: #FEF3C7; 
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 1.5rem auto;
}

.lock-icon {
  width: 40px;
  height: 40px;
  color: #D97706; 
}

h1 {
  color: #1f3d64; 
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.message {
  color: #475569;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.divider {
  height: 1px;
  background-color: #e2e8f0;
  margin: 1.5rem 0;
}

.sub-message {
  color: #94a3b8;
  font-size: 0.875rem;
  margin-bottom: 2rem;
}

.btn-back {
  background-color: #1f3d64;
  color: #D8B462; 
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.btn-back:hover {
  background-color: #0f172a;
  transform: translateY(-1px);
}

.btn-back:active {
  transform: translateY(0);
}
</style>