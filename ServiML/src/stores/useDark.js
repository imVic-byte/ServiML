import { ref } from 'vue'

const isDark = ref(false)

// Initialize immediately (not waiting for onMounted)
const userTheme = localStorage.getItem('theme')
const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

if (userTheme === 'dark' || (!userTheme && systemTheme)) {
  isDark.value = true
  document.documentElement.classList.add('dark')
} else {
  isDark.value = false
  document.documentElement.classList.remove('dark')
}

const updateDom = () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const toggleDark = () => {
  isDark.value = !isDark.value
  updateDom()
}

export function useDark() {
  return {
    isDark,
    toggleDark
  }
}