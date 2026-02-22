<script setup>
import Navbar from "../../components/componentes/navbar.vue"
import { ref, onMounted } from 'vue'
import { supabase } from "../../lib/supabaseClient.js"
import { useRoute, useRouter } from 'vue-router'
import cargando from "../../components/componentes/cargando.vue"
import modal from "../../components/componentes/modal.vue"
const fechaIngreso = ref('')
const trabajadores = ref([])
const trabajador = ref('')
const id = ref('')
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true });

const obtenerTrabajadores = async () => {
    const {data} = await supabase
    .from('trabajadores')
    .select('*')
    if (data) {
        trabajadores.value = data
    }
    loading.value = false
}

const redirigir = () => {
  if (modalState.value.exito) {
    router.push({ name: "ordenes-de-trabajo" });
  } else {
    modalState.value.visible = false;
  }
};
const confirmarOT = async () => {
    loading.value = true
    const {error} = await supabase
    .from('orden_trabajo')
    .update({
        estado: 'En revision',
        fecha_ingreso: fechaIngreso.value,
        id_empleado: trabajador.value
    })
    .eq('id', id.value)
    if (error) {
        console.error('Error al confirmar OT:', error)
        modalState.value = { visible: true, titulo: "Error", mensaje: "Error al confirmar OT", exito: false };
    }
    else {
        console.log('OT confirmada exitosamente')
        modalState.value = { visible: true, titulo: "OT confirmada", mensaje: "La OT ha sido confirmada exitosamente", exito: true };
    }
    loading.value = false
}

onMounted(() => {
    obtenerTrabajadores()
    id.value = route.params.id
})
</script>

<template>
    <cargando v-if="loading"></cargando>
    <div v-else>
    <navbar titulo="ServiML" subtitulo="Confirmar OT" class="navbar" searchInput="false" />
    <div class="pb-28 mx-auto p-4 max-w-lg">
        <div class="flex flex-col gap-2">
            <label for="fecha-ingreso" class="text-lg font-bold servi-grey-font">Fecha de Ingreso</label>
            <input type="date" id="fecha-ingreso" v-model="fechaIngreso" 
            class="rounded-xl mx-4 px-4 py-2 servi-blue servi-white-font font-bold" />
            <label for="trabajador" class="text-lg font-bold servi-grey-font">Trabajador</label>
            <select id="trabajador" v-model="trabajador" 
            class="rounded-xl mx-4 px-4 py-2 servi-blue servi-white-font font-bold">
                <option v-for="trabajador in trabajadores" :key="trabajador.id" :value="trabajador.id">{{ trabajador.nombre }} - {{ trabajador.rol }}</option>
            </select>
            <button class="servi-yellow servi-grey-font font-bold px-4 py-2 rounded-full" @click="confirmarOT">Confirmar OT</button>
        </div>
    </div>
    </div>
    <modal v-if="modalState.visible" :titulo="modalState.titulo" :mensaje="modalState.mensaje" :exito="modalState.exito" @cerrar="redirigir" />
</template>
