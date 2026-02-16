import { ref, onMounted } from 'vue'

export function useDark() {
  const isDark = ref(false)

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

  onMounted(() => {
    const userTheme = localStorage.getItem('theme')
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (userTheme === 'dark' || (!userTheme && systemTheme)) {
      isDark.value = true
      document.documentElement.classList.add('dark')
    } else {
      isDark.value = false
      document.documentElement.classList.remove('dark')
    }
  })

  return {
    isDark,
    toggleDark
  }
}