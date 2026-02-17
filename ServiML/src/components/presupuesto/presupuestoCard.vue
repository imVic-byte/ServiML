<script setup>
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

const camelCase = (texto) => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

const data = props.data
const handleEstados = (estado) => {
  switch (estado) {
    case 2:
      return {clase: 'badge-confirmado', texto: 'Confirmado', contenedor: 'confirmado'}
    case 3:
      return {clase: 'badge-descartado', texto: 'Descartado', contenedor: 'descartado'}
    case 1:
      return {clase: 'badge-en-espera-de-confirmación', texto: 'En espera de confirmación', contenedor: 'en-espera'}
    default:
      return {clase: 'badge-cerrado', texto: 'Cerrado', contenedor: 'cerrado'}
  }
}
</script>

<template>
  <RouterLink 
    :to="{ name: 'ver-presupuesto', params: { id: data.id } }" 
    class="card-container servi-adapt-bg servi-grey-font"
    :class="handleEstados(data.estado).contenedor"
  >
    <div class="card-header servi-grey-font">
      <span class="folio">#{{ data.numero_folio }}</span>
      <span class="font-bold text-black" :class="handleEstados(data.estado).clase">{{ handleEstados(data.estado).texto }}</span>  
    </div>

    <div class="card-body servi-grey-font">
      <div class="info-row">
        <span class="label">Emisión:</span>
        <span class="valor">{{ formatearFecha(data.created_at) }}</span>
      </div>
      
      <div class="info-row" v-if="data.vehiculo">
        <span class="label">Patente:</span>
        <span class="valor">{{ data.vehiculo.patente }}</span>
      </div>
      <div class="info-row" v-if="data.cliente">
        <span class="label">Cliente:</span>
        <span class="valor">{{ camelCase(data.cliente.nombre) + ' ' +  camelCase(data.cliente.apellido) }} </span>
      </div>
      <div class="info-row">
        <span class="label">Diagnóstico:</span>
        <span class="valor truncate">{{ data.diagnostico }}</span>
      </div>

      <div class="divider"></div>

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
    
    <div class="card-footer servi-grey-font">
      <small v-if="data.estado===1">Vence el: {{ formatearFecha(data.vencimiento) }}</small>
      <small v-if="data.estado===4">Vencido el: {{ formatearFecha(data.vencimiento) }}</small>
    </div>
  </RouterLink>
</template>

<style scoped>
.card-container {
  display: block;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 10px;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 1rem;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.confirmado {
  border-left: 5px solid #1b992a92;
  border-right: 5px solid #1b992a92;
}

.descartado {
  border-left: 5px solid #e74d3cad;
  border-right: 5px solid #e74d3cad;
}

.en-espera {
  border-left: 5px solid #ffc800a5;
  border-right: 5px solid #ffc800a5;
}

.cerrado {
  border-left: 5px solid #52026f;
  border-right: 5px solid #52026f;
}

.card-container:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.folio {
  font-weight: bold;
}

.badge-confirmado {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #36f04c5c;
  border-radius: 4px;
  color: #0f0f0f;
  text-transform: uppercase;
}

.badge-descartado {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #e74d3ce9;
  color: #ffffff;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-en-espera-de-confirmación {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #ffc800a5;
  color: #292929;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-cerrado {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  background: #52026f;
  color: #ffffff;
  border-radius: 4px;
  text-transform: uppercase;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.divider {
  height: 1px;
  background-color: #eee;
  margin: 0.3rem 0;
}

.total-row {
  display: flex;
  justify-content: space-between;
}

.total-row.final {
  font-weight: bold;
  font-size: 1rem;
}

.card-footer {
  text-align: right;
  font-size: 0.8rem;
}
</style>