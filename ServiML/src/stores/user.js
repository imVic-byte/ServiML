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
    loading: true
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
        
        if (error) {
          this.trabajador = null
        } else {
          this.trabajador = data
        }
      } catch (error) {
        console.error(error)
      }
    },

    async initializeAuth() {
      this.loading = true
      try {
        const { data } = await supabase.auth.getSession()
        this.user = data.session?.user || null

        if (this.user) {
          await this.fetchTrabajador()
        }

        supabase.auth.onAuthStateChange(async (event, session) => {
          this.user = session?.user || null
          
          if (this.user) {
             if (!this.trabajador) await this.fetchTrabajador()
          } else {
             this.trabajador = null
          }
        })

      } catch (error) {
        console.error(error)
      } finally {
        this.loading = false
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