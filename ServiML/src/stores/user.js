import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'

// Helper para timeout (Lo mantenemos, es útil)
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
    loading: false // Iniciamos en false para evitar bloqueos fantasmas
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
          console.warn('No se encontró perfil de trabajador')
          this.trabajador = null
        } else {
          this.trabajador = data
        }
      } catch (error) {
        console.error('Error fetching trabajador:', error)
      }
    },

    async initializeAuth() {
      // Solo escuchamos cambios. Supabase dispara el evento INITIAL_SESSION automáticamente al cargar
      supabase.auth.onAuthStateChange(async (event, session) => {
        this.user = session?.user || null
        
        if (this.user) {
            // Solo buscamos si no tenemos datos ya, para no sobrecargar
            if (!this.trabajador) await this.fetchTrabajador()
        } else {
            this.trabajador = null
        }
      })
    },

    async signIn(email, password) {
      this.loading = true
      try {
        // 1. Solo pedimos autenticación a Supabase
        const { data, error } = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }), 
            8000
        )
        
        if (error) throw error
        
        // 2. Asignamos usuario para respuesta inmediata de la UI
        this.user = data.user
        
        // 3. NO llamamos a fetchTrabajador aquí. 
        // El onAuthStateChange (arriba) detectará el cambio y lo hará solo.
        
        return true // Retornamos true explícito para el componente
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
      // No tocamos loading aquí
    }
  }
})