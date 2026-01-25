<script setup>
import Navbar from "../../components/componentes/navbar.vue"
import presupuestoList from "../../components/presupuesto/presupuestoList.vue"
import { ref } from 'vue'
const fechaIngreso = ref('')
const presupuestoSeleccionado = ref('')
const trabajador = ref('')
</script>

<template>
    <navbar titulo="ServiML" subtitulo="Crear Orden de Trabajo" class="navbar" searchInput="false" />
    <div class="pb-28 mx-auto p-4 max-w-lg">
        <div class="flex flex-col gap-2">
            <h2 class="text-lg font-bold servi-blue-font">Seleccionar Presupuesto</h2>
            <presupuestoList v-model="presupuestoSeleccionado"/>
            <label for="fecha-ingreso" class="text-lg font-bold servi-blue-font">Fecha de Ingreso</label>
            <input type="date" id="fecha-ingreso" v-model="fechaIngreso" 
            class="rounded-xl mx-4 px-4 py-2 servi-blue servi-white-font font-bold" />
            <label for="trabajador" class="text-lg font-bold servi-blue-font">Trabajador</label>
            <input type="text" id="trabajador" v-model="trabajador" 
            class="rounded-xl mx-4 px-4 py-2 servi-blue servi-white-font font-bold" />
            <button class="servi-yellow servi-blue-font font-bold px-4 py-2 rounded-full">Crear Orden de Trabajo</button>
        </div>
    </div>
</template>
