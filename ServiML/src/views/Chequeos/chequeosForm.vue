<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../../lib/supabaseClient.js'
import { comprimirImagen } from '@/js/comprimirFotos.js'
import { subirFotosGeneral } from '@/js/subirFotosGeneral.js'
import navbar from '../../components/componentes/navbar.vue'
import volver from '@/components/componentes/volver.vue'
import modal from '../../components/componentes/modal.vue'
import { useInterfaz } from '@/stores/interfaz.js'
import { useUserStore } from '@/stores/user.js'

const router = useRouter()
const route = useRoute()
const interfaz = useInterfaz()
const userStore = useUserStore()

const otId = ref(route.query.ot_id || null)
const ot = ref(null)
const showModal = ref(false)
const modalTitulo = ref('')
const modalMensaje = ref('')
const modalExito = ref(false)
const observacionesGenerales = ref('')

const opciones = [
  { valor: 'bueno', label: 'Bueno', color: 'bg-green-100 text-green-700 border-green-300' },
  { valor: 'malo', label: 'Malo', color: 'bg-red-100 text-red-700 border-red-300' },
  { valor: 'no_aplica', label: 'N/A', color: 'bg-gray-100 text-gray-700 border-gray-300' }
]

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

// Genera objetos reactivos con la misma estructura de categorías
const generarEstructura = (valorInicial) => {
  const obj = {}
  for (const catKey in categorias) {
    obj[catKey] = {}
    for (const item of categorias[catKey].items) {
      obj[catKey][item.key] = typeof valorInicial === 'function' ? valorInicial() : valorInicial
    }
  }
  return obj
}

const chequeo = reactive(generarEstructura(null))
const comentarios = reactive(generarEstructura(''))
const fotos = reactive(generarEstructura(() => []))

const seleccionarEstado = (catKey, itemKey, valor) => {
  chequeo[catKey][itemKey] = valor
  // Si cambia de 'malo' a otro estado, limpiar comentario y fotos
  if (valor !== 'malo') {
    comentarios[catKey][itemKey] = ''
    fotos[catKey][itemKey] = []
  }
}

const agregarFotos = (catKey, itemKey, event) => {
  const archivos = Array.from(event.target.files || [])
  fotos[catKey][itemKey] = [...fotos[catKey][itemKey], ...archivos]
  event.target.value = ''
}

const eliminarFoto = (catKey, itemKey, index) => {
  fotos[catKey][itemKey].splice(index, 1)
}

const obtenerPreview = (file) => {
  return URL.createObjectURL(file)
}

const todosCompletos = computed(() => {
  for (const catKey in categorias) {
    for (const item of categorias[catKey].items) {
      if (chequeo[catKey][item.key] === null) {
        return false
      }
    }
  }
  return true
})

const obtenerOT = async () => {
  if (!otId.value) return
  try {
    const { data, error } = await supabase
      .from('orden_trabajo')
      .select('id, diagnostico, vehiculo(patente, marca, modelo), ficha_de_trabajo(id, cliente(nombre, apellido, telefono))')
      .eq('id', otId.value)
      .single()
    if (error) throw error
    ot.value = data
  } catch (error) {
    console.error(error)
  }
}

const subirFotos = async (catKey, itemKey) => {
  const archivos = fotos[catKey][itemKey]
  if (!archivos.length) return []
  
  // Comprimir todas las fotos antes de subir
  const comprimidas = []
  for (const archivo of archivos) {
    try {
      const comprimida = await comprimirImagen(archivo)
      comprimidas.push(comprimida)
    } catch (err) {
      console.error('Error comprimiendo imagen:', err)
      comprimidas.push(archivo) // Si falla la compresión, usar la original
    }
  }

  // Subir al worker de Cloudflare
  const resultado = await subirFotosGeneral(comprimidas)
  if (!resultado.exito) {
    console.error('Error subiendo fotos:', resultado.error)
    return []
  }
  return resultado.fotos.map(f => f.url)
}

const guardarChequeo = async () => {
  if (!todosCompletos.value) {
    modalTitulo.value = 'Campos incompletos'
    modalMensaje.value = 'Debes evaluar todos los items antes de guardar.'
    modalExito.value = false
    showModal.value = true
    return
  }

  interfaz.showLoadingOverlay()
  try {
    // Construir datos con comentarios y fotos
    const datosChequeo = {}
    for (const catKey in categorias) {
      datosChequeo[catKey] = {}
      for (const item of categorias[catKey].items) {
        const estado = chequeo[catKey][item.key]
        datosChequeo[catKey][item.key] = {
          estado,
          comentario: estado === 'malo' ? comentarios[catKey][item.key] : '',
          fotos: estado === 'malo' ? await subirFotos(catKey, item.key) : []
        }
      }
    }

    const payload = {
      ot_id: otId.value ? Number(otId.value) : null,
      trabajador_id: userStore.user.id,
      datos_chequeo: datosChequeo,
      observaciones: observacionesGenerales.value
    }

    const { error } = await supabase.from('chequeos').insert(payload)
    if (error) throw error
    const {error:errorOT} = await supabase.from('orden_trabajo').update({chequeo:true}).eq('id', otId.value)
    if (errorOT) throw errorOT
    modalTitulo.value = 'Chequeo guardado'
    modalMensaje.value = 'El chequeo se ha registrado correctamente.'
    modalExito.value = true
    showModal.value = true
  } catch (error) {
    console.error(error)
    modalTitulo.value = 'Error'
    modalMensaje.value = 'No se pudo guardar el chequeo. Intenta nuevamente.'
    modalExito.value = false
    showModal.value = true
  } finally {
    interfaz.hideLoadingOverlay()
  }
}

const cerrarModal = () => {
  showModal.value = false
  if (modalExito.value) {
    router.back()
  }
}

onMounted(async () => {
  interfaz.showLoading()
  await obtenerOT()
  interfaz.hideLoading()
})
</script>
<template>
  <div class="servi-white min-h-screen pb-15">
    <navbar titulo="ServiML" subtitulo="Nuevo Chequeo" class="sticky top-0 z-50" />

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <volver />

      <div v-if="ot" class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 mb-6">
        <div class="flex items-center justify-between mb-3 servi-blue py-6 px-3 rounded-t-xl">
          <h3 class="font-bold text-white text-lg">Inspección Técnica <p class="font-bold text-sm">OT# {{ ot.id }}</p></h3>
          <span class="px-2.5 py-1 bg-yellow-100 text-yellow-800 font-bold rounded text-xs">
            {{ ot.vehiculo?.patente || 'S/P' }}
          </span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 sm:gap-4 gap-2 text-sm servi-grey-font px-4 py-4">
          <div class="flex flex-col gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
            </svg>
            <p class="font-bold">Vehículo</p>
            <p>{{ ot.vehiculo?.marca }} {{ ot.vehiculo?.modelo }} {{ ot.vehiculo?.anio || '' }}</p>
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
      </div>

      <div v-for="(categoria, catKey) in categorias" :key="catKey" class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div class="p-5 servi-blue border-b border-gray-100">
          <h3 class="font-bold text-white text-lg">{{ categoria.titulo }}</h3>
        </div>
        <div class="p-5 space-y-4">
          <div v-for="item in categoria.items" :key="item.key"
            :class="[
              'rounded-lg transition-all duration-300',
              chequeo[catKey][item.key] === 'malo' ? 'border border-red-400 p-3 shadow-lg' : ''
            ]">
            <!-- Estado buttons -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <div class="flex items-center gap-2 sm:w-48 shrink-0">
                <span class="font-medium servi-grey-font">{{ item.label }}</span>
              </div>
              <div class="flex gap-2 flex-1 flex-wrap">
                <button v-for="opcion in opciones" :key="opcion.valor"
                  @click="seleccionarEstado(catKey, item.key, opcion.valor)"
                  :class="[
                    'flex-1 min-w-[80px] py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold border-2 transition-all cursor-pointer active:scale-95',
                    chequeo[catKey][item.key] === opcion.valor
                      ? opcion.color + ' shadow-sm'
                      : 'border-gray-200 servi-grey-font opacity-50 hover:opacity-80'
                  ]">
                  {{ opcion.label }}
                </button>
              </div>
            </div>

            <!-- Sección de comentario y fotos (solo si es 'malo') -->
            <Transition name="slide-malo">
              <div v-if="chequeo[catKey][item.key] === 'malo'" class="mt-3 space-y-3">
                <!-- Comentario -->
                <div>
                  <label class="text-xs font-semibold text-red-400 mb-1 block">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Comentario sobre el problema
                  </label>
                  <textarea v-model="comentarios[catKey][item.key]" rows="2"
                    :placeholder="`Describe el problema en ${item.label.toLowerCase()}...`"
                    class="w-full rounded-lg border-2 border-red-200 servi-adapt-bg px-3 py-2 text-sm servi-grey-font focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none resize-none bg-white">
                  </textarea>
                </div>

                <!-- Fotos -->
                <div>
                  <label class="text-xs font-semibold text-red-400 mb-1 block">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Fotografías (opcional)
                  </label>

                  <!-- Thumbnails -->
                  <div v-if="fotos[catKey][item.key].length > 0" class="flex flex-wrap gap-2 mb-2">
                    <div v-for="(foto, idx) in fotos[catKey][item.key]" :key="idx" class="relative group">
                      <img :src="obtenerPreview(foto)" class="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg border-2 border-red-200" />
                      <button @click="eliminarFoto(catKey, item.key, idx)"
                        class="absolute -top-1.5 -right-1.5 bg-red-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600">
                        ✕
                      </button>
                    </div>
                  </div>

                  <!-- Botón agregar foto -->
                  <label
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-sm text-xs font-semibold border-2 border-dashed border-red-400 text-red-400 hover:bg-red-50 cursor-pointer transition-all active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Adjuntar foto
                    <input type="file" accept="image/*" multiple class="hidden"
                      @change="agregarFotos(catKey, item.key, $event)" />
                  </label>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div class="p-5 servi-blue border-b border-gray-100">
          <h3 class="font-bold text-white">Observaciones Generales</h3>
        </div>
        <div class="p-5">
          <textarea v-model="observacionesGenerales" rows="4" placeholder="Escribe observaciones adicionales..."
            class="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm servi-grey-font focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none resize-none servi-adapt-bg">
          </textarea>
        </div>
      </div>

      <button @click="guardarChequeo"
        :class="[
          'w-full py-3.5 rounded-xl font-bold text-white transition-all active:scale-95 cursor-pointer shadow-sm',
          todosCompletos ? 'servi-blue hover:opacity-90' : 'bg-gray-300 cursor-not-allowed'
        ]">
        Guardar Chequeo
      </button>
    </div>

    <modal v-if="showModal" :titulo="modalTitulo" :mensaje="modalMensaje" :exito="modalExito" @cerrar="cerrarModal" />
  </div>
</template>

<style scoped>
.slide-malo-enter-active,
.slide-malo-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-malo-enter-from,
.slide-malo-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

.slide-malo-enter-to,
.slide-malo-leave-from {
  opacity: 1;
  max-height: 500px;
  margin-top: 0.75rem;
}
</style>
