<template>
  <div class="construction-container">
    <div class="construction-card">
      <div class="icon-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <h2>Módulo en construcción</h2>
      <p>Este módulo aún está en desarrollo. Vuelve más tarde.</p>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.construction-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 2rem;
}

.construction-card {
  text-align: center;
  padding: 3rem 2.5rem;
  border-radius: 16px;
  background: var(--color-background-soft, #f9f9f9);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  max-width: 420px;
  width: 100%;
}

.icon-wrapper {
  color: #f5a623;
  margin-bottom: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--color-heading, #1a1a1a);
}

p {
  font-size: 1rem;
  color: var(--color-text, #6b7280);
  margin-bottom: 2rem;
}

.progress-bar {
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  width: 60%;
  border-radius: 3px;
  background: linear-gradient(90deg, #f5a623, #f7c948);
  animation: loading 2s ease-in-out infinite;
}

@keyframes loading {
  0% { width: 10%; }
  50% { width: 70%; }
  100% { width: 10%; }
}
</style>