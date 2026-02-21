import { computed } from 'vue'


const fechaInicioSemana = computed(() => {
  const fecha = new Date()
  const dia = fecha.getDay()
  const diferencia = dia === 0 ? -6 : 1 - dia
  fecha.setDate(fecha.getDate() + diferencia)
  return formatoLocal(fecha)
})
const fechaFinSemana = computed(() => {
  const fecha = new Date()
  const dia = fecha.getDay()
  const diferencia = dia === 0 ? 0 : 7 - dia
  fecha.setDate(fecha.getDate() + diferencia)
  return formatoLocal(fecha)
})
const fechaHoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
const diaSemana = new Date().getDay()
const esFinDeSemana = computed(() => diaSemana === 0 || diaSemana === 6)

export { fechaInicioSemana, fechaFinSemana, fechaHoy, diaSemana, esFinDeSemana }
