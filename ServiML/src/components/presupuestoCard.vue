<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const formatearDinero = (cantidad) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(cantidad)
}

const formatearFecha = (fechaString) => {
  if (!fechaString) return '---'
  const fecha = new Date(fechaString)
  return fecha.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const estado = computed(() => {
  if (!props.data.fecha_vencimiento) return 'normal'
  const hoy = new Date()
  const vencimiento = new Date(props.data.fecha_vencimiento)
  return vencimiento < hoy ? 'vencido' : 'vigente'
})
</script>

<template>
  <div class="card" :class="estado">
    <div class="card-header">
      <span class="folio">#{{ data.numero_folio }}</span>
      <span class="badge">{{ estado === 'vencido' ? 'Vencido' : 'Activo' }}</span>
    </div>

    <div class="card-body">
      <div class="info-row">
        <span class="label">Emisión:</span>
        <span class="valor">{{ formatearFecha(data.created_at) }}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Patente:</span>
        <span class="valor">{{ data.vehiculo.patente }}</span>
      </div>

      <hr class="divider">

      <div class="totales">
        <div class="total-row">
          <span>Subtotal</span>
          <span>{{ formatearDinero(data.subtotal) }}</span>
        </div>
        <div class="total-row">
          <span>IVA</span>
          <span>{{ formatearDinero(data.iva) }}</span>
        </div>
        <div class="total-row final">
          <span>Total</span>
          <span class="precio-grande">{{ formatearDinero(data.total_final) }}</span>
        </div>
      </div>
    </div>
    
    <div class="card-footer">
      <small>Vence el: {{ formatearFecha(data.fecha_vencimiento) }}</small>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1.5rem;
  border-left: 5px solid #1f4b85;
  border-right: 5px solid #1f4b85;
  transition: transform 0.2s;
  margin: 1rem;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.card.vencido {
  border-left-color: #e74c3c;
  border-right-color: #e74c3c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.folio {
  font-weight: bold;
  font-size: 1.1rem;
  color: #2c3e50;
}

.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #36f04c5c;
  border-radius: 4px;
  text-transform: uppercase;
}

.vencido .badge {
  background: #fadbd8;
  color: #c0392b;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.divider {
  border: 0;
  border-top: 1px solid #eee;
  margin: 1rem 0;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.total-row.final {
  margin-top: 0.5rem;
  font-weight: bold;
  color: #2c3e50;
  font-size: 1.2rem;
}

.card-footer {
  margin-top: 1rem;
  text-align: right;
  font-size: 0.8rem;
  color: #999;
}
</style>