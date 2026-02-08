import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'

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
        
        if (error) throw error

        if (data) {
          this.trabajador = data
        }
      } catch (error) {
        console.error('Error fetching trabajador:', error.message)
      }
    },

    async initializeAuth() {
      if (this.initialized) return
      this.loading = true
      try {
        const { data } = await supabase.auth.getSession()
        this.user = data.session?.user || null

        if (this.user) {
          await this.fetchTrabajador()
        }

        supabase.auth.onAuthStateChange(async (event, session) => {
          const previousUser = this.user
          this.user = session?.user || null
          
          if (event === 'SIGNED_OUT' || !this.user) {
             this.trabajador = null
             this.user = null
          } else if (event === 'SIGNED_IN' || (this.user && !this.trabajador)) {
             await this.fetchTrabajador()
          } else if (event === 'TOKEN_REFRESHED') {
          }
        })

      } catch (error) {
        console.error(error)
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
        
        return true
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async signOut() {
      await supabase.auth.signOut()
      this.user = null
      this.trabajador = null
    }
  }
})