<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useRoute } from 'vue-router';
import { useInterfaz } from '@/stores/interfaz';
import Navbar from '@/components/componentes/navbar.vue';
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

const generarPresupuesto = async () => {
  const yaExiste = await handleVerificarPresupuesto()
  if (yaExiste) {
    return
  }
  if (!ficha.value || !cotizacion.value) {
    console.error('Falta ficha o cotización aprobada para generar el presupuesto')
    return
  }
  const {data, error} = await supabase
    .from('presupuesto')
    .insert({
      id_cliente: ficha.value.cliente.id,
      subtotal: cotizacion.value.subtotal,
      descuento: cotizacion.value.descuento,
      iva: cotizacion.value.iva,
      total_neto: cotizacion.value.total_neto,
      total_final: cotizacion.value.total_final,
      id_ficha: ficha.value.id,
      id_cuenta: cotizacion.value.serviml_cuenta.id,
    })
    .select()
    .single()

  if (data) {
    for (const detalle of cotizacion.value.detalle_cotizaciones_ficha) {
      await supabase.from('detalle_presupuesto').insert({
        id_presupuesto: data.id,
        cantidad: detalle.cantidad,
        monto: detalle.monto,
        descripcion: detalle.descripcion
      })
    }
    const {error} = await supabase
      .from('ficha_de_trabajo')
      .update({presupuesto: true})
      .eq('id', ficha.value.id)
  }
  if (error) {
    console.error('Error al generar presupuesto:', error)
  }
  await cargarDatos()
}

const presupuesto = ref(null)
const ficha = ref(null)
const cotizacion = ref(null)

const cargarDatos = async () => {
    const {data, error} = await supabase
    .from('ficha_de_trabajo')
    .select(`*, presupuesto(*), cliente (*),orden_trabajo (*, trabajadores(*),vehiculo(*,cliente(*))),cotizaciones_ficha(*,detalle_cotizaciones_ficha(*),serviml_cuenta(*))`) 
    .eq('id', route.params.id)
    .single()

    if (data) {
      ficha.value = data
      presupuesto.value = data.presupuesto && data.presupuesto.length > 0 ? data.presupuesto[0] : null
      cotizacion.value = data.cotizaciones_ficha?.find(c => c.estado === 2) || null
    }

    if (error) {
      console.error('Error al traer datos de la ficha:', error)
    }
}

const handleVerificarPresupuesto = async () => {
  const {data, error} = await supabase.from('presupuesto').select('*').eq('id_ficha', route.params.id)
  if (error) {
    console.error('Error al verificar presupuesto:', error)
    return false
  }
  return data && data.length > 0
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
    <Navbar :titulo="'Ficha N°' + (ficha?.id || '...')" subtitulo="Presupuesto" class="navbar" />
    <div class="mt-4 flex w-[90%] mx-auto">
      <Volver />
    </div>
  <div 
    id="elemento-a-imprimir" 
    class="bg-[#ffffff] text-[#000000] p-10 max-w-[21cm] min-h-[27.9cm] mx-auto text-xs font-sans leading-normal"
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
    <div v-if="!cotizacion" class="p-10 text-center border-2 border-dashed border-red-300 rounded-xl my-10">
      <p class="text-red-500 font-bold">No hay cotización seleccionada para previsualizar.</p>
      <p class="text-gray-500 text-xs mt-2">Asegúrate de que la cotización esté aprobada para ver el presupuesto.</p>
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
    <h3 v-if="cotizacion" class="font-bold text-[#1f3d64] border-b border-[#cbd5e1] mb-2 pb-1 text-[11px] uppercase">Resumen</h3>
    <div v-if="cotizacion" class="mb-4 flex justify-between items-center">
      <ul class="text-[#374151] flex-row w-full">
        <li class="w-[53%]">
          <span class="font-bold text-left align-left text-[#111827] text-start">Motivo Ingreso:</span> 
          <p>{{ ficha?.motivo_ingreso || '---' }}</p>
        </li>
        <li>
          <span class="font-bold text-left align-left text-[#111827] text-start">Fecha Ingreso:</span> 
          <p>{{ formatoFechaYHora(ficha?.fecha_ingreso) }}</p>
        </li>
        <li>
          <span class="font-bold text-left align-left text-[#111827] text-start">Comentarios adicionales:</span> 
          <p>{{ cotizacion?.comentario || '---' }}</p>
        </li>
      </ul>
      <ul class="text-[#374151] flex-row w-full">
        <li>
          <span class="font-bold text-left align-left text-[#111827] text-start">Lista de vehiculos:</span> 
          <p v-for="orden in ficha?.orden_trabajo" :key="orden.id">
            {{ orden.vehiculo.marca }} {{ orden.vehiculo.modelo }} {{ orden.vehiculo.año }}
          </p>
        </li>
      </ul>
    </div>
    <div v-if="cotizacion" class="mb-8 border border-[#e5e7eb] rounded-lg overflow-hidden">
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
          
          <tr 
            v-for="(item, index) in cotizacion?.detalle_cotizaciones_ficha || []" 
            :key="index"
            class="bg-[#ffffff] shadow-lg border-b border-[#1f3d64] "
          >
            <td class="p-3 font-medium text-[#1f3d64]">{{ item.descripcion }}</td>
            <td class="p-3 text-right font-bold">{{ formatoPesos(item.monto) }}</td>
            <td class="p-3 text-right font-bold">{{ item.cantidad }}</td>
            <td class="p-3 text-right font-bold">{{ TotalItem(item) }}</td>
          </tr>
          <tr v-if="!cotizacion?.detalle_cotizaciones_ficha || cotizacion.detalle_cotizaciones_ficha.length < 5" class="h-24">
            <td colspan="4"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Totales + cuenta bancaria -->
    <div v-if="cotizacion" class="flex justify-between items-start gap-8">
      
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
          <span>{{ formatoPesos(cotizacion?.subtotal || 0) }}</span>
        </div>
        
        <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#16a34a]">
          <span class="font-medium">Descuento</span>
          <span>- {{ cotizacion?.descuento || 0 }}%</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
          <span class="font-medium">Total Neto</span>
          <span>{{ formatoPesos(cotizacion?.total_neto || 0) }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
          <span class="font-medium">IVA 19%</span>
          <span>{{ formatoPesos(cotizacion?.iva || 0) }}</span>
        </div>

        <div class="flex justify-between items-center bg-[#1f3d64] text-[#ffffff] p-3 rounded mt-2">
          <span class="font-bold text-md">TOTAL</span>
          <span class="font-bold text-md">{{ formatoPesos(cotizacion?.total_final || 0) }}</span>
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
</template>

<style scoped>
/* REGLA DE ORO: Forzar impresión exacta de colores */
#elemento-a-imprimir {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}
</style>


