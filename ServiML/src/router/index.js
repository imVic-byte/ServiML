import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabaseClient.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ordenes-de-trabajo',
      name: 'ordenes-de-trabajo',
      component: () => import('../views/OrdenTrabajo/ordenTrabajoListado.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ordenes-de-trabajo/nuevo',
      name: 'nueva-orden-de-trabajo',
      component: () => import('../views/OrdenTrabajo/ordenTrabajoForm.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ordenes-de-trabajo/editar/:id',
      name: 'editar-orden-de-trabajo',
      component: () => import('../views/OrdenTrabajo/ordenTrabajoForm.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ordenes-de-trabajo/ver/:id',
      name: 'ver-orden-de-trabajo',
      component: () => import('../views/OrdenTrabajo/ordenTrabajoVer.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/configuracion',
      name: 'configuracion',
      component: () => import('../views/config.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/presupuestos',
      name: 'listado-presupuestos',
      component: () => import('../views/Presupuesto/presupuestoListado.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/presupuesto/:id',
      name: 'ver-presupuesto',
      component: () => import('../views/Presupuesto/presupuestoVer.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/presupuestos/nuevo',
      name: 'nuevo-presupuesto',
      component: () => import('../views/Presupuesto/presupuestoForm.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/presupuesto/:id/pdf',
      name: 'pdf-presupuesto',
      component: () => import('../views/Presupuesto/presupuestoPDF.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/gestion-usuarios',
      name: 'gestion-usuarios',
      component: () => import('../views/Gestion/gestionUsuarios.vue'),
      meta: { requiresAuth: true, gerente: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/register.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/set-password',
      name: 'crear-contraseña',
      component: () => import('../views/Gestion/crearContraseña.vue'),
      meta: { requiresAuth: false }
    }
  ],
})

router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()

  if (to.meta.requiresAuth && !session) {
    next('/login')
    return
  }

  if (session && (to.path === '/login' || to.path === '/register')) {
    next('/')
    return
  }

  next()
})

export default router