<script setup>
import {ref,onMounted,computed} from 'vue'
import {supabase} from '../../lib/supabaseClient.js'
import navbar from '../../components/componentes/navbar.vue'
import modal from '../../components/componentes/modal.vue'
import { useInterfaz } from '@/stores/interfaz.js'
import { useRouter,useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const interfaz = useInterfaz()
const ficha = ref([])

onMounted(async () => {
    interfaz.showLoading();
    const { data, error } = await supabase
      .from('ficha_de_trabajo')
      .select('*,cliente(*)')
      .eq('id', route.params.id)
      .single()
    if (data) {
        ficha.value = data
    } else {
        console.log(error)
    }
    interfaz.hideLoading();
})
</script>
<template>
    <div class="flex-1 servi-white">
        <navbar titulo="ServiML" subtitulo="Ficha de Trabajo" class="navbar"/>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2>{{ ficha?.cliente?.nombre }}</h2>
            <h2>{{ ficha?.cliente?.apellido }}</h2>
            <h2>{{ ficha?.cliente?.telefono }}</h2>
            <h2>{{ ficha?.cliente?.email }}</h2>
            <h2>{{ ficha?.cliente?.telefono }}</h2>
        </div>
    </div>
</template>