<script setup>
import { ref, computed } from 'vue';
import newNotification from '../varios/newNotification.vue';
import emptyNotification from '../varios/emptyNotification.vue';
import notificacionesModal from './notificacionesModal.vue';
import { useNotifications } from '@/stores/notificaciones.js'
import { useUserStore } from '@/stores/user';

const userStore = useUserStore()
const { notifications, markAsRead, markAllAsRead } = useNotifications(userStore.user.id)

const hasNotifications = computed(() => notifications.value.filter(n => !n.leido).length > 0)
const mostrarModal = ref(false)

defineProps({
    titulo: String,
    subtitulo: String,
    searchInput: String,
    notificaciones: String
})

const handleMostrarNotificaciones = () => {
  mostrarModal.value = !mostrarModal.value
}

const emit = defineEmits(['buscar'])

const onInput = (event) => {
  emit('buscar', event.target.value.toUpperCase())
}

</script>
<template>
<nav>
    <header class="header servi-blue servi-white-font px-5 py-3 shadow-lg rounded-b-xl justify-between h-auto">
    <div class="flex-center flex justify-between h-auto">
      <div class="user-info">
      <h2 class="welcome">{{ titulo }}</h2>
      <h1 class="user-name">{{ subtitulo }}</h1>
    </div>
    <div v-if="notificaciones === 'true'" @click="handleMostrarNotificaciones" class="flex items-center justify-center">
      <div v-if="hasNotifications">
        <newNotification />
      </div>
      <div v-else>
        <emptyNotification />
      </div>
    </div>
    </div>
    <div v-if="searchInput === 'true'" class="search-container">
      <input type="text" placeholder="Buscar patente (Ej: ABCD-12)..." class="search-input" @input="onInput">
    </div>
  </header>

  <!-- Modal de Notificaciones -->
  <notificacionesModal
    v-if="mostrarModal"
    :notifications="notifications"
    @cerrar="mostrarModal = false"
    @marcarLeida="markAsRead"
    @marcarTodasLeidas="markAllAsRead"
  />
</nav>
</template>

<style scoped>
.header {
  border-radius: 0 0 30px 30px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.user-name {
  font-size: 24px;
  margin: 5px 0;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 20px;
  border-radius: 25px;
  border: none;
  background-color: white;
  color: black;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-transform: uppercase;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}
</style>


