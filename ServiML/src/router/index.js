import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabaseClient.js'
import { useUserStore } from '../stores/user.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/dashboard.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Trabajador', 'Gerente', 'Soporte']
       }
    },
    {
      path: '/ordenes-de-trabajo',
      name: 'ordenes-de-trabajo',
      component: () => import('../views/OrdenTrabajo/ordenTrabajoListado.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Trabajador', 'Gerente', 'Soporte']
      }
    },
    {
      path: '/ordenes-de-trabajo/ver/:id',
      name: 'ver-orden-de-trabajo',
      component: () => import('../views/OrdenTrabajo/ordenTrabajoVer.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Trabajador', 'Gerente', 'Soporte']
      }
    },
    {
      path: '/configuracion',
      name: 'configuracion',
      component: () => import('../views/config.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte', 'Trabajador']
      }
    },
    {
      path: '/presupuestos',
      name: 'listado-presupuestos',
      component: () => import('../views/Presupuesto/presupuestoListado.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte']
      }
    },
    {
      path: '/presupuesto/:id',
      name: 'ver-presupuesto',
      component: () => import('../views/Presupuesto/presupuestoVer.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte']
      }
    },
    {
      path: '/presupuestos/nuevo',
      name: 'nuevo-presupuesto',
      component: () => import('../views/Presupuesto/presupuestoForm.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte']
      }
    },
    {
      path: '/presupuesto/:id/pdf',
      name: 'pdf-presupuesto',
      component: () => import('../views/Presupuesto/presupuestoPDF.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte']
      }
    },
    {
      path: '/gestion-usuarios',
      name: 'gestion-usuarios',
      component: () => import('../views/Gestion/gestionUsuarios.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte']
      }
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
      path: '/crear-contrasena',
      name: 'crear-contraseña',
      component: () => import('../views/Gestion/crearContraseña.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/vehiculos-en-taller',
      name: 'vehiculos-en-taller',
      component: () => import('../views/dashboardCosas/vehiculosEnTaller.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte','Trabajador']
      }
    },
    {
      path: '/ot-sin-asignar',
      name: 'ot-sin-asignar',
      component: () => import('../views/dashboardCosas/OTsinAsignar.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte']
      }
    },
    {
      path: '/ot-por-entregar',
      name: 'ot-por-entregar',
      component: () => import('../views/dashboardCosas/OTporEntregar.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte','Trabajador']
      }
    },
    {
      path: '/presupuestos-semana',
      name: 'presupuestos-semana',
      component: () => import('../views/dashboardCosas/presupuestosSemana.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte']
      }
    },
    {
      path: '/informe-final/:id',
      name: 'ver-informe-final',
      component: () => import('../views/informeFinal.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador','Trabajador', 'Gerente', 'Soporte']
      }
    },
    {
      path: '/deudas',
      name: 'listado-deudas',
      component: () => import('../views/Deudas/deudaVer.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte']
       }
    },
    {
      path: '/deuda/:id',
      name: 'ver-deuda',
      component: () => import('../views/Deudas/deudaDetalle.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte']
       }
    },
    {
      path: '/invitar-usuarios',
      name: 'invitar-usuarios',
      component: () => import('../views/Gestion/invitarUsuarios.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Gerente', 'Soporte']
      }
    },
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: () => import('../views/unauthorized.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/perfil',
      name: 'perfil',
      component: () => import('../views/Gestion/perfil.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/perfil/historial',
      name: 'perfil-historial',
      component: () => import('../views/Gestion/perfilHistorial.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/vehiculos',
      name: 'listado-vehiculos',
      component: () => import('../views/Gestion/vehiculoListado.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Administrador', 'Gerente', 'Soporte'] }
    },
    {
      path: '/vehiculo/:id',
      name: 'ver-vehiculo',
      component: () => import('../views/Gestion/vehiculoVer.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Administrador', 'Gerente', 'Soporte'] }
    },
    {
      path: '/clientes',
      name: 'listado-clientes',
      component: () => import('../views/Gestion/clienteListado.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Administrador', 'Gerente', 'Soporte'] }
    },
    {
      path: '/cliente/:id',
      name: 'ver-cliente',
      component: () => import('../views/Gestion/clienteVer.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Administrador', 'Gerente', 'Soporte'] }
    },
    {
      path: '/finanzas',
      name: 'finanzas',
      component: () => import('../views/Gestion/finanzas.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Administrador', 'Gerente', 'Soporte'] }
    },
    {
      path: '/gastos',
      name: 'gastos',
      component: () => import('../views/Gestion/gastos.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Administrador', 'Gerente', 'Soporte'] }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/notFound.vue')
    },
    {
      path: '/serviml',
      name: 'serviml',
      component: () => import('../views/Gestion/serviml.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Administrador', 'Gerente', 'Soporte'] }
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // 1. ESPERAR INICIALIZACIÓN
  // Vital: Si el usuario refresca la página (F5), esperamos a que Supabase y Pinia 
  // recuperen la sesión y el perfil antes de decidir si dejarlo pasar.
  if (!userStore.initialized) {
    await userStore.initializeAuth()
  }

  const isAuthenticated = !!userStore.user
  // Usamos el getter que definimos en el store. 
  // Asegúrate de que en 'user.js' tu getter se llame 'userRole' o cambia esto por 'currentUserRole'
  const userRole = userStore.WhatIsMyRole

  // 2. BLOQUEO DE NO AUTENTICADOS
  // Si la ruta pide login y no hay usuario -> Al Login
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // 3. REDIRECCIÓN DE USUARIOS LOGUEADOS
  // Si ya está logueado y quiere ir al login -> Al Home/Dashboard
  if (isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    next('/')
    return
  }

  // 4. CONTROL DE ROLES (RBAC)
  // Si la ruta tiene una lista de roles permitidos...
  if (to.meta.allowedRoles) {
    // Verificamos: ¿Tiene rol? Y ¿Su rol está en la lista permitida?
    if (!userRole || !to.meta.allowedRoles.includes(userRole)) {
      // Si falla, lo mandamos a una página de "No Autorizado" o al home
      next('/unauthorized') 
      return
    }
  }

  // 5. PASE LIBRE
  next()
})
export default router