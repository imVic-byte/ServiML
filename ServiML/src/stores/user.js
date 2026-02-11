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
    // 1. Getter útil para preguntar permisos rápidamente en el template o router
    userRole: (state) => state.trabajador?.rol,
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    async fetchTrabajador() {
      if (!this.user) return

      try {
        const { data, error } = await supabase
          .from('trabajadores')
          .select('*')
          .eq('id', this.user.id) // Asumiendo que id en trabajadores es el mismo UUID de auth
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
        // 1. Verificar sesión actual al cargar la página
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          this.user = session.user
          await this.fetchTrabajador() // Cargamos el rol inmediatamente
        }

        // 2. Configurar el listener
        const { data: authData } = supabase.auth.onAuthStateChange(async (event, session) => {
          // Simplificamos la lógica. Si hay sesión, actualizamos. Si no, limpiamos.
          if (session?.user) {
            // Solo actualizamos si el usuario cambió para evitar loops
            if (session.user.id !== this.user?.id) {
              this.user = session.user
              await this.fetchTrabajador()
            }
          } else {
            // Logout
            this.user = null
            this.trabajador = null
          }
        })

        this.subscription = authData.subscription

      } catch (error) {
        console.error('Error Auth:', error)
      } finally {
        this.loading = false
        this.initialized = true // Marcamos como listo para que el Router sepa que puede proceder
        uiStore.hideLoading()
      }
    },

    async signIn(email, password) {
      const uiStore = useInterfaz()
      this.loading = true
      uiStore.showLoading() // Muestra loader

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        
        // No necesitamos llamar a initializeAuth aquí ni a fetchTrabajador manualmente
        // El onAuthStateChange (si ya se inicializó en App.vue) lo detectará.
        // PERO, para feedback inmediato en el UI de Login, podemos setearlo:
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
            // El listener se encargará de limpiar el estado (this.user = null)
            // Pero podemos forzar limpieza local por si acaso
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