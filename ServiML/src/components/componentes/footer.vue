<script setup>
import { RouterLink } from 'vue-router'
</script>
<template>
  <nav class="bottom-nav servi-blue servi-white-font">
    <RouterLink to="/" class="nav-item primero"><span>🏠</span><p>Inicio</p></RouterLink>
    <RouterLink to="/ordenes-de-trabajo" class="nav-item"><span>🔧</span><p>Órdenes</p></RouterLink>
    <RouterLink to="/presupuestos" class="nav-item"><span>📄</span><p>Presupuesto</p></RouterLink>
    <RouterLink to="/configuracion" class="nav-item ultimo"><span>⚙️</span><p>Config.</p></RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-around;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 6px rgba(0,0,0,0.05);
}

.nav-item {
  text-align: center;
  cursor: pointer;
  color: white;
  transition: color 0.3s;
  background-color: #1f3d64;
  width: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.router-link-active {
  color: #1f3d64;
  font-weight: bold;
  background-color: #D8B462;
}

.nav-item span {
  display: block;
  font-size: 24px;
  margin-bottom: 4px;
}
.primero {
  border-radius: 20px 0 0 0;
}
.ultimo {
  border-radius: 0 20px 0 0;
}
</style>