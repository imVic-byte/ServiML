<script setup>
defineProps({
  servicio: {
    type: Object,
    required:true
  }
})
</script>
<template>
  
  <div class="servicio-card">
    <h3>{{ servicio.nombre }}</h3>
    <div class="detalles">
      <p>Precio Moda: {{ servicio.precio_moda }}</p>
      <p>Rango: {{ servicio.rango_precios  }}</p>
      <small>Frecuencia: {{ servicio.frecuencia }}</small>
    </div>
  </div>
</template>
<style scoped>
.servicio-card {
  border: 1px solid #ccc;
  padding: 10px;
  margin-top: 10px;
  border-radius: 5px;

}
</style>
