import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
import { useInterfaz } from './interfaz'

// Variable externa para garantizar que solo exista UN listener (Singleton)
let authListener = null;

const withTimeout = (promise, timeoutMs = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ])
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    trabajador: null,
    loading: false,
    initialized: false
  }),

  actions: {
    async fetchTrabajador() {
      if (!this.user) return
      
      try {
        const { data, error } = await supabase
          .from('trabajadores')
          .select('*')
          .eq('id', this.user.id)
          .single()
        
        // No lanzamos error (throw) para evitar romper el flujo de auth, solo logueamos
        if (error) {
            console.warn('Usuario sin perfil de trabajador:', error.message)
        } else if (data) {
          this.trabajador = data
        }
      } catch (error) {
        console.error('Error fetching trabajador:', error.message)
      }
    },

    async initializeAuth() {
      // BLINDAJE 1: Si ya estamos escuchando, no crear otro listener.
      // Esto previene el bloqueo a los 3-4 minutos.
      if (authListener) {
          return; 
      }

      this.loading = true
      const uiStore = useInterfaz()

      try {
        // 1. Obtener sesión inicial
        const { data } = await supabase.auth.getSession()
        this.user = data.session?.user || null

        if (this.user) {
          await this.fetchTrabajador()
        }

        // 2. Crear el Listener ÚNICO
        const { data: authData } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log(`Auth Event: ${event}`) // Debug para ver si se repite
          
          this.user = session?.user || null
          
          if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
             this.trabajador = null
             this.user = null
             // BLINDAJE 2: Si la sesión muere, quitamos el loading a la fuerza
             uiStore.hideLoading()
          } 
          else if (event === 'SIGNED_IN' || (this.user && !this.trabajador)) {
             await this.fetchTrabajador()
          }
        })

        // Guardamos la referencia para evitar duplicados
        authListener = authData.subscription

      } catch (error) {
        console.error('Error en Auth:', error)
      } finally {
        this.loading = false
        this.initialized = true
      }
    },

    async signIn(email, password) {
      this.loading = true
      try {
        const { data, error } = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }), 
            8000
        )
        
        if (error) throw error
        
        this.user = data.user
        await this.fetchTrabajador() 
        
        // Forzamos la inicialización del listener si no existía
        if (!authListener) {
            await this.initializeAuth()
        }
        
        return true
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async signOut() {
      const uiStore = useInterfaz()
      try {
          uiStore.showLoading()
          await supabase.auth.signOut()
          
          // Limpieza total
          this.user = null
          this.trabajador = null
          this.initialized = false
          
          // Importante: Matar el listener al salir
          if (authListener) {
              authListener.unsubscribe()
              authListener = null
          }
      } finally {
          uiStore.hideLoading()
      }
    }
  }
})