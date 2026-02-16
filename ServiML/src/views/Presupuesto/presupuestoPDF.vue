<script setup>
import { ref, onMounted,computed } from 'vue';
import { supabase } from '@/lib/supabaseClient';

const props = defineProps({
  presupuesto: {
    type: Object,
    required: true
  },
  cuentaSeleccionada: {
    type: Object,
    default: null
  }
});

const formatoPesos = (valor) => {
  if (valor === undefined || valor === null) return '$0';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
};

const formatoFecha = (fecha) => {
  if (!fecha) return new Date().toLocaleDateString('es-CL');
  return new Date(fecha).toLocaleDateString('es-CL');
};

const subtotalNeto = computed(() => {
  if (!props.presupuesto.detalle_presupuesto) return 0;
  return props.presupuesto.detalle_presupuesto.reduce((acc, item) => {
    return acc + (Number(item.precio_unitario) * Number(item.cantidad));
  }, 0);
});

const montoDescuento = computed(() => {
  return Number(props.presupuesto.descuento) || 0;
});

const baseImponible = computed(() => {
  return Math.max(0, subtotalNeto.value - montoDescuento.value);
});

const montoIVA = computed(() => {
  return Math.round(baseImponible.value * 0.19);
});

const totalFinal = computed(() => {
  return baseImponible.value + montoIVA.value;
});


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
  const {data,error} = await supabase.from('serviml_telefono').select('*').eq('id_serviml', 1).eq('prioritario',true).single()
  if (data) {
    datosEmpresa.value.telefono = data.telefono
  }
  if (error) {
    console.error('Error al traer datos de la empresa:', error)
  }
}

onMounted(async () => {
  await traerDatosEmpresa()
  await traerEmail()
  await traerTelefono()
})

</script>

<template>
  <div 
    id="elemento-a-imprimir" 
    class="bg-[#ffffff] text-[#000000] p-10 max-w-[21cm] min-h-[27.9cm] mx-auto text-xs font-sans leading-normal"
    style="background-color: #ffffff;"
  >
    
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
        <h2 class="text-lg font-bold text-[#1f3d64]">PRESUPUESTO</h2>
        <p class="text-md font-mono text-[#dc2626] font-bold">
            N° {{ presupuesto.numero_folio || '---' }}
        </p>
        <p class="text-[#6b7280] mt-1 text-[11px]">
            Fecha: {{ formatoFecha(presupuesto.created_at) }}
        </p>
        <div class="mt-2 inline-block bg-[#fee2e2] text-[#991b1b] px-2 py-1 rounded font-bold text-[10px] uppercase border border-[#fecaca]">
          Validez: 14 Días
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-10 mb-8">
      <div>
        <h3 class="font-bold text-[#1f3d64] border-b border-[#cbd5e1] mb-2 pb-1 text-[11px] uppercase">De: ServiML</h3>
        <ul class="text-[#374151] space-y-1">
          <li><span class="font-bold text-[#111827]">Dirección:</span> {{ datosEmpresa.dirección }}</li>
          <li><span class="font-bold text-[#111827]">Ciudad:</span> {{ datosEmpresa.ciudad }}</li>
          <li><span class="font-bold text-[#111827]">Teléfono:</span>{{ datosEmpresa.telefono }}</li>
          <li><span class="font-bold text-[#111827]">Email:</span> {{ datosEmpresa.email }}</li>
        </ul>
      </div>

      <div>
        <h3 class="font-bold text-[#1f3d64] border-b border-[#cbd5e1] mb-2 pb-1 text-[11px] uppercase">Para: Cliente</h3>
        <ul class="text-[#374151] space-y-1">
          <li>
            <span class="font-bold text-[#111827]">Cliente:</span> 
            {{ presupuesto.cliente?.nombre + ' ' + presupuesto.cliente?.apellido || 'Sin Nombre' }}
          </li>
          <li>
            <span class="font-bold text-[#111827]">Fono:</span> 
            +{{ presupuesto.cliente?.codigo_pais + ' ' + presupuesto.cliente?.telefono || 'Sin Teléfono' }}
          </li>
          <li>
            <span class="font-bold text-[#111827]">Correo:</span> 
            {{ presupuesto.cliente?.email || 'Sin Correo' }}
          </li>
          <li>
            <span class="font-bold text-[#111827]">Vehículo:</span> 
            <span v-if="presupuesto.vehiculo?.patente" class="ml-2 px-1 bg-[#fef08a] pb-2 mb-2 text-[#854d0e] font-bold rounded">
                {{ presupuesto.vehiculo.patente }} - {{ presupuesto.vehiculo.marca }} {{ presupuesto.vehiculo.modelo }}
            </span>
          </li>
        </ul>
      </div>
    </div>

    <div class="mb-8 border border-[#e5e7eb] rounded-lg overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-[#1f3d64] text-[#ffffff] text-[10px] uppercase tracking-wider">
            <th class="p-3 font-semibold">Descripción del Servicio / Repuesto</th>
            <th class="p-3 text-right w-28">Total</th>
          </tr>
        </thead>
        <tbody class="text-[#1f2937] text-[11px]">
          
          <tr 
            v-for="(item, index) in presupuesto.detalle_presupuesto" 
            :key="index"
            class="bg-[#ffffff] shadow-lg border-b border-[#1f3d64] "
          >
            <td class="p-3 font-medium text-[#1f3d64]">{{ item.descripcion }}</td>
            <td class="p-3 text-right font-bold">{{ formatoPesos(item.monto) }}</td>
          </tr>
          <tr v-if="!presupuesto.detalle_presupuesto || presupuesto.detalle_presupuesto.length < 5" class="h-24">
            <td colspan="4"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex justify-between items-start gap-8">
      
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
          <p v-if="datosEmpresa.email"><span class="font-bold">Correo:</span> {{ datosEmpresa.email }}</p>
        </div>
      </div>

      <div class="w-2/5">
        <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
          <span class="font-medium">Subtotal</span>
          <span>{{ formatoPesos(presupuesto.subtotal) }}</span>
        </div>
        
        <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#16a34a]">
          <span class="font-medium">Descuento</span>
          <span>- {{ presupuesto.descuento }}%</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
          <span class="font-medium">Total Neto</span>
          <span>{{ formatoPesos(presupuesto.total_neto) }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-[#e5e7eb] text-[#374151]">
          <span class="font-medium">IVA 19%</span>
          <span>{{ formatoPesos(presupuesto.iva) }}</span>
        </div>

        <div class="flex justify-between items-center bg-[#1f3d64] text-[#ffffff] p-3 rounded mt-2">
          <span class="font-bold text-md">TOTAL</span>
          <span class="font-bold text-md">{{ formatoPesos(presupuesto.total_final) }}</span>
        </div>
      </div>
    </div>

    <div class="mt-16 text-center border-t border-[#e5e7eb] pt-4">
      <p class="text-[#9ca3af] text-[9px] uppercase tracking-wide">
        Gracias por su preferencia - ServiML
      </p>
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