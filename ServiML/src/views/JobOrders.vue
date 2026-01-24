<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from "../lib/supabaseClient.js"
import JobOrderCard from "../components/ordendetrabajoCard.vue"
import navbar from "../components/componentes/navbar.vue"
import cargando from "../components/componentes/cargando.vue"
const router = useRouter()
const ordenes = ref([])
const loading = ref(true)

const obtenerOrdenes = async () => {
  const { data } = await supabase
    .from('orden_trabajo')
    .select('*')
    .order('id', { ascending: false })

  if (data) {
    ordenes.value = data
  }
  loading.value = false
}

const irACrear = () => {
  router.push({ name: 'nuevaOrdenDeTrabajo' })
}


onMounted(() => {
  obtenerOrdenes()
})
</script>

<template>
  <cargando v-if="loading"></cargando>
  <div v-else>
  <navbar titulo="ServiML" subtitulo="Ordenes de Trabajo" class="navbar" searchInput="true" />
  <div class="contenedor">
    <div class="header-acciones flex justify-between items-center mt-2 px-2">
      <h2 class="text-lg font-bold servi-blue-font">Ordenes de Trabajo</h2>
      <button @click="irACrear" class="servi-yellow font-bold servi-blue-font px-4 py-2 rounded-full">Nueva Orden de Trabajo</button>
    </div>
    <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <jobOrderCard v-for="item in ordenes" :key="item.id" :data="item" />
    </div>
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