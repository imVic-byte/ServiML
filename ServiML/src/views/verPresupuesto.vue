<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabaseClient.js'
import navbar from '../components/componentes/navbar.vue'
import cargando from '../components/componentes/cargando.vue'
import acciones from '../components/presupuesto/acciones.vue'
const route = useRoute()
const presupuesto = ref(null)
const n_presupuesto = ref('')
const loading = ref(true)

const id = ref(route.params.id)
const manejarConfirmacion = async () => {
    const { error } = await supabase
        .from('presupuesto')
        .update({ estado: 'Confirmado' })
        .eq('id', route.params.id)

    if (error) {
        console.error(error)
        return
    }
    presupuesto.value.estado = 'Confirmado'
}

const manejarDescarte = async () => {
    const { error } = await supabase
        .from('presupuesto')
        .update({ estado: 'Descartado' })
        .eq('id', route.params.id)

    if (error) {
        console.error(error)
        return
    }
    presupuesto.value.estado = 'Descartado'
}



onMounted(async () => {
    const { data, error } = await supabase
    .from('presupuesto')
    .select('*,vehiculo(*),cliente(*),detalle_presupuesto(*)')
    .eq('id', route.params.id)
    if (data) {
        presupuesto.value = data[0]
        n_presupuesto.value = data[0].numero_folio
        console.log(presupuesto.value)
    } else {
        console.log(error)
    }
    loading.value = false
})



</script>
<template>
<cargando v-if="loading"></cargando>
<div v-else >
    <navbar :titulo="'Presupuesto No. ' + n_presupuesto" subtitulo="" />
    <div class="pb-28 mx-auto p-4 max-w-lg">
        <div class="servi-blue servi-white-font rounded-xl flex flex-col shadow-sm border p-4 mt-3">
        <h2 class="servi-white-font font-bold border-b pb-1 mb-3">Datos del presupuesto</h2>
        <p class="rounded-md py-1">
        Cliente: {{ presupuesto.cliente?.nombre || 'Cliente no registrado' }}
        </p>
        <p class="rounded-md py-1">
        Rut: {{ presupuesto.cliente?.rut || 'Rut no registrado' }}
        </p>
        <p class="rounded-md py-1">
        Contacto: {{ presupuesto.cliente?.telefono || 'Contacto no registrado' }}
        </p>
        <p class="rounded-md py-1">
        Vehiculo: {{ presupuesto.vehiculo?.patente || 'Vehiculo no registrado' }} - Modelo: {{presupuesto.vehiculo.marca}} {{presupuesto.vehiculo.modelo}} {{presupuesto.vehiculo.anio}}
        </p>
        <p class="rounded-md py-1">
        Diagnostico: {{ presupuesto.diagnostico || 'Diagnostico no registrado' }}
        </p>
        <p class="rounded-md py-1">
        Estado: {{ presupuesto.estado || 'Estado no registrado' }}
        </p>
    </div>
    <div v-if="presupuesto.detalle_presupuesto.length > 0" class="shadow-sm flex-col grid servi-white mt-3 border border-gray-100 rounded-xl p-4">
        <p class="servi-blue-font font-bold border-b pb-1 mb-3">Servicios:</p>
            <div v-for="detalle in presupuesto.detalle_presupuesto" :key="detalle.id" class="flex justify-between servi-yellow servi-blue-font text-sm p-2 mb-2 rounded-lg">
                <span>{{ detalle.descripcion }}</span>
                <span class="font-bold">${{ detalle.valor_total }}</span>
            </div>
    </div>
    <div v-if="presupuesto.detalle_presupuesto.length > 0" class=" bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-3">
      <h3 class="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Desglose Financiero</h3>
      <div class="flex justify-between items-center mb-2 text-sm">
        <span>Subtotal Neto</span>
        <span v-if="presupuesto.total_neto" class="font-medium text-gray-600">${{ presupuesto.total_neto }}</span>
      </div>
      <div class="flex justify-between items-center mb-2 text-sm">
        <p>Descuento (-)</p>
        <span v-if="presupuesto.descuento" class="text-gray-600">${{ presupuesto.descuento }}</span>
        <span v-else class="text-gray-600">${{ presupuesto.descuento || 'No registrado' }}</span>
      </div>
      <div class="flex justify-between items-center mb-2 text-sm">
        <p>Incremento/Extras (+)</p>
        <span v-if="presupuesto.incremento" class="text-gray-600">${{ presupuesto.incremento }}</span>
        <span v-else class="text-gray-600">${{ presupuesto.incremento || 'No registrado' }}</span>
      </div>
      <div class="flex justify-between items-center mb-3 text-sm">
        <p>IVA</p>
        <span v-if="presupuesto.iva" class="text-gray-600">${{ presupuesto.iva }}</span>
        <span v-else class="text-gray-600">${{ presupuesto.iva || 'No registrado' }}</span>
      </div>
      <div class="flex justify-between items-center pt-3 border-t">
        <span class="font-bold text-gray-800">TOTAL</span>
        <span v-if="presupuesto.total_final" class="font-bold text-xl text-blue-900">${{ presupuesto.total_final }}</span>
        <span v-else class="font-bold text-xl text-blue-900">${{ presupuesto.total_final || 'No registrado' }}</span>
      </div>
    </div>
    <div v-if="presupuesto.estado === 'En espera de Confirmación'" class="flex justify-between items-center mx-auto align-center mt-3 gap-2">
        <acciones
        @confirmar="manejarConfirmacion"
        @descartar="manejarDescarte"
        />
    </div>
    </div>
</div>
</template>
<style>
</style>