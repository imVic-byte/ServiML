<script setup>
import { ref, onMounted, computed} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../../lib/supabaseClient.js'
import navbar from '../../components/componentes/navbar.vue'
import volver from '@/components/componentes/volver.vue'
import { useInterfaz } from '@/stores/interfaz.js'
import { useUserStore } from '@/stores/user.js'
const router = useRouter()
const route = useRoute()
const interfaz = useInterfaz()
const userStore = useUserStore()

const chequeoId = ref(route.params.id)
const chequeo = ref(null)
const ot = ref(null)
const fotoExpandida = ref(null)
const Creador = computed(() => {
  if (chequeo.value) {
    return chequeo.value.trabajador_id === userStore.user.id ? true : false
  }
  return false
})

const opciones = {
  bueno: { label: 'Bueno', color: 'bg-green-100 text-green-700 border-green-300' },
  malo: { label: 'Malo', color: 'bg-red-100 text-red-700 border-red-300' },
  no_aplica: { label: 'N/A', color: 'bg-gray-100 text-gray-700 border-gray-300' }
}

const categorias = {
  revision_interior: {
    titulo: 'Revisión Interior',
    items: [
      { key: 'bocina', label: 'Bocina' },
      { key: 'difusores_aire', label: 'Difusores de aire' },
      { key: 'cinturones_asientos', label: 'Cinturones y asientos' },
      { key: 'senalizadores_comandos', label: 'Señalizadores y comandos' },
      { key: 'luces_interiores', label: 'Luces interiores' }
    ]
  },
  revision_exterior: {
    titulo: 'Revisión Exterior',
    items: [
      { key: 'luces_delanteras', label: 'Luces delanteras' },
      { key: 'plumillas_delanteras', label: 'Plumillas delanteras' },
      { key: 'plumilla_trasera', label: 'Plumilla trasera' },
      { key: 'manillas_cerraduras', label: 'Manillas / Cerraduras / Otros' },
      { key: 'luces_traseras', label: 'Luces traseras' }
    ]
  },
  motor: {
    titulo: 'Motor',
    items: [
      { key: 'nivel_refrigerante', label: 'Nivel de refrigerante' },
      { key: 'nivel_lava_parabrisas', label: 'Nivel lava parabrisas' },
      { key: 'estado_correa_tensor', label: 'Estado correa / tensor / polea' },
      { key: 'fuga_refrigerante', label: 'Fuga refrigerante' },
      { key: 'fuga_aceite', label: 'Fuga aceite' },
      { key: 'otros', label: 'Otros' }
    ]
  },
  llantas_neumaticos: {
    titulo: 'Llantas y Neumáticos',
    items: [
      { key: 'delantero_izquierdo', label: 'Delantero izquierdo' },
      { key: 'trasero_derecho', label: 'Trasero derecho' },
      { key: 'trasero_izquierdo', label: 'Trasero izquierdo' },
      { key: 'delantero_derecho', label: 'Delantero derecho' }
    ]
  },
  frenos: {
    titulo: 'Frenos',
    items: [
      { key: 'pastillas_delanteras', label: 'Pastillas delanteras' },
      { key: 'discos_delanteros', label: 'Discos delanteros' },
      { key: 'pastillas_traseras', label: 'Pastillas traseras' },
      { key: 'discos_traseros', label: 'Discos traseros' }
    ]
  },
  suspension_amortiguacion: {
    titulo: 'Suspensión y Amortiguación',
    items: [
      { key: 'amortiguador_del_der', label: 'Amortiguador del. derecho' },
      { key: 'amortiguador_del_izq', label: 'Amortiguador del. izquierdo' },
      { key: 'bujes_rotulas_del_der', label: 'Bujes/Rotulas del. derecha' },
      { key: 'bujes_rotulas_del_izq', label: 'Bujes/Rotulas del. izquierda' },
      { key: 'cremallera_direccion', label: 'Cremallera de dirección' },
      { key: 'amortiguador_tras_der', label: 'Amortiguador tras. derecho' },
      { key: 'amortiguador_tras_izq', label: 'Amortiguador tras. izquierdo' },
      { key: 'bujes_rotulas_tras_izq', label: 'Bujes/Rotulas tras. izquierda' },
      { key: 'bujes_rotulas_tras_der', label: 'Bujes/Rotulas tras. derecha' }
    ]
  },
  transmision_diferencial: {
    titulo: 'Transmisión / Diferencial / VTG',
    items: [
      { key: 'estado_caja_cambios', label: 'Estado caja de cambios' },
      { key: 'estado_diferenciales', label: 'Estado diferenciales' },
      { key: 'estado_caja_transferencia', label: 'Estado caja transferencia' }
    ]
  },
  bateria_aceite: {
    titulo: 'Batería y Aceite',
    items: [
      { key: 'bateria', label: 'Batería' },
      { key: 'nivel_aceite_motor', label: 'Nivel aceite de motor' }
    ]
  }
}

const formatFecha = (fecha) => {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const obtenerChequeo = async () => {
  try {
    const { data, error } = await supabase
      .from('chequeos')
      .select('*')
      .eq('id', chequeoId.value)
      .single()
    if (error) throw error
    chequeo.value = data
    if (data.ot_id) {
      const { data: otData, error: otError } = await supabase
        .from('orden_trabajo')
        .select('id, diagnostico, vehiculo(patente, marca, modelo), ficha_de_trabajo(id, cliente(nombre, apellido, telefono))')
        .eq('id', data.ot_id)
        .single()
      if (!otError) ot.value = otData
    }
  } catch (error) {
    console.error(error)
  }
}

const irAEditar = () => {
  router.push({ name: 'editar-chequeo', params: { id: chequeoId.value } })
}

const generarPDF = () => {
  router.push({ name: 'chequeo-pdf', params: { id: chequeoId.value } })
}

onMounted(async () => {
  interfaz.showLoading()
  await obtenerChequeo()
  interfaz.hideLoading()
})
</script>
<template>
  <div class="servi-white min-h-screen pb-15 print:bg-white print:pb-0">
    <navbar titulo="ServiML" subtitulo="Ver Chequeo" class="sticky top-0 z-50 print:hidden" />

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:px-2 print:py-0">
      <volver class="print:hidden" />

      <div v-if="chequeo">
        <!-- Header con info OT -->
        <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 mb-6">
          <div class="flex items-center justify-between servi-blue py-6 px-3 rounded-t-xl">
            <h3 class="font-bold text-white text-lg">
              Inspección Técnica
              <p class="font-bold text-sm">Chequeo #{{ chequeo.id }}</p>
            </h3>
            <div class="flex items-center gap-2">
              <span v-if="ot" class="px-2.5 py-1 bg-yellow-100 text-yellow-800 font-bold rounded text-xs">
                {{ ot.vehiculo?.patente || 'S/P' }}
              </span>
              <button @click="generarPDF"
                class="print:hidden px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </button>
              <button @click="irAEditar" v-if="Creador"
                class="print:hidden px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </button>
            </div>
          </div>

          <div v-if="ot" class="grid grid-cols-1 sm:grid-cols-2 sm:gap-4 gap-2 text-sm servi-grey-font px-4 py-4">
            <div class="flex flex-col gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
              </svg>
              <p class="font-bold">Vehículo</p>
              <p>{{ ot.vehiculo?.marca }} {{ ot.vehiculo?.modelo }}</p>
              <p class="font-bold">Patente:</p>
              <p>{{ ot.vehiculo?.patente }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p class="font-bold">Cliente</p>
              <p>{{ ot.ficha_de_trabajo?.cliente?.nombre }} {{ ot.ficha_de_trabajo?.cliente?.apellido }}</p>
              <p class="font-bold">Teléfono:</p>
              <p>+56 {{ ot.ficha_de_trabajo?.cliente?.telefono }}</p>
            </div>
          </div>

          <div class="px-4 pb-4">
            <p class="text-xs servi-grey-font opacity-60">Realizado el {{ formatFecha(chequeo.created_at) }}</p>
          </div>
        </div>

        <!-- Categorías del chequeo -->
        <div v-for="(catMeta, catKey) in categorias" :key="catKey">
          <div v-if="chequeo.datos_chequeo?.[catKey]" class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div class="p-5 servi-blue border-b border-gray-100">
              <h3 class="font-bold text-white text-lg">{{ catMeta.titulo }}</h3>
            </div>
            <div class="p-5 space-y-4">
              <div v-for="item in catMeta.items" :key="item.key"
                v-show="chequeo.datos_chequeo[catKey]?.[item.key]"
                :class="[
                  'rounded-lg transition-all duration-300',
                  chequeo.datos_chequeo[catKey]?.[item.key]?.estado === 'malo' ? 'border border-red-400 p-3 shadow-lg' : ''
                ]">
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div class="flex items-center gap-2 sm:w-48 shrink-0">
                    <span class="font-medium servi-grey-font">{{ item.label }}</span>
                  </div>
                  <div class="flex gap-2 flex-1 flex-wrap">
                    <span :class="[
                      'flex-1 min-w-[80px] py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold border-2 text-center',
                      opciones[chequeo.datos_chequeo[catKey][item.key]?.estado]?.color || 'border-gray-200 servi-grey-font'
                    ]">
                      {{ opciones[chequeo.datos_chequeo[catKey][item.key]?.estado]?.label || chequeo.datos_chequeo[catKey][item.key]?.estado }}
                    </span>
                  </div>
                </div>

                <!-- Detalles si es malo -->
                <div v-if="chequeo.datos_chequeo[catKey][item.key]?.estado === 'malo'" class="mt-3 space-y-3">
                  <div v-if="chequeo.datos_chequeo[catKey][item.key]?.comentario">
                    <label class="text-xs font-semibold text-red-400 mb-1 block">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Comentario
                    </label>
                    <p class="text-sm servi-grey-font bg-white/50 rounded-lg px-3 py-2 border border-red-100">{{ chequeo.datos_chequeo[catKey][item.key].comentario }}</p>
                  </div>

                  <div v-if="chequeo.datos_chequeo[catKey][item.key]?.fotos?.length > 0">
                    <label class="text-xs font-semibold text-red-400 mb-1 block">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Fotografías
                    </label>
                    <div class="flex flex-wrap gap-2">
                      <img v-for="(foto, idx) in chequeo.datos_chequeo[catKey][item.key].fotos" :key="idx"
                        :src="foto" @click="fotoExpandida = foto"
                        class="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg border-2 border-red-200 cursor-pointer hover:opacity-80 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Observaciones generales -->
        <div v-if="chequeo.observaciones" class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div class="p-5 servi-blue border-b border-gray-100">
            <h3 class="font-bold text-white">Observaciones Generales</h3>
          </div>
          <div class="p-5">
            <p class="text-sm servi-grey-font whitespace-pre-wrap">{{ chequeo.observaciones }}</p>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex gap-3 print:hidden">
          <button @click="generarPDF"
            class="flex-1 py-3.5 rounded-xl font-bold text-[#1f3d64] bg-white border-2 border-[#1f3d64] hover:bg-gray-50 transition-all active:scale-95 cursor-pointer shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar PDF
          </button>
          <button @click="irAEditar" v-if="Creador"
            class="flex-1 py-3.5 rounded-xl font-bold text-white servi-blue hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-sm">
            Editar Chequeo
          </button>
        </div>
      </div>
    </div>

    <!-- Modal foto expandida -->
    <div v-if="fotoExpandida" @click="fotoExpandida = null"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer">
      <img :src="fotoExpandida" class="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
      <button @click.stop="fotoExpandida = null"
        class="absolute top-6 right-6 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold cursor-pointer transition-all">
        ✕
      </button>
    </div>
  </div>
</template>

<style scoped>
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .servi-blue {
    background-color: #1f3d64 !important;
    color: white !important;
  }

  .bg-green-100 { background-color: #dcfce7 !important; }
  .text-green-700 { color: #15803d !important; }
  .border-green-300 { border-color: #86efac !important; }
  .bg-red-100 { background-color: #fee2e2 !important; }
  .text-red-700 { color: #b91c1c !important; }
  .border-red-300 { border-color: #fca5a5 !important; }
  .border-red-400 { border-color: #f87171 !important; }
  .bg-gray-100 { background-color: #f3f4f6 !important; }
  .text-gray-700 { color: #374151 !important; }
  .border-gray-300 { border-color: #d1d5db !important; }
  .bg-yellow-100 { background-color: #fef9c3 !important; }
  .text-yellow-800 { color: #854d0e !important; }
}
</style>
