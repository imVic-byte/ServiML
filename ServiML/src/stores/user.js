import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    trabajador: null,
    loading: true
  }),

  actions: {
    // Función auxiliar interna para buscar datos
    async fetchTrabajador() {
      if (!this.user) return
      
      const { data, error } = await supabase
        .from('trabajadores')
        .select('*')
        .eq('id', this.user.id)
        .single()
        
      if (!error) {
        this.trabajador = data
      }
    },

    async initializeAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      this.user = session?.user || null
      
      // Si recuperamos sesión, recuperamos también al trabajador
      if (this.user) {
        await this.fetchTrabajador()
      }
      
      this.loading = false

      supabase.auth.onAuthStateChange(async (_event, session) => {
        this.user = session?.user || null
        if (this.user && !this.trabajador) {
            await this.fetchTrabajador()
        } else if (!this.user) {
            this.trabajador = null
        }
      })
    },

    async signIn(email, password) {
      this.loading = true
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      
      this.user = data.user
      // Reutilizamos la lógica
      await this.fetchTrabajador()
      
      this.loading = false
    },

    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (!error) {
        this.user = null
        this.trabajador = null
      }
      // No dejamos loading en true, para permitir que se renderice el login
      this.loading = false 
    }
  }
})