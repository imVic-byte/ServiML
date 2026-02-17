<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const props = defineProps({
  notifications: Array,
})

const emit = defineEmits(['cerrar', 'marcarLeidaNotificacion', 'marcarLeidaDeuda', 'marcarTodasLeidas', 'marcarTodasLeidasDeuda'])

const notificacionesNoLeidas = computed(() =>
  props.notifications.filter(n => !n.leido).length
)

const tiempoRelativo = (fecha) => {
  const ahora = new Date()
  const creada = new Date(fecha)
  const diffMs = ahora - creada
  const diffMin = Math.floor(diffMs / 60000)
  const diffHoras = Math.floor(diffMin / 60)
  const diffDias = Math.floor(diffHoras / 24)

  if (diffMin < 1) return 'Ahora mismo'
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffHoras < 24) return `Hace ${diffHoras}h`
  if (diffDias < 7) return `Hace ${diffDias}d`
  return creada.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

const handleIrAOT = (notifId, resourceId) => {
  emit('marcarLeidaNotificacion', notifId)
  emit('cerrar')
  router.push({ name: 'ver-orden-de-trabajo', params: { id: resourceId } })
}

const handleIrADeuda = (notifId, deudaId) => {
  emit('marcarLeidaDeuda', notifId)
  emit('cerrar')
  router.push({ name: 'ver-deuda', params: { id: deudaId } })
}
</script>

<template>
  <Transition name="modal">
    <div class="modal-overlay" @click.self="emit('cerrar')">
      <div class="modal-panel servi-white servi-grey-font">
        <!-- Header -->
        <div class="modal-header servi-blue">
          <div class="modal-header-left ">
            <h2 class="modal-title">Notificaciones</h2>
            <span v-if="notificacionesNoLeidas > 0" class="badge-count">
              {{ notificacionesNoLeidas }}
            </span>
          </div>
          <button @click="emit('cerrar')" class="btn-close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-close">
              <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- Marcar todas como leídas -->
        <div v-if="notificacionesNoLeidas > 0" class="mark-all-bar servi-adapt-bg">
          <button @click="emit('marcarTodasLeidas'), emit('marcarTodasLeidasDeuda')" class="btn-mark-all servi-yellow servi-grey-font">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="icon-check-all">
              <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
            </svg>
            <p class="servi-grey-font">Marcar todas como leídas</p>
          </button>
        </div>

        <!-- Lista de notificaciones -->
        <div class="notifications-list">
          <div
            v-for="notif in notifications"
            :key="notif.id"
            class="notification-item servi-adapt-bg servi-grey-font"
            :class="{ 'notification-unread': !notif.leido }"
          >
            <div class="notification-dot-col">
              <span v-if="!notif.leido" class="notification-dot"></span>
            </div>
            <div class="notification-content servi-grey-font">
              <p class="notification-title servi-grey-font">{{ notif.titulo }}</p>
              <p v-if="notif.contenido" class="notification-body">{{ notif.contenido }}</p>
              <p class="notification-time">{{ tiempoRelativo(notif.created_at) }}</p>
            </div>
            <button v-if="notif.tipo==='notificacion'" class="servi-blue servi-yellow-font rounded-full px-4 py-2" @click="handleIrAOT(notif.id, notif.id_resource)">
                Ver
            </button>
            <button v-if="notif.tipo==='deuda'" class="servi-blue servi-yellow-font rounded-full px-4 py-2" @click="handleIrADeuda(notif.id, notif.deuda)">
                Ver
            </button>
          </div>

          <!-- Estado vacío -->
          <div v-if="notifications.length === 0" class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-empty">
              <path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z" clip-rule="evenodd" />
            </svg>
            <p class="empty-title">Sin notificaciones</p>
            <p class="empty-subtitle">No tienes notificaciones por el momento</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: end;
  align-items: flex-start;
  padding-top: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

/* Panel */
.modal-panel {
  width: 100%;
  max-width: 28rem;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border-radius: 0 0 1.25rem 1.25rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  color: #ffffff;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
}

.badge-count {
  background-color: #D8B462;
  color: #1f3d64;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  min-width: 1.25rem;
  text-align: center;
}

.btn-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.1);
}

.icon-close {
  width: 1.25rem;
  height: 1.25rem;
}

/* Mark all bar */
.mark-all-bar {
  padding: 0.625rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.btn-mark-all {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  color: #1f3d64;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
}

.btn-mark-all:hover {
  background-color: #e2e8f0;
}

.icon-check-all {
  width: 1rem;
  height: 1rem;
}

/* Notifications list */
.notifications-list {
  overflow-y: auto;
  flex: 1;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.15s;
}

.notification-item:hover {
  background-color: #0e2c53;
  color: #1f3d64;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-dot-col {
  width: 0.625rem;
  flex-shrink: 0;
  padding-top: 0.375rem;
}

.notification-dot {
  display: block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background-color: #D8B462;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.notification-body {
  font-size: 0.8125rem;
  margin: 0 0 0.375rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.icon-empty {
  width: 3rem;
  height: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 0.25rem 0;
}

.empty-subtitle {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 0;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: translateY(-100%);
}
</style>
