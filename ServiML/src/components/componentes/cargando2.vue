<script setup>
import { useInterfaz } from '@/stores/interfaz'
import { storeToRefs } from 'pinia'

const uiStore = useInterfaz()
const { isLoadingOverlay } = storeToRefs(uiStore)
</script>

<template>
  <Transition name="overlay-fade">
    <div v-if="isLoadingOverlay" class="overlay">
      <div class="overlay-content">
        <div class="spinner-ring">
          <div class="spin-ring spin-ring-1"></div>
        </div>
        <p class="overlay-text">Procesando</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.728);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 9998;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2rem 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 1.25rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Spinner */
.spinner-ring {
  position: relative;
  width: 56px;
  height: 56px;
}

.spin-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid transparent;
}

.spin-ring-1 {
  border-top-color: #158ffa;
  animation: spin 1s linear infinite;
}

.spin-ring-2 {
  inset: 5px;
  border-right-color: #3b82f6;
  animation: spin 1.4s linear infinite reverse;
}

.spin-ring-3 {
  inset: 10px;
  border-bottom-color: rgba(255, 255, 255, 0.5);
  animation: spin 1.8s linear infinite;
}

.dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 50%;
  background: #facc15;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.6); opacity: 0.5; }
}

/* Text */
.overlay-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.dots::after {
  content: '';
  animation: dots-anim 1.5s steps(4, end) infinite;
}

@keyframes dots-anim {
  0%  { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
}

/* Transition */
.overlay-fade-enter-active {
  transition: opacity 0.25s ease;
}
.overlay-fade-leave-active {
  transition: opacity 0.35s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>
