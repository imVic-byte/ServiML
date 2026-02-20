<template>
    <div class="container mx-auto p-4 md:p-6 max-w-4xl">

        <div v-if="cargando" class="flex flex-col items-center justify-center h-64 gap-4">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="text-gray-600">Procesando información...</p>
        </div>

        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong class="font-bold">Error: </strong>
            <span class="block sm:inline">{{ error }}</span>
            <button @click="volver" class="mt-3 block underline">Volver a la ficha</button>
        </div>

        <div v-else-if="cotizacionData">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Generar Presupuesto Oficial
            </h1>

            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <p class="text-gray-600 dark:text-gray-300 mb-4">
                    Estás a punto de convertir la <strong>Cotización Aprobada N°{{ cotizacionData.id }}</strong> en un
                    Presupuesto. Revisa los montos antes de confirmar.
                </p>

                <div
                    class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div>
                        <p class="text-gray-500 font-semibold">Subtotal</p>
                        <p class="font-bold text-gray-800 dark:text-white">{{ formatMoneda(cotizacionData.subtotal) }}
                        </p>
                    </div>
                    <div>
                        <p class="text-gray-500 font-semibold">Descuento</p>
                        <p class="font-bold text-red-600">{{ formatMoneda(cotizacionData.descuento) }}</p>
                    </div>
                    <div>
                        <p class="text-gray-500 font-semibold">IVA</p>
                        <p class="font-bold text-gray-800 dark:text-white">{{ formatMoneda(cotizacionData.iva) }}</p>
                    </div>
                    <div>
                        <p class="text-gray-500 font-semibold text-lg">Total Final</p>
                        <p class="font-bold text-blue-600 text-lg">{{ formatMoneda(cotizacionData.total_final) }}</p>
                    </div>
                </div>
            </div>

            <div class="flex gap-4">
                <button @click="volver"
                    class="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancelar
                </button>
                <button @click="confirmarPresupuesto" :disabled="procesando"
                    class="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span v-if="procesando">Generando Folio...</span>
                    <span v-else>Confirmar y Crear Presupuesto</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../lib/supabaseClient'

const route = useRoute()
const router = useRouter()

// Estados
const cotizacionId = route.params.id
const cargando = ref(true)
const procesando = ref(false)
const error = ref(null)

const cotizacionData = ref(null)
const vehiculoId = ref(null)

// Formateador de moneda
const formatMoneda = (monto) => {
    if (!monto) return '$0'
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto)
}

const volver = () => {
    router.go(-1) // Vuelve a la pantalla anterior
}

// 1. Cargar los datos iniciales al entrar a la vista
const cargarDatos = async () => {
    try {
        // Buscar la cotización, sus detalles y el cliente de la ficha
        const { data: coti, error: cotiErr } = await supabase
            .from('cotizacion')
            .select(`
    *,
    detalle_cotizacion (*),
    ficha_de_trabajo ( 
      cliente ( id, nombre, apellido, telefono, codigo_pais, email ) 
    )
  `)
            .eq('id', cotizacionId)
            .single()

        if (cotiErr) throw cotiErr
        cotizacionData.value = coti

        // Buscar si ya existe una Orden de Trabajo para sacar el id_vehiculo
        const { data: ot } = await supabase
            .from('orden_trabajo')
            .select('vehiculo_id')
            .eq('id_ficha', coti.id_ficha)
            .single()

        if (ot) {
            vehiculoId.value = ot.vehiculo_id
        }

    } catch (err) {
        console.error("Error cargando cotización:", err)
        error.value = "No se pudo cargar la cotización. Asegúrate de que el enlace sea válido."
    } finally {
        cargando.value = false
    }
}

// 2. Ejecutar la creación del presupuesto al hacer clic
const confirmarPresupuesto = async () => {
    procesando.value = true

    try {
        const coti = cotizacionData.value

        // A. Insertar el Presupuesto Maestro (Supabase genera el folio automáticamente)
        const { data: nuevoPresupuesto, error: presError } = await supabase
            .from('presupuesto')
            .insert({
                id_ficha: coti.id_ficha,
                id_cliente: coti.ficha_de_trabajo.id.cliente,
                id_vehiculo: vehiculoId.value,
                subtotal: coti.subtotal,
                descuento: coti.descuento,
                total_neto: coti.total_neto,
                iva: coti.iva,
                total_final: coti.total_final,
                diagnostico: coti.diagnostico,
                estado: 1
            })
            .select()
            .single()

        if (presError) throw presError

        // B. Copiar los detalles (insumos, servicios) de la cotización al presupuesto
        if (coti.detalle_cotizacion && coti.detalle_cotizacion.length > 0) {
            const detallesParaInsertar = coti.detalle_cotizacion.map(detalle => ({
                id_presupuesto: nuevoPresupuesto.id,
                descripcion: detalle.descripcion,
                monto: detalle.monto,
                cantidad: detalle.cantidad
            }))

            const { error: detError } = await supabase
                .from('detalle_presupuesto')
                .insert(detallesParaInsertar)

            if (detError) throw detError
        }

        // Opcional: Podrías marcar la cotización original con un estado "Convertida" si lo deseas,
        // o simplemente dejarla como "Aprobada" (2).

        // C. ¡Todo listo! Redirigir al usuario al nuevo presupuesto
        alert(`Presupuesto generado exitosamente con el Folio N°${nuevoPresupuesto.numero_folio}`)
        router.push({ name: 'ver-presupuesto', params: { id: nuevoPresupuesto.id } })

    } catch (err) {
        console.error('Error al generar presupuesto:', err)
        error.value = "Ocurrió un error al guardar el presupuesto en la base de datos."
    } finally {
        procesando.value = false
    }
}

onMounted(() => {
    cargarDatos()
})
</script>