<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useRoute } from 'vue-router'
import { useInterfaz } from '@/stores/interfaz'
import Navbar from '@/components/componentes/navbar.vue'
import Volver from '@/components/componentes/volver.vue'

const route = useRoute()
const interfaz = useInterfaz()

const chequeoId = ref(route.params.id)
const chequeo = ref(null)
const ot = ref(null)
const datosEmpresa = ref({})

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

const estadoLabel = (estado) => {
  const map = { bueno: 'Bueno', malo: 'Malo', no_aplica: 'N/A' }
  return map[estado] || estado
}

const estadoColor = (estado) => {
  const map = {
    bueno: '#16a34a',
    malo: '#dc2626',
    no_aplica: '#6b7280'
  }
  return map[estado] || '#6b7280'
}

const formatoFecha = (fecha) => {
  if (!fecha) return '---'
  return new Date(fecha).toLocaleDateString('es-CL')
}

const formatoFechaYHora = (fecha) => {
  if (!fecha) return '---'
  return new Date(fecha).toLocaleString('es-CL')
}

const traerDatosEmpresa = async () => {
  const { data } = await supabase.from('serviml').select('*').eq('id', 1).single()
  if (data) datosEmpresa.value = data

  const { data: emailData } = await supabase.from('serviml_email').select('*').eq('id_serviml', 1).eq('prioritario', true).single()
  if (emailData) datosEmpresa.value.email = emailData.email

  const { data: telData } = await supabase.from('serviml_telefono').select('*').eq('id_serviml', 1).eq('prioritario', true).maybeSingle()
  if (telData) datosEmpresa.value.telefono = telData.telefono || ''
}

const cargarDatos = async () => {
  const { data, error } = await supabase
    .from('chequeos')
    .select('*')
    .eq('id', chequeoId.value)
    .single()
  if (error) {
    console.error('Error al cargar chequeo:', error)
    return
  }
  chequeo.value = data

  if (data.ot_id) {
    const { data: otData } = await supabase
      .from('orden_trabajo')
      .select('id, diagnostico, kilometraje_inicial, vehiculo(patente, marca, modelo), ficha_de_trabajo(id, numero_folio, cliente(nombre, apellido, telefono, email, codigo_pais))')
      .eq('id', data.ot_id)
      .single()
    if (otData) ot.value = otData
  }

  if (data.datos_chequeo) {
    for (const catKey in data.datos_chequeo) {
      for (const itemKey in data.datos_chequeo[catKey]) {
        const item = data.datos_chequeo[catKey][itemKey]
        if (item.fotos && item.fotos.length > 0) {
          const fotosBase64 = []
          for (const url of item.fotos) {
            fotosBase64.push(await convertirImagenABase64(url))
          }
          item.fotos = fotosBase64
        }
      }
    }
  }
}

const convertirImagenABase64 = async (url) => {
  try {
    const response = await fetch(url + '?t=' + new Date().getTime())
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    return url
  }
}

const itemsMalos = (datos) => {
  if (!datos) return []
  const result = []
  for (const catKey in categorias) {
    if (!datos[catKey]) continue
    for (const item of categorias[catKey].items) {
      const d = datos[catKey][item.key]
      if (d && d.estado === 'malo') {
        result.push({
          categoria: categorias[catKey].titulo,
          label: item.label,
          comentario: d.comentario || '',
          fotos: d.fotos || []
        })
      }
    }
  }
  return result
}

const generarPDF = () => {
  window.print()
}

onMounted(async () => {
  interfaz.showLoadingOverlay()
  await cargarDatos()
  await traerDatosEmpresa()
  interfaz.hideLoadingOverlay()
})
</script>
<template>
  <div class="min-h-screen pb-20 servi-white font-sans print:absolute print:inset-0 print:z-[9999] print:bg-white">
    
    <div class="print:hidden pb-5">
      <Navbar titulo="ServiML" subtitulo="Chequeo PDF" class="navbar" />
      <div class="mt-4 flex w-[70%] mx-auto justify-between">
        <Volver />
        <button @click="generarPDF" class="ml-4 px-4 py-2 bg-[#1f3d64] text-white rounded-lg transition-colors cursor-pointer">
          Generar PDF
        </button>
      </div>
    </div>

    <div class="mx-auto">
    <div 
      id="elemento-a-imprimir" 
      class="mx-auto overflow-hidden max-w-[21cm] bg-white print:w-full print:max-w-none print:m-0 print:border-none print:shadow-none"
    >
      <div class="px-4 py-2 mx-auto text-xs font-sans leading-normal" v-if="chequeo">

        <!-- ==================== PORTADA ==================== -->
        <div class="flex flex-col items-center justify-center min-h-[90vh] text-center">
          <!-- Logo y branding -->
          <div class="mb-8">
            <span class="w-32 h-32 rounded-full overflow-hidden border-2 border-[#1f3d64] mx-auto block">
              <img class="w-full h-full object-cover" src="../../img/Logo.jpg" alt="Logo">
            </span>
            <h1 class="text-4xl font-black tracking-tighter italic text-[#1f3d64] mt-4">SERVIML</h1>
            <p class="font-bold uppercase text-[13px] tracking-[0.3em] text-[#4b5563] mt-1">Servicios Mecánicos</p>
          </div>

          <!-- Título del documento -->
          <div class="mb-8">
            <div class="inline-block px-8 py-3 rounded-lg">
              <h2 class="text-2xl font-bold tracking-wide uppercase text-[#1f3d64]">Chequeo Vehicular</h2>
            </div>
            <div class="mt-3">
              <p class="text-lg font-mono font-bold text-[#dc2626]">Chequeo N° {{ chequeo.id }}</p>
              <p v-if="ot" class="text-sm text-[#6b7280] mt-1">OT #{{ ot.id }}</p>
              <p class="text-sm text-[#6b7280] mt-1">{{ formatoFecha(chequeo.created_at) }}</p>
            </div>
          </div>

          <!-- Separador -->
          <div class="w-24 h-1 bg-[#1f3d64] rounded mx-auto mb-8"></div>

          <!-- Info empresa y cliente lado a lado -->
          <div class="grid grid-cols-2 gap-10 text-left w-full max-w-lg mx-auto mb-8">
            <div>
              <h3 class="font-bold border-b-2 border-[#1f3d64] mb-2 pb-1 text-[11px] uppercase text-[#1f3d64]">De: ServiML</h3>
              <ul class="space-y-1 text-[#374151] text-xs">
                <li><span class="font-bold text-[#111827]">Dirección:</span> {{ datosEmpresa?.dirección || '...' }}</li>
                <li><span class="font-bold text-[#111827]">Ciudad:</span> {{ datosEmpresa?.ciudad || '...' }}</li>
                <li><span class="font-bold text-[#111827]">Teléfono:</span> {{ datosEmpresa?.telefono || 'Sin Teléfono' }}</li>
                <li><span class="font-bold text-[#111827]">Email:</span> {{ datosEmpresa?.email || '...' }}</li>
              </ul>
            </div>
            <div>
              <h3 class="font-bold border-b-2 border-[#1f3d64] mb-2 pb-1 text-[11px] uppercase text-[#1f3d64]">Para: Cliente</h3>
              <ul class="space-y-1 text-[#374151] text-xs" v-if="ot">
                <li>
                  <span class="font-bold text-[#111827]">Cliente:</span>
                  {{ ot.ficha_de_trabajo?.cliente?.nombre }} {{ ot.ficha_de_trabajo?.cliente?.apellido }}
                </li>
                <li>
                  <span class="font-bold text-[#111827]">Teléfono:</span>
                  +{{ ot.ficha_de_trabajo?.cliente?.codigo_pais || '56' }} {{ ot.ficha_de_trabajo?.cliente?.telefono }}
                </li>
                <li>
                  <span class="font-bold text-[#111827]">Email:</span>
                  {{ ot.ficha_de_trabajo?.cliente?.email || 'Sin Email' }}
                </li>
              </ul>
              <p v-else class="text-xs text-[#9ca3af]">Sin datos de cliente</p>
            </div>
          </div>

          <!-- Vehículo -->
          <div class="w-full max-w-lg mx-auto text-left mb-6" v-if="ot">
            <h3 class="font-bold border-b-2 border-[#1f3d64] mb-2 pb-1 text-[11px] uppercase text-[#1f3d64]">Vehículo</h3>
            <div class="p-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
              <p class="font-bold uppercase text-sm text-[#1f3d64]">
                {{ ot.vehiculo?.marca }} {{ ot.vehiculo?.modelo }} {{ ot.vehiculo?.anio || '' }}
              </p>
              <p class="text-xs mt-1 text-[#4b5563]">
                Patente: <span class="font-bold px-1 rounded bg-[#fef9c3]">{{ ot.vehiculo?.patente }}</span>
              </p>
              <p v-if="ot.kilometraje_inicial" class="text-[10px] mt-1 text-[#6b7280]">KM: {{ ot.kilometraje_inicial || '---' }}</p>
            </div>
          </div>

          <!-- Firmas -->
          <div class="flex gap-16 justify-center mt-4">
            <div class="text-center w-36">
              <div class="h-12 border-b-2 border-[#d1d5db] mb-1"></div>
              <p class="text-[9px] font-bold text-[#9ca3af] uppercase">Firma Taller</p>
            </div>
            <div class="text-center w-36">
              <div class="h-12 border-b-2 border-[#d1d5db] mb-1"></div>
              <p class="text-[9px] font-bold text-[#9ca3af] uppercase">Firma Cliente</p>
            </div>
          </div>

          <!-- Footer portada -->
          <div class="mt-8 text-center">
            <p class="text-[9px] uppercase tracking-widest font-bold text-[#9ca3af]">ServiML • Soluciones Automotrices de Confianza</p>
          </div>
        </div>

        <!-- ==================== DETALLE DE CHEQUEO ==================== -->
        <div class="bg-white relative" style="page-break-before: always;">
          <div class="w-full h-2 bg-[#1f3d64]"></div>
          
          <div class="p-5">
            <div class="flex justify-between items-end border-b border-[#e5e7eb] pb-2 mb-4">
              <div>
                <h2 class="text-xl font-bold uppercase tracking-tight text-[#1f3d64]">Detalle de Inspección</h2>
                <p class="text-xs text-[#6b7280]">Resultado completo del chequeo vehicular</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] font-mono text-[#9ca3af]">
                  Chequeo #{{ chequeo.id }}
                  <template v-if="ot"> / {{ ot.vehiculo?.marca }} {{ ot.vehiculo?.modelo }}</template>
                </p>
              </div>
            </div>

            <!-- Tabla de items por categoría -->
            <template v-for="(catMeta, catKey) in categorias" :key="catKey">
              <div v-if="chequeo.datos_chequeo?.[catKey]" class="mb-4 break-inside-avoid">
                <h3 class="flex items-center gap-3 text-[11px] font-bold uppercase border-b-2 pb-1 mb-2 text-[#1f3d64] border-[#1f3d64]">
                  {{ catMeta.titulo }}
                </h3>
                <table class="w-full text-[11px]">
                  <tbody>
                    <tr v-for="item in catMeta.items" :key="item.key"
                      v-show="chequeo.datos_chequeo[catKey]?.[item.key]"
                      class="border-b border-[#f3f4f6]">
                      <td class="py-1.5 pr-3 text-[#475569] w-[60%]">{{ item.label }}</td>
                      <td class="py-1.5 text-right">
                        <span class="inline-block px-2 py-0.5 rounded font-bold text-[10px]"
                          :style="{
                            color: estadoColor(chequeo.datos_chequeo[catKey][item.key]?.estado),
                            backgroundColor: estadoColor(chequeo.datos_chequeo[catKey][item.key]?.estado) + '18'
                          }">
                          {{ estadoLabel(chequeo.datos_chequeo[catKey][item.key]?.estado) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <!-- Observaciones generales -->
            <div v-if="chequeo.observaciones" class="mt-4 break-inside-avoid">
              <h3 class="flex items-center gap-3 text-[11px] font-bold uppercase border-b-2 pb-1 mb-2 text-[#1f3d64] border-[#1f3d64]">
                Observaciones Generales
              </h3>
              <p class="text-[11px] leading-snug text-[#4b5563]">{{ chequeo.observaciones }}</p>
            </div>

            <div class="mt-6 pt-4 text-center border-t break-inside-avoid border-[#f3f4f6]">
              <p class="text-[9px] uppercase tracking-widest font-bold text-[#9ca3af]">
                ServiML • Soluciones Automotrices de Confianza
              </p>
            </div>
          </div>
        </div>

        <!-- ==================== HALLAZGOS (items malo) ==================== -->
        <div v-if="itemsMalos(chequeo.datos_chequeo).length > 0" class="bg-white relative" style="page-break-before: always;">
          <div class="w-full h-2 bg-[#1f3d64]"></div>
          
          <div class="p-5">
            <div class="flex justify-between items-end border-b border-[#e5e7eb] pb-2 mb-4">
              <div>
                <h2 class="text-xl font-bold uppercase tracking-tight text-[#1f3d64]">Hallazgos y Observaciones</h2>
                <p class="text-xs text-[#6b7280]">Detalle de items con estado deficiente y registro fotográfico</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] font-mono text-[#9ca3af]">{{ itemsMalos(chequeo.datos_chequeo).length }} hallazgo(s)</p>
              </div>
            </div>

            <div v-for="(hallazgo, index) in itemsMalos(chequeo.datos_chequeo)" :key="index" class="flex gap-3 mb-4 break-inside-avoid">
              <div class="flex flex-col items-center">
                <div class="w-2 h-2 rounded-full mt-2 bg-[#dc2626]"></div>
                <div class="w-px flex-grow my-1 bg-[#e2e8f0]" v-if="index !== itemsMalos(chequeo.datos_chequeo).length - 1"></div>
              </div>
              <div class="flex-1 border border-l-4 p-3 rounded shadow-sm bg-white border-[#f3f4f6] border-l-[#dc2626]">
                <div class="flex justify-between items-start mb-2">
                  <p class="text-[11px] font-bold uppercase text-[#1f2937]">{{ hallazgo.label }}</p>
                  <span class="text-[9px] px-2 py-0.5 rounded font-mono text-[#9ca3af] bg-[#f9fafb]">{{ hallazgo.categoria }}</span>
                </div>
                <p v-if="hallazgo.comentario" class="text-[11px] leading-snug mb-3 text-[#4b5563]">{{ hallazgo.comentario }}</p>
                
                <div v-if="hallazgo.fotos.length > 0" class="flex gap-2 mt-1 pt-2 border-t border-dashed border-[#f3f4f6]">
                  <img v-for="(foto, fIdx) in hallazgo.fotos" :key="fIdx" :src="foto" class="w-20 h-20 object-cover rounded border shadow-sm border-[#e5e7eb]">
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 text-center border-t break-inside-avoid border-[#f3f4f6]">
              <p class="text-[9px] uppercase tracking-widest font-bold text-[#9ca3af]">
                ServiML • Soluciones Automotrices de Confianza
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.html2pdf__page-break {
  page-break-before: always;
  break-before: always;
  height: 0;
  display: block;
}

#elemento-a-imprimir {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
</style>