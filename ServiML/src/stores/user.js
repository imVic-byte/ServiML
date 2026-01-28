import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabaseClient.js'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const trabajador = ref(null)
  const rol = ref(null)
  const router = useRouter()

  const isGerente = computed(() => {
    return rol.value === 'Gerente'
  })

  const obtenerTrabajador = async () => {
    const { data: authData } = await supabase.auth.getUser()
    if (authData?.user) {
      user.value = authData.user
      const { data: trabajadorData } = await supabase
        .from('trabajadores')
        .select('*')
        .eq('id', user.value.id) 
        .single()
        
      if (trabajadorData) {
        trabajador.value = trabajadorData
        rol.value = trabajadorData.rol
      }
    } else {
        user.value = null
        trabajador.value = null
        rol.value = null
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    
    user.value = data.user
    await obtenerTrabajador()
    router.push('/')
  }

  

  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null
    trabajador.value = null
    rol.value = null
    router.push('/login')
  }

  const invitarTrabajador = async (datos) => {
    const { data, error } = await supabase.functions.invoke('smart-action', {
      body:datos
    })
    if(error) throw error
    return data
  };

  return {
    user,
    trabajador,
    rol,
    isGerente,
    obtenerTrabajador,
    signIn,
    logout,
    invitarTrabajador
  }
})