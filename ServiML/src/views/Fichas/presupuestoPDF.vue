<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useRoute } from 'vue-router';
import { useInterfaz } from '@/stores/interfaz';
import Navbar from '@/components/componentes/navbar.vue';
import html2pdf from 'html2pdf.js';
import Volver from '@/components/componentes/volver.vue';
import { subirFacturas } from '@/js/subirFacturas.js';
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
  if (!cotizaciones.value || cotizaciones.value.length === 0) return null
  return cotizaciones.value[0]?.serviml_cuenta || null
})

const diasEstacionamientoPDF = computed(() => {
  if (!ficha.value || !ficha.value.fecha_estacionamiento) return 0
  const inicio = new Date(ficha.value.fecha_estacionamiento)
  const fin = ficha.value.fecha_termino_estacionamiento ? new Date(ficha.value.fecha_termino_estacionamiento) : new Date()
  const diffTime = fin - inicio
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
})

const totalCargoEstacionamientoPDF = computed(() => {
  return diasEstacionamientoPDF.value * 5000
})

const subtotalAgregado = computed(() => {
  if (!cotizaciones.value) return 0
  return cotizaciones.value.reduce((sum, c) => sum + (c.subtotal || 0), 0)
})

const totalNetoAgregado = computed(() => {
  if (!cotizaciones.value) return 0
  return cotizaciones.value.reduce((sum, c) => sum + (c.total_neto || 0), 0)
})

const ivaAgregado = computed(() => {
  if (!cotizaciones.value) return 0
  return cotizaciones.value.reduce((sum, c) => sum + (c.iva || 0), 0)
})

const totalFinalAgregado = computed(() => {
  if (!cotizaciones.value) return 0
  return cotizaciones.value.reduce((sum, c) => sum + (c.total_final || 0), 0)
})

const totalFinalFinal = computed(() => {
  let total = totalFinalAgregado.value
  if (diasEstacionamientoPDF.value > 1) {
    total += totalCargoEstacionamientoPDF.value
  }
  return total
})

const generarPresupuesto = async () => {
  const yaExiste = await handleVerificarPresupuesto()
  if (yaExiste) {
    console.log('Ya existe un presupuesto para esta ficha')
    return
  }
  if (!ficha.value || !cotizaciones.value || cotizaciones.value.length === 0) {
    return
  }
  const primeraCotizacion = cotizaciones.value[0]
  const {data, error} = await supabase
    .from('presupuesto_ficha')
    .insert({
      total_final: totalFinalFinal.value,
      id_ficha: ficha.value.id,
      id_cuenta: primeraCotizacion.serviml_cuenta?.id,
      id_cotizacion: primeraCotizacion.id,
    })
    .select()
    .single()
  if (error) {
    return
  }
  presupuesto.value = data
  await nextTick()
  await supabase
    .from('ficha_de_trabajo')
    .update({presupuesto:true})
    .eq('id', ficha.value.id)
  const folio = data?.numero_folio || data?.id || 'sin-folio';
  const opciones = {
    margin:       0,
    filename:     `Presupuesto_Folio_${folio}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  
  const elemento = document.getElementById('elemento-a-imprimir');
  const pdfBlob = await html2pdf().set(opciones).from(elemento).output('blob');

  const { exito, url, error:errorFactura } = await subirFacturas(data.id, pdfBlob)
  if (!exito) {
    console.error('Error al subir la factura:', errorFactura)
    return
  }
  if (ficha.value.cliente?.email && url) {
    try {
      await supabase.functions.invoke('enviar-presupuesto', {
        body: {
          emailCliente: ficha.value.cliente.email,
          nombreCliente: ficha.value.cliente.nombre,
          apellidoCliente: ficha.value.cliente.apellido,
          urlPdf: url,
          folio: folio
        }
      })
    } catch (err) {
    }
  }
}

const presupuesto = ref(null)
const ficha = ref(null)
const cotizaciones = ref([])

const cargarDatos = async () => {
    const {data, error} = await supabase
    .from('ficha_de_trabajo')
    .select(`*, presupuesto_ficha(*), cliente (*),orden_trabajo (*, trabajadores(*),vehiculo(*,cliente(*))),cotizaciones_ficha(*,detalle_cotizaciones_ficha(*),serviml_cuenta(*))`) 
    .eq('id', route.params.id)
    .single()

    if (data) {
      ficha.value = data
      presupuesto.value = data.presupuesto_ficha
      cotizaciones.value = data.cotizaciones_ficha?.filter(c => Number(c.estado) === 2) || []
    }

    if (error) {
      console.error('Error al traer datos de la ficha:', error)
    }
}

const handleVerificarPresupuesto = async () => {
  const {data, error} = await supabase.from('presupuesto_ficha').select('*').eq('id_ficha', route.params.id)
  if (error) {
    console.error('Error al verificar presupuesto:', error)
    return false
  }
  return data && data.length > 0
}

const generarPDF = () => {
  window.print()
}


onMounted(async () => {
  interfaz.showLoading()
  await traerDatosEmpresa()
  await traerEmail()
  await traerTelefono()
  await cargarDatos()
  if (route.query.generar === 'true') {
    await generarPresupuesto()
  }
  interfaz.hideLoading()
})
</script>

<template>
  <div class="servi-white min-h-screen font-sans">
    <div class="print:hidden mb-10">
    <Navbar :titulo="'Ficha N°' + (ficha?.id || '...')" subtitulo="Presupuesto" class="navbar" />
    <div class="mt-4 flex w-[70%] mx-auto justify-between">
      <Volver />
      <button @click="generarPDF" class="ml-4 px-4 py-2 bg-[#1f3d64] text-white rounded-lg hover:bg-[#1f3d64]/80 transition-colors">
        Generar PDF
      </button>
    </div>
    </div>
  <div class="mx-auto">
  <div 
    id="elemento-a-imprimir" 
    class="bg-[#ffffff] text-[#000000] max-w-[21cm] mx-auto text-xs font-sans leading-normal"
    style="background-color: #ffffff;"
  >
    
    <!-- Header -->
    <div class="flex justify-between border-b-4 border-[#1f3d64] pb-4 mb-2">
      
      <div class="flex items-center gap-2">
        <span class="w-24 h-24 rounded-full overflow-hidden border border-[#e5e7eb]">
            <img class="w-full h-full object-cover" src="../../img/Logo.jpg" alt="Logo">
        </span>
        <div>
            <h1 class="text-2xl font-black text-[#1f3d64] tracking-tighter italic">SERVIML</h1>
            <p class="text-[#4b5563] font-bold uppercase text-[11px] tracking-widest mt-1">Servicios Mecánicos</p>
        </div>
      </div>

      <div class="text-right">
        <h2 class="text-lg font-bold text-[#1f3d64]">Presupuesto</h2>
        <p class="text-md font-mono text-[#dc2626] font-bold">
            N° {{ presupuesto?.numero_folio || '---' }}
        </p>
        <p class="text-[#6b7280] mt-1 text-[11px]">
            Fecha: {{ formatoFecha(presupuesto?.created_at) }}
        </p>
      </div>
    </div>
    <div v-if="cotizaciones.length === 0" class="p-10 text-center border-2 border-dashed border-red-300 rounded-xl my-10">
      <p class="text-red-500 font-bold">No hay cotizaciones aprobadas para previsualizar.</p>
      <p class="text-gray-500 text-xs mt-2">Asegúrate de que al menos una cotización esté aprobada para ver el presupuesto.</p>
    </div>
    <div v-else class="grid grid-cols-2 gap-10 mb-8">
      <div>
        <h3 class="font-bold text-[#1f3d64] border-b border-[#cbd5e1] mb-2 pb-1 text-[11px] uppercase">De: ServiML</h3>
        <ul class="text-[#374151] space-y-1">
          <li><span class="font-bold text-[#111827]">Dirección:</span> {{ datosEmpresa?.dirección || '...' }}</li>
          <li><span class="font-bold text-[#111827]">Ciudad:</span> {{ datosEmpresa?.ciudad || '...' }}</li>
          <li><span class="font-bold text-[#111827]">Teléfono:</span> {{ datosEmpresa?.telefono || 'Sin Teléfono' }}</li>
          <li><span class="font-bold text-[#111827]">Email:</span> {{ datosEmpresa?.email || '...' }}</li>
        </ul>
      </div>

      <div>
        <h3 class="font-bold text-[#1f3d64] border-b border-[#cbd5e1] mb-2 pb-1 text-[11px] uppercase">Para: Cliente</h3>
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
    <h3 v-if="cotizaciones.length > 0" class="font-bold text-[#1f3d64] border-b border-[#cbd5e1] mb-2 pb-1 text-[11px] uppercase">Resumen</h3>
    <div v-if="cotizaciones.length > 0" class="mb-4 flex justify-between">
      <ul class="text-[#374151] flex-row w-full">
        <li class="w-[53%]">
          <span class="font-bold text-left align-left text-[#111827] text-start">Motivo Ingreso:</span> 
          <p>{{ ficha?.motivo_ingreso || '---' }}</p>
        </li>
        <li>
          <span class="font-bold text-left align-left text-[#111827] text-start">Fecha Ingreso:</span> 
          <p>{{ formatoFechaYHora(ficha?.fecha_ingreso) }}</p>
        </li>
      </ul>
      <ul class="text-[#374151] flex-row w-full h-full align-top">
        <li>
          <span class="font-bold text-left align-left text-[#111827] text-start">Lista de vehiculos:</span> 
          <p class="mt-1 uppercase" v-for="orden in ficha?.orden_trabajo" :key="orden.id">
            - {{ orden.vehiculo.marca }} {{ orden.vehiculo.modelo }} 
            <span class="p-1 mt-1 font-bold text-[#1f3d64] rounded-lg"> {{ orden.vehiculo.patente }} </span>
          </p>
        </li>
      </ul>
    </div>

    <!-- Tabla de items: una sección por cotización -->
    <div v-if="cotizaciones.length > 0" class="mb-8 border border-[#e5e7eb] rounded-lg overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-[#1f3d64] text-[#ffffff] text-[10px] uppercase tracking-wider">
            <th class="p-3 font-semibold">Descripción del Servicio / Repuesto</th>
            <th class="p-3 text-right w-28">Precio Unitario</th>
            <th class="p-3 text-right w-28">Cantidad</th>
            <th class="p-3 text-right w-28">Total</th>
          </tr>
        </thead>
        <tbody class="text-[#1f2937] text-[11px]">
          <template v-for="(cot, ci) in cotizaciones" :key="cot.id">
            <!-- Separador con título si hay más de una cotización -->
            <tr v-if="cotizaciones.length > 1" class="bg-[#f1f5f9]">
              <td colspan="4" class="p-2 font-bold text-[#1f3d64] text-[10px] uppercase tracking-wider">
                Cotización N°{{ ci + 1 }}
                <span v-if="cot.comentario" class="font-normal text-[#6b7280] ml-2">— {{ cot.comentario }}</span>
              </td>
            </tr>
            <tr 
              v-for="(item, index) in cot.detalle_cotizaciones_ficha || []" 
              :key="cot.id + '-' + index"
              class="bg-[#ffffff] shadow-lg border-b border-[#1f3d64]"
            >
              <td class="p-3 font-medium text-[#1f3d64]">{{ item.descripcion }}</td>
              <td class="p-3 text-right font-bold">{{ formatoPesos(item.monto) }}</td>
              <td class="p-3 text-right font-bold">{{ item.cantidad }}</td>
              <td class="p-3 text-right font-bold">{{ TotalItem(item) }}</td>
            </tr>
          </template>
          <!-- Anexo de Estacionamiento -->
          <tr v-if="diasEstacionamientoPDF > 1" class="bg-amber-50 shadow-lg border-b border-[#1f3d64]">
            <td class="p-3 font-medium text-[#1f3d64]">Servicio de Estacionamiento ({{ diasEstacionamientoPDF }} días)</td>
            <td class="p-3 text-right font-bold">{{ formatoPesos(5000) }}</td>
            <td class="p-3 text-right font-bold">{{ diasEstacionamientoPDF }}</td>
            <td class="p-3 text-right font-bold">{{ formatoPesos(totalCargoEstacionamientoPDF) }}</td>
          </tr>
          <tr v-if="cotizaciones.reduce((sum, c) => sum + (c.detalle_cotizaciones_ficha?.length || 0), 0) < 5" class="h-24">
            <td colspan="4"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Totales + cuenta bancaria -->
    <div v-if="cotizaciones.length > 0" class="flex justify-between items-start gap-8">
      
      <div v-if="cuentaSeleccionada" class="w-3/5 bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]">
        <h4 class="font-bold text-[#1f3d64] uppercase text-[10px] mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#1f3d64]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          Datos de Transferencia
        </h4>
        <div class="text-[10px] text-[#475569] grid grid-cols-2 gap-x-4 gap-y-1">
          <p><span class="font-bold">Banco:</span> {{ cuentaSeleccionada.banco }}</p>
          <p><span class="font-bold">Tipo:</span> {{ cuentaSeleccionada.tipo_cuenta }}</p>
          <p><span class="font-bold">RUT:</span> {{ cuentaSeleccionada.rut_titular }}</p>
          <p><span class="font-bold">Titular:</span> {{ cuentaSeleccionada.titular }}</p>
          <p><span class="font-bold">N° Cuenta:</span> {{ cuentaSeleccionada.numero_cuenta }}</p>
        </div>
      </div>

      <div :class="cuentaSeleccionada ? 'w-2/5' : 'w-2/5 ml-auto'">
        <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
          <span class="font-medium">Subtotal</span>
          <span>{{ formatoPesos(subtotalAgregado) }}</span>
        </div>
        
        <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
          <span class="font-medium">Total Neto</span>
          <span>{{ formatoPesos(totalNetoAgregado) }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
          <span class="font-medium">IVA 19%</span>
          <span>{{ formatoPesos(ivaAgregado) }}</span>
        </div>

        <div v-if="diasEstacionamientoPDF > 1" class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
          <span class="font-medium text-amber-600">Cargo Estacionamiento</span>
          <span class="font-bold text-amber-600">+ {{ formatoPesos(totalCargoEstacionamientoPDF) }}</span>
        </div>

        <div class="flex justify-between items-center bg-[#1f3d64] text-[#ffffff] p-3 rounded mt-2">
          <span class="font-bold text-md">TOTAL</span>
          <span class="font-bold text-md">{{ formatoPesos(totalFinalFinal) }}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-16 text-center border-t border-[#e5e7eb] pt-4">
      <p class="text-[#9ca3af] text-[9px] uppercase tracking-wide">
        Gracias por su preferencia - ServiML
      </p>
    </div>

  </div>
  </div>
  </div>
</template>

<style scoped>
/* REGLA DE ORO: Forzar impresión exacta de colores */
#elemento-a-imprimir {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}
</style>


