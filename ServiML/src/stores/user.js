import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
import { useInterfaz } from './interfaz'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    trabajador: null,
    loading: false,
    initialized: false,
    subscription: null
  }),

  actions: {
    async fetchTrabajador() {
      if (!this.user) return
      // Pequeña optimización: si ya tenemos datos y es el mismo ID, no recargamos
      if (this.trabajador && this.trabajador.id === this.user.id) return

      try {
        const { data } = await supabase
          .from('trabajadores')
          .select('*')
          .eq('id', this.user.id)
          .single()
        
        if (data) this.trabajador = data
      } catch (error) {
        console.warn('Error fetching trabajador:', error.message)
      }
    },

    async initializeAuth() {
      // Si ya hay suscripción activa, no hacemos nada
      if (this.subscription) return 

      const uiStore = useInterfaz()

      try {
        // 1. Carga inicial
        const { data } = await supabase.auth.getSession()
        this.user = data.session?.user || null

        if (this.user) {
            await this.fetchTrabajador()
        }

        // 2. Listener protegido (EL ARREGLO ESTÁ AQUI)
        const { data: authData } = supabase.auth.onAuthStateChange(async (event, session) => {
          
          const incomingUser = session?.user || null
          const currentUserId = this.user?.id
          const incomingUserId = incomingUser?.id

          // CASO A: Logout o usuario eliminado
          if (event === 'SIGNED_OUT' || event === 'USER_DELETED' || !incomingUser) {
             this.user = null
             this.trabajador = null
             this.subscription = null
             this.initialized = false
             uiStore.hideLoading()
             return
          }

          // CASO B: El Guardián de IDs (ESTO EVITA EL CONGELAMIENTO)
          // Si el usuario que llega es el mismo que ya tenemos, NO HACEMOS NADA.
          if (currentUserId === incomingUserId) {
              return 
          }

          // CASO C: Login real (usuario diferente)
          this.user = incomingUser
          await this.fetchTrabajador()
        })

        this.subscription = authData.subscription

      } catch (error) {
        console.error('Error Auth:', error)
      } finally {
        this.loading = false
        this.initialized = true
        uiStore.hideLoading()
      }
    },

    async signIn(email, password) {
      const uiStore = useInterfaz()
      this.loading = true
      try {
        uiStore.showLoading()
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        
        this.user = data.user
        await this.fetchTrabajador()
        
        if (!this.subscription) await this.initializeAuth()
        
        return true
      } catch (error) {
        throw error
      } finally {
        this.loading = false
        uiStore.hideLoading()
      }
    },

    async signOut() {
      const uiStore = useInterfaz()
      try {
        uiStore.showLoading()
        
        if (this.subscription) {
            this.subscription.unsubscribe()
            this.subscription = null
        }
        
        await supabase.auth.signOut()
        
        this.user = null
        this.trabajador = null
        this.initialized = false
        
      } catch (error) {
        console.error('Error al salir:', error)
      } finally {
        uiStore.hideLoading()
      }
    }
  }
})