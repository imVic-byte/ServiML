<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabaseClient.js'
import navbar from '../../components/componentes/navbar.vue'
import modal from '../../components/componentes/modal.vue'
import { useInterfaz } from '@/stores/interfaz.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const interfaz = useInterfaz()
const fichas = ref([])
const irADetalle = (id) => {
    router.push({ name: "ficha-de-trabajo", params: { id } });
}

onMounted(async () => {
    interfaz.showLoading();
    const { data, error } = await supabase
      .from('ficha_de_trabajo')
      .select('*')
    if (data) {
        fichas.value = data
    } else {
        console.log(error)
    }
    interfaz.hideLoading();
})
</script>

<template>
    <div class="flex-1 servi-white">
        <navbar titulo="ServiML" subtitulo="Fichas de Trabajo" class="navbar"/>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold servi-grey-font">Fichas de Trabajo</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div @click="irADetalle(ficha.id)" v-for="ficha in fichas" :key="ficha.id" class="servi-adapt-bg p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer">
                    <h3 class="text-lg font-bold servi-grey-font">{{ ficha.motivo_ingreso }}</h3>
                    <p class="text-sm servi-grey-font">{{ ficha.fecha_ingreso }}</p>
                </div>
            </div>
        </div>
    </div>
</template>