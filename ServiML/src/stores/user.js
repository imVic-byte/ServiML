// stores/user.js
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
import { useInterfaz } from './interfaz'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    trabajador: null, // Aquí vivirá el perfil con el campo 'rol'
    loading: false,
    initialized: false,
    subscription: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.trabajador?.rol === 'Administrador',
    isTrabajador: (state) => state.trabajador?.rol === 'Trabajador',
    isGerente: (state) => state.trabajador?.rol === 'Gerente',
    isSoporte: (state) => state.trabajador?.rol === 'Soporte',
    WhatIsMyRole: (state) => state.trabajador?.rol,
    havePrivileges: (state) => state.trabajador?.rol === 'Administrador' || state.trabajador?.rol === 'Gerente' || state.trabajador?.rol === 'Soporte', 
  },

  actions: {
    async fetchTrabajador() {
      if (!this.user) return

      try {
        const { data, error } = await supabase
          .from('trabajadores')
          .select('*')
          .eq('id', this.user.id) 
          .single()
        
        if (error) throw error
        if (data.activo ==false) {
          await supabase.auth.signOut()
          this.user = null
          this.trabajador = null
          throw new Error('Su cuenta ha sido desactivada, contacte a su administrador.')
        }
        this.trabajador = data
      } catch (error) {
        console.error('Error fetching trabajador:', error.message)
        this.trabajador = null
        this.user = null
        window.location.href = '/login'
      }
    },

    async initializeAuth() {
      if (this.subscription) return 

      const uiStore = useInterfaz()
      this.loading = true

      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          this.user = session.user
          await this.fetchTrabajador() 
        }

        const { data: authData } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            if (session.user.id !== this.user?.id) {
              this.user = session.user
              await this.fetchTrabajador()
            }
          } else {
            this.user = null
            this.trabajador = null
          }
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
      uiStore.showLoading() 

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        
        this.user = data.user
        await this.fetchTrabajador()
        
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
        uiStore.showLoading()
        try {
            await supabase.auth.signOut()
            this.user = null
            this.trabajador = null
        } catch(e) {
            console.error(e)
        } finally {
            uiStore.hideLoading()
        }
    }
  }
})