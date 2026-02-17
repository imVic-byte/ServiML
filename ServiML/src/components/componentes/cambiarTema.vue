<script setup>
import {useDark} from '@/stores/useDark'
const { isDark, toggleDark } = useDark()
</script>

<template>
  <button 
    @click="toggleDark" 
    class="p-2 rounded-lg servi-adapt-bg servi-grey-font hover:opacity-80 transition-colors cursor-pointer"
  >
    <span v-if="isDark">☀️ Claro</span>
    <span v-else>🌙 Oscuro</span>
  </button>
</template>