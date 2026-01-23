import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient.js'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const router = useRouter()

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    user.value = data.user
    router.push('/')
  }

  const register = async (email, password, nombre) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: nombre
        }
      }
    })
    
    if (error) throw error
    
    return data 
  }

  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null
    router.push('/login')
  }

  return {
    user,
    signIn,
    register,
    logout
  }
})