<script setup>
import {useDark} from '@/stores/useDark'
const { isDark, toggleDark } = useDark()
</script>

<template>
  <button 
    @click="toggleDark" 
    class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-white transition-colors"
  >
    <span v-if="isDark">☀️ Claro</span>
    <span v-else>🌙 Oscuro</span>
  </button>
</template>