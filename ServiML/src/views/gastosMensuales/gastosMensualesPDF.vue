<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';

const props = defineProps({
  ficha: {
    type: Object,
    required: true
  },
  detalles: {
    type: Array,
    required: true
  }
});

const formatoPesos = (valor) => {
  if (valor === undefined || valor === null) return '$0';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
};

const formatearMes = (fechaString) => {
  if (!fechaString) return '';
  const fecha = new Date(fechaString + 'T00:00:00');
  const opciones = { month: 'long', year: 'numeric' };
  const formato = fecha.toLocaleDateString('es-CL', opciones);
  return formato.charAt(0).toUpperCase() + formato.slice(1);
};

const formatearFechaNormal = (fechaString) => {
  if (!fechaString) return '';
  const fecha = new Date(fechaString + 'T00:00:00');
  return fecha.toLocaleDateString('es-CL');
};

const datosEmpresa = ref({})

const traerDatosEmpresa = async () => {
  const {data, error} = await supabase.from('serviml').select('*').eq('id', 1).single()
  if (data) datosEmpresa.value = data
}

const traerEmail = async () => {
  const {data, error} = await supabase.from('serviml_email').select('*').eq('id_serviml', 1).eq('prioritario',true).single()
  if (data) datosEmpresa.value.email = data.email
}

const traerTelefono = async () => {
  const {data,error} = await supabase.from('serviml_telefono').select('*').eq('id_serviml', 1).eq('prioritario',true).maybeSingle()
  if (data) datosEmpresa.value.telefono = data.telefono || ''
}

onMounted(async () => {
  await traerDatosEmpresa()
  await traerEmail()
  await traerTelefono()
})
</script>

<template>
  <div 
    id="reporte-gastos-imprimir" 
    class="bg-[#ffffff] text-[#000000] p-10 max-w-[21cm] min-h-[27.9cm] mx-auto text-xs font-sans leading-normal relative"
    style="background-color: #ffffff;"
  >
    
    <div class="flex justify-between border-b-4 border-[#1f3d64] pb-4 mb-6">
      <div class="flex items-center gap-4">
        <span class="w-24 h-24 rounded-full overflow-hidden border border-[#e5e7eb]">
            <img class="w-full h-full object-cover" src="../../img/Logo.jpg" alt="Logo ServiML">
        </span>
        <div>
            <h1 class="text-2xl font-black text-[#1f3d64] tracking-tighter italic">SERVIML</h1>
            <p class="text-[#4b5563] font-bold uppercase text-[11px] tracking-widest mt-1">Servicios Mecánicos</p>
        </div>
      </div>

      <div class="text-right">
        <h2 class="text-lg font-bold text-[#1f3d64]">REPORTE DE GASTOS</h2>
        <p class="text-md font-mono text-[#dc2626] font-bold">N° {{ ficha.id || '---' }}</p>
        <p class="text-[#6b7280] mt-1 text-[11px] font-bold capitalize">Mes Operacional: {{ formatearMes(ficha.fecha) }}</p>
      </div>
    </div>

    <div class="mb-8">
      <h3 class="font-bold text-[#1f3d64] border-b border-[#cbd5e1] mb-2 pb-1 text-[11px] uppercase">Datos de la Empresa</h3>
      <ul class="text-[#374151] space-y-1 flex flex-wrap gap-x-8 gap-y-2">
        <li><span class="font-bold text-[#111827]">Razón Social:</span> {{ datosEmpresa.razon_social || 'ServiML' }}</li>
        <li><span class="font-bold text-[#111827]">RUT:</span> {{ datosEmpresa.rut || '---' }}</li>
        <li><span class="font-bold text-[#111827]">Dirección:</span> {{ datosEmpresa.dirección || '---' }}, {{ datosEmpresa.ciudad }}</li>
        <li><span class="font-bold text-[#111827]">Teléfono:</span> {{ datosEmpresa.telefono || 'Sin Teléfono' }}</li>
        <li><span class="font-bold text-[#111827]">Email:</span> {{ datosEmpresa.email || '---' }}</li>
      </ul>
    </div>

    <div class="mb-8 border border-[#e5e7eb] rounded-lg overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-[#1f3d64] text-[#ffffff] text-[10px] uppercase tracking-wider">
            <th class="p-3 font-semibold w-24">Fecha</th>
            <th class="p-3 font-semibold">Descripción del Gasto</th>
            <th class="p-3 text-center w-32">Categoría</th>
            <th class="p-3 text-right w-32">Monto</th>
          </tr>
        </thead>
        <tbody class="text-[#1f2937] text-[11px]">
          <tr 
            v-for="(item, index) in detalles" 
            :key="index"
            class="bg-[#ffffff] border-b border-[#e5e7eb]"
          >
            <td class="p-3">{{ formatearFechaNormal(item.fecha_emision) }}</td>
            <td class="p-3 font-medium text-[#1f3d64]">{{ item.descripcion }}</td>
            <td class="p-3 text-center">
              <span class="bg-[#f3f4f6] px-2 py-1 rounded text-[10px] font-bold border border-[#e5e7eb]">{{ item.categoria }}</span>
            </td>
            <td class="p-3 text-right font-bold">{{ formatoPesos(item.monto) }}</td>
          </tr>
          <tr v-if="!detalles || detalles.length === 0">
            <td colspan="4" class="p-4 text-center text-[#6b7280] italic">No hay gastos registrados en este mes.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex justify-end mt-4">
      <div class="w-2/5 border border-[#e5e7eb] rounded-lg p-4 bg-[#f8fafc]">
        <h4 class="font-bold text-[#1f3d64] uppercase text-[10px] mb-3 border-b border-[#cbd5e1] pb-1">Resumen Financiero</h4>
        
        <div class="flex justify-between items-center py-1 text-[#374151]">
          <span class="font-medium">T. Administrativo</span>
          <span>{{ formatoPesos(ficha.total_administrativo) }}</span>
        </div>
        
        <div class="flex justify-between items-center py-1 border-b border-[#e5e7eb] text-[#374151]">
          <span class="font-medium">T. Operacional</span>
          <span>{{ formatoPesos(ficha.total_operacional) }}</span>
        </div>

        <div class="flex justify-between items-center bg-[#1f3d64] text-[#ffffff] p-3 rounded mt-3">
          <span class="font-bold text-sm">TOTAL MES</span>
          <span class="font-bold text-sm">{{ formatoPesos(ficha.total_general) }}</span>
        </div>
      </div>
    </div>

    <div class="absolute bottom-10 left-0 right-0 text-center border-t border-[#e5e7eb] pt-4 mx-10">
      <p class="text-[#9ca3af] text-[9px] uppercase tracking-wide">
        Documento Generado Internamente - ServiML
      </p>
    </div>

  </div>
</template>

<style scoped>
#reporte-gastos-imprimir {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}
</style>