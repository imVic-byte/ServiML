<template>
    <section class="filters">
    <button class="filter-btn active">Todos</button>
    <button class="filter-btn">En Taller (4)</button>
    <button class="filter-btn">Estacionados (2)</button>
  </section>
</template>

<style scoped>
.filters {
  margin-top: 10px;
  margin-bottom: 10px;
  padding: 0 10px;
  padding-bottom: 10px;
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.filter-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #ddd;
  background: white;
  white-space: nowrap;
}

.filter-btn.active {
  color: white;
  background-color: #1f3d64;
  border-color: #1f3d64;
}
</style>