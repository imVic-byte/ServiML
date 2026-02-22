<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useRoute } from 'vue-router';
import { useInterfaz } from '@/stores/interfaz';
import Navbar from '@/components/componentes/navbar.vue';
import html2pdf from 'html2pdf.js';
import Volver from '@/components/componentes/volver.vue';
import { enviarInformeFinal } from '@/js/enviarInformeFinal';
const route = useRoute()
const router = useRouter()
const interfaz = useInterfaz()
const loading = ref(true);
const enviandoCorreo = ref(false);

const formatoPesos = (valor) => {
  if (valor === undefined || valor === null) return '$0';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
};

const formatoFechaYHora = (fecha) => {
  if (!fecha) return '---';
  return new Date(fecha).toLocaleString('es-CL');
};

const formatoFecha = (fecha) => {
  if (!fecha) return '---';
  return new Date(fecha).toLocaleDateString('es-CL');
};

const TotalItem = (item) => {
  return formatoPesos(Number(item.monto) * Number(item.cantidad))
};

const datosEmpresa = ref({})

const traerDatosEmpresa = async () => {
  const {data, error} = await supabase.from('serviml').select('*').eq('id', 1).single()
  if (data) {
    datosEmpresa.value = data
  }
  if (error) {
    console.error('Error al traer datos de la empresa:', error)
  }
}

const traerEmail = async () => {
  const {data, error} = await supabase.from('serviml_email').select('*').eq('id_serviml', 1).eq('prioritario',true).single()
  if (data) {
    datosEmpresa.value.email = data.email
  }
  if (error) {
    console.error('Error al traer datos de la empresa:', error)
  }
}

const traerTelefono = async () => {
  const {data,error} = await supabase.from('serviml_telefono').select('*').eq('id_serviml', 1).eq('prioritario',true).maybeSingle()
  if (data) {
    datosEmpresa.value.telefono = data.telefono || ''
  }
  if (error) {
    datosEmpresa.value.telefono = ''
  }
}

const cuentaSeleccionada = computed(() => {
  return cotizacion.value?.serviml_cuenta || null
})

const generarYsubir = async () => {
  enviandoCorreo.value = true;
  const elemento = document.getElementById('elemento-a-imprimir')
  if (!elemento) return
  const opciones = {
    margin: [10, 10, 10, 10],
    filename: `InformeFinal_${presupuesto.value?.numero_folio}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, scrollY: 0 }, // El scale 2 evita que se vea borroso
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }, // Esta línea es CLAVE
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  try {
    const pdfBlob = await html2pdf().set(opciones).from(elemento).output('blob');
    const {exito,error} = await enviarInformeFinal(ficha.value.cliente.id,informeFinal.value.id, presupuesto.value.numero_folio, pdfBlob)
    if (error) {
      console.error('Error al subir el informe final:', error)
    }
  } catch (error) {
    console.error('Error al generar el informe final:', error)
  } finally {
    enviandoCorreo.value = false;
  }
}

const generarInformeFinal = async () => {
  const yaExiste = await handleVerificarInformeFinal()
  if (yaExiste) {
    return
  }
  if (!ficha.value || !cotizacion.value) {
    console.error('Falta ficha o cotización aprobada para generar el informe final')
    return
  }
  const {data, error} = await supabase
    .from('informe_final')
    .insert({
      cliente_nombre: ficha.value.cliente.nombre,
      cliente_apellido: ficha.value.cliente.apellido,
      cliente_telefono: ficha.value.cliente.telefono,
      cliente_email: ficha.value.cliente.email,
      total_final: cotizacion.value.total_final,
      cliente_codigo_pais: ficha.value.cliente.codigo_pais,
      id_ficha: ficha.value.id,
    })
    .select()
    .single()
  if (error) {
    console.error('Error al generar informe final:', error)
  }
  if (data) {
    informeFinal.value = data
    await generarYsubir()
  }
  const {error:errorInformeFinal} = await supabase.from('ficha_de_trabajo').update({informe_final:true}).eq('id',ficha.value.id)
  if (errorInformeFinal) {
    console.error('Error al generar informe final:', errorInformeFinal)
  }
  await cargarDatos()
}

const informeFinal = ref(null)
const ficha = ref(null)
const cotizacion = ref(null)
const presupuesto = ref(null)

const cargarDatos = async () => {
    const {data, error} = await supabase
    .from('ficha_de_trabajo')
    .select(`*, informe_final(*),presupuesto_ficha(*), cliente (*),orden_trabajo (*, trabajadores(*),vehiculo(*,cliente(*)), OT_bitacora(*), OT_fotos_ingreso(*)),cotizaciones_ficha(*,detalle_cotizaciones_ficha(*),serviml_cuenta(*))`) 
    .eq('id', route.params.id)
    .single()

    if (data) {
      ficha.value = data
      presupuesto.value = data.presupuesto_ficha[0]
      informeFinal.value = data.informe_final[0]
      cotizacion.value = data.cotizaciones_ficha?.find(c => c.estado === 2) || null
      
      // Fetch bitácora photos
      for (const ot of ficha.value.orden_trabajo) {
        if (ot.OT_bitacora) {
          for (const entry of ot.OT_bitacora) {
            const { data: fotos } = await supabase
              .from('OT_Fotos')
              .select('*')
              .eq('id_OT_bitacora', entry.id);
            entry.fotos = fotos || [];
          }
        }
      }
    }

    if (error) {
      console.error('Error al traer datos de la ficha:', error)
    }
}

const convertirImagenABase64 = async (url) => {
  try {
    const response = await fetch(url + '?t=' + new Date().getTime());
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return url;
  }
};

const procesarImagenesParaPDF = async () => {
  if (!ficha.value || !ficha.value.orden_trabajo) return;
  
  for (const ot of ficha.value.orden_trabajo) {
    // 1. Fotos de ingreso
    if (ot.OT_fotos_ingreso) {
      for (const item of ot.OT_fotos_ingreso) {
        if (item.url) item.url = await convertirImagenABase64(item.url);
      }
    }
    // 2. Fotos de bitácora
    if (ot.OT_bitacora) {
      for (const entry of ot.OT_bitacora) {
        if (entry.fotos) {
          for (const foto of entry.fotos) {
            if (foto.url) foto.url = await convertirImagenABase64(foto.url);
          }
        }
      }
    }
  }
};

const handleVerificarInformeFinal = async () => {
  const {data, error} = await supabase.from('informe_final').select('*').eq('id_ficha', route.params.id)
  if (error) {
    console.error('Error al verificar informe final:', error)
    return false
  }
  return data && data.length > 0
}



const generarPDF = () => {
  window.print()
}


const estados = ref([])

const obtenerEstados = async () => {
  const {data, error} = await supabase.from('tabla_estados_ficha').select('*')
  if (error) {
    console.error('Error al obtener estados:', error)
    estados.value = []
  }
  estados.value = data
}

const handleEstados = (estado) => {
  const estadoEncontrado = estados.value.find(e => e.id === estado)
  return estadoEncontrado ? {estado: estadoEncontrado.estado, color: estadoEncontrado.color} : {estado: 'Estado Desconocido', color: '#000000'}
}

onMounted(async () => {
  interfaz.showLoadingOverlay()
  await cargarDatos()
  await traerDatosEmpresa()
  await traerEmail()
  await traerTelefono()
  await obtenerEstados()
  await procesarImagenesParaPDF()
  interfaz.hideLoadingOverlay();
  if (route.query.generar === 'true') {
    generarInformeFinal()
  }
})
</script>
<template>
  <div class="min-h-screen font-sans bg-white print:absolute print:inset-0 print:z-[9999] print:bg-white">
    
    <div class="print:hidden">
      <Navbar :titulo="'Ficha N°' + (ficha?.id || '...')" subtitulo="Informe Final" class="navbar" />
      <div class="mt-4 flex w-[70%] mx-auto justify-between">
        <Volver />
        <button @click="generarPDF" class="ml-4 px-4 py-2 bg-[#1f3d64] text-white rounded-lg transition-colors">
          Generar PDF
        </button>
      </div>
    </div>
    <div v-if="enviandoCorreo"
      class="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
      <p class="font-bold text-lg">Generando y enviando informe...</p>
      <p class="text-sm opacity-80">Por favor espera un momento.</p>
    </div>
    <div class="mt-10 mb-10">
    <div 
      id="elemento-a-imprimir" 
      class="mx-auto overflow-hidden bg-white print:w-full print:max-w-none print:m-0 print:border-none print:shadow-none"
    >
      <div class="px-4 py-2 max-w-[21cm] mx-auto text-xs font-sans leading-normal">
        
        <div class="flex justify-between pb-4 mb-4 border-b-4 border-[#1f3d64]">
          <div class="flex items-center gap-2">
            <span class="w-24 h-24 rounded-full overflow-hidden border border-[#e5e7eb]">
                <img class="w-full h-full object-cover" src="../../img/Logo.jpg" alt="Logo">
            </span>
            <div>
                <h1 class="text-2xl font-black tracking-tighter italic text-[#1f3d64]">SERVIML</h1>
                <p class="font-bold uppercase text-[11px] tracking-widest mt-1 text-[#4b5563]">Servicios Mecánicos</p>
            </div>
          </div>

          <div class="text-right">
            <h2 class="text-lg font-bold text-[#1f3d64]">INFORME FINAL</h2>
            <p class="text-md font-mono font-bold text-[#dc2626]">
                Folio N° {{ presupuesto?.numero_folio || '---' }}
            </p>
            <p class="mt-1 text-[11px] text-[#6b7280]">
                Fecha: {{ formatoFecha(informeFinal?.created_at) }}
            </p>
            <div :style="{backgroundColor: handleEstados(ficha?.estado).color}" class="mt-2 pb-2 inline-block text-white px-2 py-1 rounded font-bold text-[10px] uppercase">
              {{ handleEstados(ficha?.estado).estado }}
            </div>
          </div>
        </div>

        <div v-if="!cotizacion" class="p-10 text-center border-2 border-dashed border-[#fca5a5] rounded-xl my-10">
          <p class="font-bold text-[#ef4444]">No hay una cotización aprobada para este informe.</p>
        </div>
        
        <div v-else>
          <div class="grid grid-cols-2 gap-10 mb-8">
            <div>
              <h3 class="font-bold border-b border-[#cbd5e1] mb-2 pb-1 text-[11px] uppercase text-[#1f3d64]">De: ServiML</h3>
              <ul class="space-y-1 text-[#374151]">
                <li><span class="font-bold text-[#111827]">Dirección:</span> {{ datosEmpresa?.dirección || '...' }}</li>
                <li><span class="font-bold text-[#111827]">Ciudad:</span> {{ datosEmpresa?.ciudad || '...' }}</li>
                <li><span class="font-bold text-[#111827]">Teléfono:</span> {{ datosEmpresa?.telefono || 'Sin Teléfono' }}</li>
                <li><span class="font-bold text-[#111827]">Email:</span> {{ datosEmpresa?.email || '...' }}</li>
              </ul>
            </div>

            <div>
              <h3 class="font-bold border-b border-[#cbd5e1] mb-2 pb-1 text-[11px] uppercase text-[#1f3d64]">Para: Cliente</h3>
              <ul class="space-y-1 text-[#374151]">
                <li>
                  <span class="font-bold text-[#111827]">Cliente:</span> 
                  {{ ficha?.cliente ? (ficha.cliente.nombre + ' ' + ficha.cliente.apellido) : 'Sin Nombre' }}
                </li>
                <li>
                  <span class="font-bold text-[#111827]">Teléfono:</span> 
                  {{ ficha?.cliente ? ('+' + ficha.cliente.codigo_pais + ' ' + ficha.cliente.telefono) : 'Sin Teléfono' }}
                </li>
                <li>
                  <span class="font-bold text-[#111827]">Email:</span> 
                  {{ ficha?.cliente?.email || 'Sin Email' }}
                </li>
              </ul>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="font-bold border-b border-[#cbd5e1] mb-2 pb-1 text-[11px] uppercase text-[#1f3d64]">Lista de vehiculos</h3>
            <div class="grid grid-cols-2 gap-4 break-inside-avoid">
              <div v-for="orden in ficha?.orden_trabajo" :key="orden.id" class="p-3 rounded-lg border border-[#f3f4f6] bg-[#f9fafb]">
                 <p class="font-bold uppercase text-sm text-[#1f3d64]">
                   {{ orden.vehiculo.marca }} {{ orden.vehiculo.modelo }} {{ orden.vehiculo.anio }}
                 </p>
                 <p class="text-xs mt-1 text-[#4b5563]">
                   Patente: <span class="font-bold px-1 rounded pb-2 bg-[#fef9c3]">{{ orden.vehiculo.patente }}</span>
                 </p>
                 <p class="text-[10px] mt-1 text-[#6b7280]">KM Entrada: {{ orden.kilometraje_inicial || '---' }}</p>
                 <p class="text-[10px] mt-1 text-[#6b7280]">Diagnostico: {{ orden.diagnostico || '---' }}</p>
              </div>
            </div>
          </div>

          <div class="mb-8 border border-[#e5e7eb] rounded-lg overflow-hidden break-inside-avoid">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="text-white text-[10px] uppercase tracking-wider bg-[#1f3d64]">
                  <th class="p-3 font-semibold">Descripción del Servicio / Repuesto</th>
                  <th class="p-3 text-right w-28">P. Unitario</th>
                  <th class="p-3 text-right w-20">Cant.</th>
                  <th class="p-3 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody class="text-[11px] text-[#1f2937]">
                <tr 
                  v-for="(item, index) in cotizacion?.detalle_cotizaciones_ficha || []" 
                  :key="index"
                  class="border-b border-[#f3f4f6] last:border-0 bg-white break-inside-avoid"
                >
                  <td class="p-3 font-medium text-[#1f3d64]">{{ item.descripcion }}</td>
                  <td class="p-3 text-right font-bold">{{ formatoPesos(item.monto) }}</td>
                  <td class="p-3 text-right font-bold">{{ item.cantidad }}</td>
                  <td class="p-3 text-right font-bold">{{ TotalItem(item) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-between items-start gap-8 break-inside-avoid">
            <div class="w-3/5">
              <div class="p-4 rounded-lg border border-[#f3f4f6] bg-[#f9fafb]">
                <h4 class="font-bold uppercase text-[10px] mb-2 text-[#1f3d64]">Comentarios del Informe</h4>
                <p class="italic text-[11px] leading-relaxed text-[#4b5563]">
                  {{ cotizacion?.comentario || 'Servicio realizado satisfactoriamente según lo presupuestado.' }}
                </p>
              </div>
              
              <div class="mt-8 flex gap-12">
                <div class="text-center w-32">
                   <div class="h-10 border-b border-[#d1d5db] mb-1"></div>
                   <p class="text-[9px] font-bold text-[#9ca3af]">FIRMA TALLER</p>
                </div>
                <div class="text-center w-32">
                   <div class="h-10 border-b border-[#d1d5db] mb-1"></div>
                   <p class="text-[9px] font-bold text-[#9ca3af]">FIRMA CLIENTE</p>
                </div>
              </div>
            </div>

            <div class="w-2/5">
              <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
                <span class="font-medium">Subtotal</span>
                <span>{{ formatoPesos(cotizacion?.subtotal || 0) }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#16a34a]">
                <span class="font-medium">Descuento ({{ cotizacion?.descuento || 0 }}%)</span>
                <span>- {{ formatoPesos((cotizacion?.subtotal || 0) * (cotizacion?.descuento || 0) / 100) }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
                <span class="font-medium">Total Neto</span>
                <span>{{ formatoPesos(cotizacion?.total_neto || 0) }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
                <span class="font-medium">IVA 19%</span>
                <span>{{ formatoPesos(cotizacion?.iva || 0) }}</span>
              </div>

              <div class="flex justify-between items-center text-white p-3 rounded mt-2 shadow-md bg-[#1f3d64]">
                <span class="font-bold text-md tracking-tighter uppercase">Total Final</span>
                <span class="font-bold text-lg">{{ formatoPesos(cotizacion?.total_final || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
        <template v-for="ot in ficha?.orden_trabajo" :key="ot.id" >
          <div class="bg-white relative" style="page-break-before: always;">
            <div class="w-full h-2 bg-[#1f3d64]"></div>
            
            <div class="p-5">
              <div class="flex justify-between items-end border-b border-[#e5e7eb] pb-2 mb-4">
                <div>
                   <h2 class="text-xl font-bold uppercase tracking-tight text-[#1f3d64]">Informe Técnico Detallado</h2>
                   <p class="text-xs text-[#6b7280]">Anexo de inspección visual y bitácora de trabajo</p>
                </div>
                <div class="text-right">
                   <p class="text-[10px] font-mono text-[#9ca3af]">OT-{{ ot.id }} / {{ ot.vehiculo.marca }} {{ ot.vehiculo.modelo }}</p>
                </div>
              </div>

              <div class="grid grid-cols-12 gap-4 mb-6">
                <div class="col-span-4 rounded-lg p-3 border shadow-sm break-inside-avoid bg-[#f8fafc] border-[#f1f5f9]">
                   <h4 class="font-bold uppercase text-[10px] mb-2 border-b pb-1 text-[#1f3d64] border-[#e2e8f0]">Inventario & Accesorios</h4>
                   <ul class="space-y-1 text-[11px]">
                     <li class="flex justify-between items-center">
                        <span class="text-[#475569]">Documentos</span>
                        <span :class="ot.trae_documentos ? 'text-[#16a34a] font-bold' : 'text-[#9ca3af]'">{{ ot.trae_documentos ? 'Sí' : 'No' }}</span>
                      </li>
                      <li class="flex justify-between items-center">
                        <span class="text-[#475569]">Llaves</span>
                        <span :class="ot.trae_llaves ? 'text-[#16a34a] font-bold' : 'text-[#9ca3af]'">{{ ot.trae_llaves ? 'Sí' : 'No' }}</span>
                      </li>
                      <li class="flex justify-between items-center">
                        <span class="text-[#475569]">Candado Seg.</span>
                        <span :class="ot.trae_candado_seguridad ? 'text-[#16a34a] font-bold' : 'text-[#9ca3af]'">{{ ot.trae_candado_seguridad ? 'Sí' : 'No' }}</span>
                      </li>
                      <li class="flex justify-between items-center">
                        <span class="text-[#475569]">Panel Radio</span>
                        <span :class="ot.trae_panel_radio ? 'text-[#16a34a] font-bold' : 'text-[#9ca3af]'">{{ ot.trae_panel_radio ? 'Sí' : 'No' }}</span>
                      </li>
                      <li class="flex justify-between items-center">
                        <span class="text-[#475569]">Rueda Rep.</span>
                        <span :class="ot.trae_rueda_repuesto ? 'text-[#16a34a] font-bold' : 'text-[#9ca3af]'">{{ ot.trae_rueda_repuesto ? 'Sí' : 'No' }}</span>
                      </li>
                      <li class="flex justify-between items-center">
                        <span class="text-[#475569]">Encendedor</span>
                        <span :class="ot.trae_encendedor ? 'text-[#16a34a] font-bold' : 'text-[#9ca3af]'">{{ ot.trae_encendedor ? 'Sí' : 'No' }}</span>
                      </li>
                   </ul>
                </div>
                
                <div class="col-span-8 break-inside-avoid">
                  <div class="grid grid-cols-2 gap-4 mb-3">
                     <div class="border rounded shadow-sm text-center p-2 bg-[#f8fafc] border-[#f1f5f9]">
                        <span class="block text-[9px] font-bold uppercase tracking-widest text-[#94a3b8]">Kilometraje</span>
                        <span class="block text-lg font-bold mt-0.5 text-[#1f3d64]">{{ ot.kilometraje_inicial || '0' }} km</span>
                     </div>
                     <div class="border rounded shadow-sm text-center p-2 bg-[#f8fafc] border-[#f1f5f9]">
                        <span class="block text-[9px] font-bold uppercase tracking-widest text-[#94a3b8]">Combustible</span>
                        <div class="w-full rounded-full h-2 mt-1.5 mb-1 bg-[#e5e7eb]">
                          <div class="h-2 rounded-full bg-[#22c55e]" :style="{ width: (ot.combustible_inicial || 0) + '%' }"></div>
                        </div>
                        <span class="block text-[11px] font-bold text-[#1f3d64]">{{ ot.combustible_inicial || '0' }}%</span>
                     </div>
                  </div>

                  <div v-if="ot.OT_fotos_ingreso && ot.OT_fotos_ingreso.length > 0">
                     <h4 class="font-bold uppercase text-[10px] mb-1 text-[#1f3d64]">Registro Fotográfico de Ingreso</h4>
                     <div class="flex gap-2 overflow-hidden h-24 p-1 rounded border bg-[#f1f5f9] border-[#e2e8f0]">
                        <div v-for="(item, index) in ot.OT_fotos_ingreso.slice(0, 3)" :key="index" class="relative w-1/3 h-full">
                           <img :src="item.url" class="absolute inset-0 w-full h-full object-cover rounded-sm border border-[#cbd5e1]">
                        </div>
                     </div>
                  </div>
                  <div v-else class="h-24 rounded border border-dashed flex items-center justify-center bg-[#f8fafc] border-[#cbd5e1]">
                     <span class="text-xs text-[#94a3b8]">Sin registro fotográfico de ingreso</span>
                  </div>
                </div>
              </div>

              <div class="mt-4">
                 <h3 class="flex items-center gap-3 text-sm font-bold uppercase border-b-2 pb-1 mb-3 break-inside-avoid text-[#1f3d64] border-[#1f3d64]">
                    Bitácora de Trabajo
                 </h3>

                 <div v-if="ot.OT_bitacora && ot.OT_bitacora.length > 0">
                    <div v-for="(item, index) in ot.OT_bitacora.filter(e => e.observacion)" :key="index" class="flex gap-3 mb-4 break-inside-avoid">
                       <div class="flex flex-col items-center">
                          <div class="w-2 h-2 rounded-full mt-2 bg-[#1f3d64]"></div>
                          <div class="w-px flex-grow my-1 bg-[#e2e8f0]" v-if="index !== ot.OT_bitacora.length - 1"></div>
                       </div>
                       <div class="flex-1 border border-l-4 p-3 rounded shadow-sm bg-white border-[#f3f4f6] border-l-[#1f3d64]">
                          <div class="flex justify-between items-start mb-2">
                             <p class="text-[11px] font-bold uppercase text-[#1f2937]">Detalle de actividad</p>
                             <span class="text-[9px] px-2 py-0.5 rounded font-mono text-[#9ca3af] bg-[#f9fafb]">{{ formatoFecha(item.created_at) }}</span>
                          </div>
                          <p class="text-[11px] leading-snug mb-3 text-[#4b5563]">{{ item.observacion }}</p>
                          
                          <div v-if="item.fotos && item.fotos.length > 0" class="flex gap-2 mt-1 pt-2 border-t border-dashed border-[#f3f4f6]">
                             <img v-for="(foto, fIdx) in item.fotos" :key="fIdx" :src="foto.url" class="w-20 h-20 object-cover rounded border shadow-sm border-[#e5e7eb]">
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div v-else class="text-center py-2 rounded border border-dashed break-inside-avoid bg-[#f8fafc] border-[#f1f5f9]">
                    <p class="text-xs italic text-[#94a3b8]">No se registraron hallazgos adicionales para este vehículo.</p>
                 </div>
              </div>

              <div class="mt-6 pt-4 text-center border-t break-inside-avoid border-[#f3f4f6]">
                <p class="text-[9px] uppercase tracking-widest font-bold text-[#9ca3af]">
                  ServiML • Soluciones Automotrices de Confianza
                </p>
              </div>
            </div>
          </div>
        </template>
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