<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useRoute } from 'vue-router';
import { useInterfaz } from '@/stores/interfaz';
import Navbar from '@/components/componentes/navbar.vue';
import html2pdf from 'html2pdf.js';
import Volver from '@/components/componentes/volver.vue';
const route = useRoute()
const router = useRouter()
const interfaz = useInterfaz()


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
    .select(`*, informe_final(*),presupuesto_ficha(*), cliente (*),orden_trabajo (*, trabajadores(*),vehiculo(*,cliente(*))),cotizaciones_ficha(*,detalle_cotizaciones_ficha(*),serviml_cuenta(*))`) 
    .eq('id', route.params.id)
    .single()

    if (data) {
      ficha.value = data
      presupuesto.value = data.presupuesto_ficha[0]
      informeFinal.value = data.informe_final[0]
      cotizacion.value = data.cotizaciones_ficha?.find(c => c.estado === 2) || null
    }

    if (error) {
      console.error('Error al traer datos de la ficha:', error)
    }
}

const handleVerificarInformeFinal = async () => {
  const {data, error} = await supabase.from('informe_final').select('*').eq('id_ficha', route.params.id)
  if (error) {
    console.error('Error al verificar informe final:', error)
    return false
  }
  return data && data.length > 0
}

const generarPDF = () => {
  const elemento = document.getElementById('elemento-a-imprimir');
  const opciones = {
    margin:       0,
    filename:     `InformeFinal_${informeFinal.value.numero_folio}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opciones).from(elemento).save();
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
  interfaz.showLoading()
  await traerDatosEmpresa()
  await traerEmail()
  await traerTelefono()
  await cargarDatos()
  await obtenerEstados()
  if (route.query.generar === 'true') {
    generarInformeFinal()
  }
  console.log(ficha.value)
  interfaz.hideLoading()
})
</script>

<template>
  <div class="servi-white min-h-screen font-sans">
    <Navbar :titulo="'Ficha N°' + (ficha?.id || '...')" subtitulo="Informe Final" class="navbar" />
    <div class="mt-4 flex w-[70%] mx-auto justify-between">
      <Volver />
      <button @click="generarPDF" class="ml-4 px-4 py-2 bg-servi-blue text-white rounded-lg hover:bg-servi-blue/80 transition-colors">
        Generar PDF
      </button>
    </div>
  <div class="border border-green-100 w-[70%] mx-auto mt-10 rounded-md shadow-lg mb-10 overflow-hidden">
  <div 
    id="elemento-a-imprimir" 
    class="bg-[#ffffff] text-[#000000] p-10 max-w-[21cm] min-h-[27.9cm] mx-auto text-xs font-sans leading-normal"
    style="background-color: #ffffff;"
  >
    
    <!-- Header -->
    <div class="flex justify-between border-b-4 border-servi-blue pb-4 mb-4">
      
      <div class="flex items-center gap-2">
        <span class="w-24 h-24 rounded-full overflow-hidden border border-[#e5e7eb]">
            <img class="w-full h-full object-cover" src="../../img/Logo.jpg" alt="Logo">
        </span>
        <div>
            <h1 class="text-2xl font-black text-servi-blue tracking-tighter italic">SERVIML</h1>
            <p class="text-[#4b5563] font-bold uppercase text-[11px] tracking-widest mt-1">Servicios Mecánicos</p>
        </div>
      </div>

      <div class="text-right">
        <h2 class="text-lg font-bold text-servi-blue">INFORME FINAL</h2>
        <p class="text-md font-mono text-[#dc2626] font-bold">
            Folio N° {{ presupuesto?.numero_folio || '---' }}
        </p>
        <p class="text-[#6b7280] mt-1 text-[11px]">
            Fecha: {{ formatoFecha(informeFinal?.created_at) }}
        </p>
        <div :style="{backgroundColor: handleEstados(ficha?.estado).color}" class="mt-2 inline-block text-white px-2 py-1 rounded font-bold text-[10px] uppercase">
          {{ handleEstados(ficha?.estado).estado }}
        </div>
      </div>
    </div>

    <div v-if="!cotizacion" class="p-10 text-center border-2 border-dashed border-red-300 rounded-xl my-10">
      <p class="text-red-500 font-bold">No hay una cotización aprobada para este informe.</p>
    </div>
    
    <div v-else>
      <div class="grid grid-cols-2 gap-10 mb-8">
        <div>
          <h3 class="font-bold text-servi-blue border-b border-[#cbd5e1] mb-2 pb-1 text-[11px] uppercase">De: ServiML</h3>
          <ul class="text-[#374151] space-y-1">
            <li><span class="font-bold text-[#111827]">Dirección:</span> {{ datosEmpresa?.dirección || '...' }}</li>
            <li><span class="font-bold text-[#111827]">Ciudad:</span> {{ datosEmpresa?.ciudad || '...' }}</li>
            <li><span class="font-bold text-[#111827]">Teléfono:</span> {{ datosEmpresa?.telefono || 'Sin Teléfono' }}</li>
            <li><span class="font-bold text-[#111827]">Email:</span> {{ datosEmpresa?.email || '...' }}</li>
          </ul>
        </div>

        <div>
          <h3 class="font-bold text-servi-blue border-b border-[#cbd5e1] mb-2 pb-1 text-[11px] uppercase">Para: Cliente</h3>
          <ul class="text-[#374151] space-y-1">
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

      <!-- Resumen Ficha / Vehículos -->
      <div class="mb-6">
        <h3 class="font-bold text-servi-blue border-b border-[#cbd5e1] mb-2 pb-1 text-[11px] uppercase">Lista de vehiculos</h3>
        <div class="grid grid-cols-2 gap-4">
          <div v-for="orden in ficha?.orden_trabajo" :key="orden.id" class="bg-gray-50 p-3 rounded-lg border border-gray-100">
             <p class="font-bold text-servi-blue uppercase text-sm">
               {{ orden.vehiculo.marca }} {{ orden.vehiculo.modelo }} {{ orden.vehiculo.anio }}
             </p>
             <p class="text-xs text-gray-600 mt-1">
               Patente: <span class="font-bold bg-yellow-100 px-1 rounded">{{ orden.vehiculo.patente }}</span>
             </p>
             <p class="text-[10px] text-gray-500 mt-1">KM Entrada: {{ orden.kilometraje_inicial || '---' }}</p>
             <p class="text-[10px] text-gray-500 mt-1">Diagnostico: {{ orden.diagnostico || '---' }}</p>
          </div>
        </div>
      </div>

      <div class="mb-8 border border-[#e5e7eb] rounded-lg overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-servi-blue text-[#ffffff] text-[10px] uppercase tracking-wider">
              <th class="p-3 font-semibold">Descripción del Servicio / Repuesto</th>
              <th class="p-3 text-right w-28">P. Unitario</th>
              <th class="p-3 text-right w-20">Cant.</th>
              <th class="p-3 text-right w-28">Total</th>
            </tr>
          </thead>
          <tbody class="text-[#1f2937] text-[11px]">
            <tr 
              v-for="(item, index) in cotizacion?.detalle_cotizaciones_ficha || []" 
              :key="index"
              class="bg-[#ffffff] border-b border-gray-100 last:border-0"
            >
              <td class="p-3 font-medium text-servi-blue">{{ item.descripcion }}</td>
              <td class="p-3 text-right font-bold">{{ formatoPesos(item.monto) }}</td>
              <td class="p-3 text-right font-bold">{{ item.cantidad }}</td>
              <td class="p-3 text-right font-bold">{{ TotalItem(item) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-between items-start gap-8">
        <div class="w-3/5">
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h4 class="font-bold text-servi-blue uppercase text-[10px] mb-2">Comentarios del Informe</h4>
            <p class="text-[#4b5563] italic text-[11px] leading-relaxed">
              {{ cotizacion?.comentario || 'Servicio realizado satisfactoriamente según lo presupuestado.' }}
            </p>
          </div>
          
          <div class="mt-8 flex gap-12">
            <div class="text-center w-32">
               <div class="h-10 border-b border-gray-300 mb-1"></div>
               <p class="text-[9px] font-bold text-gray-400">FIRMA TALLER</p>
            </div>
            <div class="text-center w-32">
               <div class="h-10 border-b border-gray-300 mb-1"></div>
               <p class="text-[9px] font-bold text-gray-400">FIRMA CLIENTE</p>
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

          <div class="flex justify-between items-center bg-servi-blue text-[#ffffff] p-3 rounded mt-2 shadow-md">
            <span class="font-bold text-md tracking-tighter uppercase">Total Final</span>
            <span class="font-bold text-lg">{{ formatoPesos(cotizacion?.total_final || 0) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-16 text-center border-t border-[#e5e7eb] pt-4">
      <p class="text-[#9ca3af] text-[9px] uppercase tracking-widest font-bold">
        ServiML • Soluciones Automotrices de Confianza
      </p>
    </div>

  </div>
  </div>
  </div>
</template>

<style scoped>
#elemento-a-imprimir {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

@media print {
  .no-print {
    display: none;
  }
}
</style>
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