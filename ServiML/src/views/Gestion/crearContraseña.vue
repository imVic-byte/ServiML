<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabaseClient'
import { useUserStore } from '../../stores/user'

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const message = ref('')
const router = useRouter()
const userStore = useUserStore()

onMounted(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            router.push('/login')
        }
    })
})

const updatePassword = async () => {
  if (password.value !== confirmPassword.value) {
    message.value = "Las contraseñas no coinciden"
    return
  }

  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    })

    if (error) throw error

    alert('Contraseña establecida. Bienvenido a ServiML.')
    
    await userStore.initializeAuth()
    router.push('/') 

  } catch (error) {
    message.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="password-wrapper">
    <h1>Bienvenido a ServiML</h1>
    <p>Establece tu contraseña para activar tu cuenta.</p>
    
    <input v-model="password" type="password" placeholder="Nueva Contraseña" />
    <input v-model="confirmPassword" type="password" placeholder="Confirmar Contraseña" />
    
    <p class="error">{{ message }}</p>
    
    <button @click="updatePassword" :disabled="loading">
      {{ loading ? 'Guardando...' : 'Activar Cuenta' }}
    </button>
  </div>
</template>