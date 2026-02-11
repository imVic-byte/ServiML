<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabaseClient'
import { useUserStore } from '../../stores/user'
import { useInterfaz } from '@/stores/interfaz.js';
import navbar from '@/components/componentes/navbar.vue';

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const message = ref('')
const isError = ref(false)
const router = useRouter()
const userStore = useUserStore()
const interfaz = useInterfaz();
const showPassword = ref(false)
const showConfirm = ref(false)

// --- Password validation rules ---
const reglas = computed(() => [
  { label: 'Mínimo 8 caracteres', cumple: password.value.length >= 8 },
  { label: 'Una letra mayúscula', cumple: /[A-Z]/.test(password.value) },
  { label: 'Una letra minúscula', cumple: /[a-z]/.test(password.value) },
  { label: 'Un número', cumple: /[0-9]/.test(password.value) },
  { label: 'Un carácter especial (!@#$%...)', cumple: /[^A-Za-z0-9]/.test(password.value) },
]);

const reglasCumplidas = computed(() => reglas.value.filter(r => r.cumple).length);
const totalReglas = computed(() => reglas.value.length);
const porcentajeFuerza = computed(() => (reglasCumplidas.value / totalReglas.value) * 100);

const fuerzaLabel = computed(() => {
  const p = reglasCumplidas.value;
  if (p === 0) return '';
  if (p <= 2) return 'Débil';
  if (p <= 3) return 'Regular';
  if (p <= 4) return 'Buena';
  return 'Excelente';
});

const fuerzaColor = computed(() => {
  const p = reglasCumplidas.value;
  if (p <= 2) return '#ef4444';
  if (p <= 3) return '#f59e0b';
  if (p <= 4) return '#3b82f6';
  return '#22c55e';
});

const passwordsCoinciden = computed(() => {
  if (!confirmPassword.value) return null;
  return password.value === confirmPassword.value;
});

const puedeEnviar = computed(() => {
  return reglasCumplidas.value === totalReglas.value && passwordsCoinciden.value === true;
});

onMounted(async () => {
    interfaz.showLoading();
    await supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            router.push('/login')
        }
    })
    interfaz.hideLoading();
})

const updatePassword = async () => {
  if (!puedeEnviar.value) {
    message.value = 'Completa todos los requisitos antes de continuar.';
    isError.value = true;
    return;
  }

  loading.value = true;
  message.value = '';
  isError.value = false;
  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    })

    if (error) throw error

    alert('Contraseña establecida. Bienvenido a ServiML.')
    
    await userStore.initializeAuth()
    router.push('/') 

  } catch (error) {
    message.value = error.message;
    isError.value = true;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="page-wrapper">
    <navbar 
      titulo="Bienvenido al Equipo" 
      subtitulo="Activa tu cuenta profesional" 
      class="fixed-nav"
    />
    
    <div class="content-container">
      <div class="password-card">
        <div class="header-section">
          <h1>Crear Contraseña</h1>
          <p>Establece una clave segura para acceder al sistema ServiML.</p>
        </div>
        
        <div class="form-section">
          <div class="input-group">
            <label>Nueva Contraseña</label>
            <div class="input-wrapper">
              <input 
                v-model="password" 
                :type="showPassword ? 'text' : 'password'" 
                placeholder="••••••••" 
                class="servi-input"
              />
              <button type="button" class="eye-btn" @click="showPassword = !showPassword" tabindex="-1">
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="eye-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="eye-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
              </button>
            </div>
          </div>

          <!-- Strength bar -->
          <div v-if="password" class="strength-section">
            <div class="strength-bar-bg">
              <div class="strength-bar-fill" :style="{ width: porcentajeFuerza + '%', backgroundColor: fuerzaColor }"></div>
            </div>
            <div class="strength-label" :style="{ color: fuerzaColor }">
              {{ fuerzaLabel }}
            </div>

            <!-- Rules checklist -->
            <ul class="rules-list">
              <li v-for="(regla, i) in reglas" :key="i" :class="{ cumplida: regla.cumple }">
                <span class="rule-icon">{{ regla.cumple ? '✓' : '✗' }}</span>
                {{ regla.label }}
              </li>
            </ul>
          </div>

          <div class="input-group">
            <label>Confirmar Contraseña</label>
            <div class="input-wrapper">
              <input 
                v-model="confirmPassword" 
                :type="showConfirm ? 'text' : 'password'" 
                placeholder="••••••••" 
                class="servi-input"
                :class="{ 'input-error': passwordsCoinciden === false, 'input-ok': passwordsCoinciden === true }"
              />
              <button type="button" class="eye-btn" @click="showConfirm = !showConfirm" tabindex="-1">
                <svg v-if="!showConfirm" xmlns="http://www.w3.org/2000/svg" class="eye-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="eye-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
              </button>
            </div>
            <p v-if="passwordsCoinciden === false" class="match-msg error-text">Las contraseñas no coinciden</p>
            <p v-else-if="passwordsCoinciden === true" class="match-msg ok-text">Las contraseñas coinciden ✓</p>
          </div>
          
          <div v-if="message" class="message-box" :class="{ 'error': isError }">
            {{ message }}
          </div>
          
          <button @click="updatePassword" :disabled="loading || !puedeEnviar" class="btn-action" :class="{ 'btn-disabled': !puedeEnviar }">
            {{ loading ? 'Activando...' : 'Activar Cuenta' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  --servi-blue: #1f3d64;
  --servi-dark: #0f172a;
  --servi-gold: #D8B462;
  --servi-gold-hover: #b49040;
  --text-light: #f1f5f9;
  
  min-height: 100vh;
  background-color: var(--servi-dark);
  background-image: radial-gradient(circle at 50% 0%, #1e293b 0%, var(--servi-dark) 75%);
  display: flex;
  flex-direction: column;
}

.content-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  margin-top: 60px;
}

.password-card {
  background-color: var(--servi-blue);
  width: 100%;
  max-width: 480px;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.header-section h1 {
  color: var(--servi-gold);
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.header-section p {
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.5;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  color: var(--text-light);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.servi-input {
  width: 100%;
  padding: 0.9rem 1rem;
  background-color: rgba(255, 255, 255, 0.95);
  border: 2px solid transparent;
  border-radius: 8px;
  font-size: 1rem;
  color: #334155;
  transition: all 0.2s ease;
  outline: none;
  box-sizing: border-box;
}

.input-wrapper {
  position: relative;
}

.input-wrapper .servi-input {
  padding-right: 3rem;
}

.eye-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #94a3b8;
  transition: color 0.2s;
}

.eye-btn:hover {
  color: var(--servi-gold);
}

.eye-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.servi-input:focus {
  background-color: #fff;
  border-color: var(--servi-gold);
  box-shadow: 0 0 0 4px rgba(216, 180, 98, 0.2);
}

.btn-action {
  width: 100%;
  padding: 1rem;
  background-color: var(--servi-gold);
  color: var(--servi-blue);
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: transform 0.1s, background-color 0.2s;
}

.btn-action:hover:not(:disabled) {
  background-color: var(--servi-gold-hover);
  transform: translateY(-1px);
}

.btn-action:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-action:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.message-box {
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-light);
}

.message-box.error {
  background-color: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

/* Strength bar */
.strength-section {
  margin-bottom: 1.5rem;
}

.strength-bar-bg {
  width: 100%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.4rem;
}

.strength-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.strength-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-align: right;
  transition: color 0.3s ease;
}

/* Rules checklist */
.rules-list {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}

.rules-list li {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: color 0.2s ease;
}

.rules-list li.cumplida {
  color: #4ade80;
}

.rule-icon {
  font-weight: 700;
  font-size: 0.85rem;
  width: 1rem;
  text-align: center;
  flex-shrink: 0;
}

/* Password match feedback */
.input-error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15) !important;
}

.input-ok {
  border-color: #22c55e !important;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15) !important;
}

.match-msg {
  margin-top: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.error-text { color: #fca5a5; }
.ok-text { color: #4ade80; }

/* Disabled button */
.btn-disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}
</style>