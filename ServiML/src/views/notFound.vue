<template>
  <div class="not-found-container">
    <div class="not-found-card">
      <div class="error-code">404</div>
      <div class="icon-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </div>
      <h2>Página no encontrada</h2>
      <p>La página que buscas no existe o fue movida.</p>
      <router-link to="/" class="back-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Volver al inicio
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: var(--color-background, #1F2F4A);
}

.not-found-card {
  text-align: center;
  padding: 3rem 2.5rem;
  border-radius: 16px;
  background: var(--color-background-soft, #ffffff);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  max-width: 420px;
  width: 100%;
}

.error-code {
  font-size: 6rem;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.icon-wrapper {
  color: #94a3b8;
  margin-bottom: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

h2 {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--color-heading, #1a1a1a);
}

p {
  font-size: 1rem;
  color: var(--color-text, #6b7280);
  margin-bottom: 2rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  background: linear-gradient(135deg, #1e3a5f, #2c4f7c);
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.25);
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(30, 58, 95, 0.35);
}
</style>