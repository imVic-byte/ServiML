<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from "../lib/supabaseClient.js"
import presupuestoCard from "../components/presupuestoCard.vue"
import navbar from "../components/navbar.vue"
const router = useRouter()
const servicios = ref([])

const obtenerPresupuestos = async () => {
  const { data } = await supabase
    .from('presupuesto')
    .select('*, vehiculo(*)')
    .order('numero_folio', { ascending: false })

  if (data) {
    console.log(data)
    servicios.value = data
  }
}

const irACrear = () => {
  router.push({ name: 'nuevoPresupuesto' })
}

const irAEditar = (id) => {
  router.push({ name: 'editarPresupuesto', params: { id } })
}

const eliminarPresupuesto = async (id) => {
  if (!confirm('¿Eliminar presupuesto?')) return

  const { error } = await supabase
    .from('presupuesto')
    .delete()
    .eq('id', id)

  if (!error) {
    await obtenerPresupuestos()
  } else {
    alert(error.message)
  }
}

onMounted(() => {
  obtenerPresupuestos()
})
</script>

<template>
  <navbar titulo="ServiML" subtitulo="Presupuestos" class="navbar" searchInput="true" />
  <div class="contenedor">
    <div class="header-acciones flex justify-between items-center mt-2 px-2">
      <h2 class="text-2xl font-bold servi-blue-font">Presupuestos</h2>
      <button @click="irACrear" class="servi-yellow font-bold servi-blue-font px-4 py-2 rounded-full">Nuevo Presupuesto</button>
    </div>
    <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <presupuestoCard v-for="item in servicios" :key="item.id" :data="item" />
    </div>
  </div>
</template>
<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
}
</style>