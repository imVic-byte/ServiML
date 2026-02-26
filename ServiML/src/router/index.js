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
      path: '/presupuesto/:id/editar',
      name: 'editar-presupuesto',
      component: () => import('../views/Presupuesto/presupuestoEditar.vue'),
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
      path: '/vehiculos-en-taller/:taller',
      name: 'vehiculos-en-taller',
      component: () => import('../views/dashboardCosas/vehiculosEnTaller.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte','Trabajador']
      }
    },
    {
      path: '/ot-sin-asignar/:taller',
      name: 'ot-sin-asignar',
      component: () => import('../views/dashboardCosas/OTsinAsignar.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte']
      }
    },
    {
      path: '/ot-por-entregar/:taller',
      name: 'ot-por-entregar',
      component: () => import('../views/dashboardCosas/OTporEntregar.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Administrador', 'Gerente', 'Soporte','Trabajador']
      }
    },
    {
      path: '/presupuestos-semana/:taller',
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
        allowedRoles: ['Gerente', 'Soporte']
       }
    },
    {
      path: '/deuda/:id',
      name: 'ver-deuda',
      component: () => import('../views/Deudas/deudaDetalle.vue'),
      meta: { 
        requiresAuth: true,
        allowedRoles: ['Gerente', 'Soporte']
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
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/notFound.vue')
    },
    {
      path: '/serviml',
      name: 'serviml',
      component: () => import('../views/Gestion/serviml.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte'] }
    },
    {
      path:'/cotizacion/crear',
      name: 'crear-cotizacion',
      component: () => import('../views/Cotizaciones/cotizacionesForm.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path:'/cotizacion/editar/:id',
      name: 'editar-cotizacion',
      component: () => import('../views/Cotizaciones/cotizacionesEditar.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path:'/cotizacion/ver/:id',
      name: 'ver-cotizacion',
      component: () => import('../views/Cotizaciones/cotizacionesVer.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path:'/cotizacion/pdf/:id',
      name: 'pdf-cotizacion',
      component: () => import('../views/Cotizaciones/cotizacionesPDF.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path:'/cotizacion/listado',
      name: 'listado-cotizaciones',
      component: () => import('../views/Cotizaciones/cotizacionesListado.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path:'/cotizacion/crear-presupuesto/:id',
      name: 'crear-presupuesto-cotizacion',
      component: () => import('../views/Cotizaciones/crearPresupuesto.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path:'/ficha-de-trabajo/:id',
      name: 'ficha-de-trabajo',
      component: () => import('../views/Fichas/fichaDeTrabajo.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path:'/ficha-de-trabajo',
      name: 'listado-fichas-de-trabajo',
      component: () => import('../views/Fichas/fichaDeTrabajoListado.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path:'/ficha-de-trabajo/crear',
      name: 'crear-ficha-de-trabajo',
      component: () => import('../views/Fichas/fichaDeTrabajoCrear.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path:'/ficha-de-trabajo/:id/crear-ot',
      name: 'crear-ot-ficha-de-trabajo',
      component: () => import('../views/Fichas/fichaDeTrabajoCrearOT.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path:'/ficha-de-trabajo/:id/crear-cotizacion',
      name: 'crear-cotizacion-ficha-de-trabajo',
      component: () => import('../views/Fichas/fichaDeTrabajoCrearCotizacion.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path:'/ficha-de-trabajo/:id/ver-cotizacion/:cotizacion_id',
      name: 'ver-cotizacion-ficha-de-trabajo',
      component: () => import('../views/Fichas/fichaDeTrabajoVerCotizacion.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path:'/ficha-de-trabajo/:id/presupuesto',
      name: 'ver-presupuesto-ficha-de-trabajo',
      component: () => import('../views/Fichas/presupuestoPDF.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path:'/ficha-de-trabajo/:id/informe',
      name: 'ver-informe-ficha-de-trabajo',
      component: () => import('../views/Fichas/informeFinalPDF.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte','Administrador'] }
    },
    {
      path: '/finanzas',
      name: 'finanzas',
      component: () => import('../views/Gestion/finanzas.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte'] }
    },
    {
      path: '/gastos',
      name: 'gastos',
      component: () => import('../views/gastosMensuales/gastosMensuales.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte'] }
    },
    {
      path: '/gastos/crear',
      name: 'crear-gasto',
      component: () => import('../views/gastosMensuales/gastosMensualesCrear.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte'] }
    },
    {
      path: '/gastos/editar/:id',
      name: 'editar-gasto',
      component: () => import('../views/gastosMensuales/gastosMensualesEditar.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte'] }
    },
    {
      path: '/gastos/ver/:id',
      name: 'ver-gasto',
      component: () => import('../views/gastosMensuales/gastosMensualesVer.vue'),
      meta: { requiresAuth: true, allowedRoles: ['Gerente', 'Soporte'] }
    }
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