<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient.js';
import navbar from '@/components/componentes/navbar.vue';
import volver from '@/components/componentes/volver.vue';

const router = useRouter();

const concepto = ref('');
const monto = ref('');
const categoria = ref('Administrativo');
const fechaEmision = ref('');
const categoriasDisponibles = ['Administrativo', 'Operacional'];

const listaGastos = ref([]); 
const cargando = ref(false);

const fechaHoy = new Date();
const mesFichaBD = fechaHoy.toISOString().split('T')[0];
const mesFichaMostrado = fechaHoy.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

const archivoFisico = ref(null);
const previewUrl = ref(null);
const tipoArchivo = ref(null);

const activarInputComprobante = (tipo) => {
  const id = tipo === 'camara' ? 'input-camara-comprobante' : 'input-galeria-comprobante';
  document.getElementById(id).click();
};

const procesarComprobante = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("El archivo es muy pesado. Máximo 5MB.");
    event.target.value = '';
    return;
  }

  archivoFisico.value = file;
  previewUrl.value = URL.createObjectURL(file);
  tipoArchivo.value = file.type.startsWith('image/') ? 'imagen' : 'pdf';
  event.target.value = '';
};

const removerComprobante = () => {
  archivoFisico.value = null;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null;
  tipoArchivo.value = null;
};

const agregarGasto = () => {
  if (!concepto.value || !monto.value || !fechaEmision.value) {
    alert('Por favor, completa Concepto, Monto y Fecha.');
    return;
  }

  listaGastos.value.push({
    id_temporal: Date.now(),
    descripcion: concepto.value,
    monto: Number(monto.value),
    categoria: categoria.value,
    fecha_emision: fechaEmision.value,
    archivoRaw: archivoFisico.value, 
    previewUrl: previewUrl.value,
    tipoArchivo: tipoArchivo.value,
    comprobante: null 
  });

  concepto.value = '';
  monto.value = '';
  fechaEmision.value = '';
  archivoFisico.value = null;
  previewUrl.value = null;
  tipoArchivo.value = null;
};

const eliminarGasto = (id_temporal) => {
  listaGastos.value = listaGastos.value.filter(g => g.id_temporal !== id_temporal);
};

const totalAdministrativo = computed(() => {
  return listaGastos.value.filter(g => g.categoria === 'Administrativo').reduce((acc, g) => acc + g.monto, 0);
});

const totalOperacional = computed(() => {
  return listaGastos.value.filter(g => g.categoria === 'Operacional').reduce((acc, g) => acc + g.monto, 0);
});

const totalGeneral = computed(() => totalAdministrativo.value + totalOperacional.value);

const formatearDinero = (valor) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor || 0);
};

const cerrarMes = async () => {
  if (listaGastos.value.length === 0) {
    alert('Debes agregar al menos un gasto para registrar el mes.');
    return;
  }

  cargando.value = true;
  try {
    // 1. Insertar la cabecera en BD
    const { data: cabeceraData, error: cabeceraError } = await supabase
      .from('gastos_fijos')
      .insert([{
        fecha: mesFichaBD,
        total_administrativo: totalAdministrativo.value,
        total_operacional: totalOperacional.value,
        total_general: totalGeneral.value,
        estado: 1
      }])
      .select('id')
      .single();

    if (cabeceraError) throw cabeceraError;
    const idGastosFijos = cabeceraData.id;

    // 2. Subir las fotos usando el Worker Universal de tu compañero
    const WORKER_URL = 'https://upload.soporte-serviml.workers.dev/';
    const detallesAInsertar = [];

    for (const g of listaGastos.value) {
      let urlComprobante = null;

      if (g.archivoRaw) {
        try {
          const archivoReal = g.archivoRaw;
          const nombreLimpio = archivoReal.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          
          // Creamos un nombre único para que no choque con las OT
          const nombreUnico = `GASTO-${idGastosFijos}-${Date.now()}-${nombreLimpio}`;
          
          const formData = new FormData();
          formData.append('file', archivoReal, nombreUnico);
          // Le pasamos un folio inventado porque el worker de él parece pedirlo
          formData.append('numero_folio', `GASTOS-${mesFichaBD}`); 

          const resWorker = await fetch(WORKER_URL, { 
            method: 'POST', 
            body: formData 
          });

          if (!resWorker.ok) throw new Error("Worker rechazó la imagen");
          
          const data = await resWorker.json();
          urlComprobante = data.url; // ¡El worker nos da el link directo!

        } catch (uploadError) {
          console.error("Error subiendo foto:", uploadError);
          throw new Error(`Fallo al subir el comprobante de: ${g.descripcion}`);
        }
      }

      // Preparamos la fila del detalle
      detallesAInsertar.push({
        descripcion: g.descripcion,
        monto: g.monto,
        categoria: g.categoria,
        fecha_emision: g.fecha_emision,
        comprobante: urlComprobante, 
        id_gastos_fijos: idGastosFijos
      });
    }

    // 3. Insertar detalle completo en BD
    const { error: detalleError } = await supabase
      .from('detalle_gastos_fijos')
      .insert(detallesAInsertar);

    if (detalleError) throw detalleError;

    alert('Ficha y comprobantes guardados exitosamente.');
    router.push('/gastos');

  } catch (error) {
    console.error("Error general:", error.message);
    alert(`Hubo un error al guardar: \n${error.message}`);
  } finally {
    cargando.value = false;
  }
};


</script>

<template>
  <div class="min-h-screen servi-white font-sans">
    <navbar titulo="ServiML" :subtitulo="'Crear ficha de gastos fijos'" class="navbar"></navbar>
    <div class="max-w-7xl mx-auto pt-5 pb-30 px-4 md:px-8">
      
      <div class="mb-6">
        <volver></volver>
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-2">
          <h1 class="text-xl md:text-3xl font-bold servi-grey-font border-l-4 border-yellow-500 pl-3 capitalize">
            Ficha de Gastos: {{ mesFichaMostrado }}
          </h1>
          <div class="flex gap-2 w-full md:w-auto">
            <button @click="cerrarMes" :disabled="cargando" class="flex-1 md:flex-none servi-blue text-white px-5 py-2 rounded shadow-md font-semibold text-sm disabled:opacity-50">
              {{ cargando ? 'Guardando...' : 'Cerrar Mes' }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          
          <div class="servi-adapt-bg rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <div class="servi-blue px-6 py-4 flex justify-between items-center">
              <h2 class="text-lg font-bold text-white tracking-wide">Registrar Nuevo Gasto</h2>
            </div>
            
            <form @submit.prevent="agregarGasto" class="p-6 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Concepto / Descripción *</label>
                  <input v-model="concepto" type="text" required class="w-full servi-adapt-bg border border-gray-100 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium text-sm" placeholder="Ej. Pago de internet">
                </div>
                
                <div class="flex flex-col">
                  <label class="text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Monto *</label>
                  <input v-model="monto" type="number" required min="1" class="w-full servi-adapt-bg border border-gray-100 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium text-sm" placeholder="0">
                </div>
                
                <div class="flex flex-col">
                  <label class="text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Categoría *</label>
                  <select v-model="categoria" class="w-full servi-adapt-bg border border-gray-100 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium text-sm">
                    <option v-for="cat in categoriasDisponibles" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>
                
                <div class="flex flex-col">
                  <label class="text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Fecha de Emisión *</label>
                  <input v-model="fechaEmision" type="date" required class="w-full servi-adapt-bg border border-gray-100 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium text-sm">
                </div>

                <div class="col-span-1 md:col-span-2 flex flex-col mt-2">
                  <label class="text-xs font-bold servi-grey-font uppercase tracking-wider mb-2">Comprobante (Opcional)</label>

                  <div v-if="!archivoFisico" class="flex gap-3">
                    <input type="file" id="input-camara-comprobante" class="hidden" accept="image/*" capture="environment" @change="procesarComprobante" />
                    <input type="file" id="input-galeria-comprobante" class="hidden" accept="image/*, application/pdf" @change="procesarComprobante" />

                    <button type="button" @click="activarInputComprobante('camara')" class="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-lg transition-colors border border-blue-200 cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Cámara
                    </button>

                    <button type="button" @click="activarInputComprobante('galeria')" class="flex items-center gap-2 text-sm font-bold servi-grey-font servi-adapt-bg hover:opacity-80 px-4 py-2.5 rounded-lg transition-colors border border-gray-100 shadow-sm cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Galería / PDF
                    </button>
                  </div>

                  <div v-else class="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                    <img v-if="tipoArchivo === 'imagen'" :src="previewUrl" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span class="text-[10px] text-gray-500 truncate px-1 w-full text-center">{{ archivoFisico.name }}</span>
                    </div>
                    <button type="button" @click="removerComprobante" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" title="Quitar archivo">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex justify-end pt-2">
                <button type="submit" class="bg-yellow-500 text-slate-900 px-6 py-2.5 rounded-lg font-bold shadow-sm hover:bg-yellow-400 transition-colors">
                  Agregar a la Ficha
                </button>
              </div>
            </form>
          </div>

          <div class="servi-adapt-bg rounded-lg shadow-sm border border-gray-100">
            <div class="border-yellow-500 border-b-4 px-4 md:px-6 py-3 md:py-4 rounded-t-lg servi-blue flex justify-between items-center text-white">
              <h2 class="text-base md:text-lg font-bold uppercase tracking-wide">Gastos Ingresados</h2>
              <span class="text-xs md:text-sm font-semibold">{{ listaGastos.length }} ítems</span>
            </div>
            
            <div v-if="listaGastos.length === 0" class="p-6 text-center text-gray-500 font-medium">
              No has agregado ningún gasto a esta ficha.
            </div>

            <div v-else class="md:hidden p-3 space-y-3">
              <div v-for="gasto in listaGastos" :key="gasto.id_temporal" class="p-3 rounded-lg border border-gray-100">
                <div class="flex justify-between items-start mb-2">
                  <div class="flex gap-3 items-center">
                    <img v-if="gasto.tipoArchivo === 'imagen'" :src="gasto.previewUrl" class="w-10 h-10 rounded object-cover border" />
                    <div v-else-if="gasto.tipoArchivo === 'pdf'" class="w-10 h-10 rounded bg-gray-50 border flex items-center justify-center text-red-500">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p class="font-bold servi-grey-font text-sm">{{ gasto.descripcion }}</p>
                      <p class="text-xs servi-grey-font mt-0.5">{{ gasto.fecha_emision }}</p>
                    </div>
                  </div>
                  <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">{{ gasto.categoria }}</span>
                </div>
                <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                  <span class="font-bold text-blue-600">{{ formatearDinero(gasto.monto) }}</span>
                  <button @click="eliminarGasto(gasto.id_temporal)" class="text-red-500 hover:text-red-700 font-bold text-sm">Eliminar</button>
                </div>
              </div>
            </div>

            <div v-if="listaGastos.length > 0" class="hidden md:block overflow-x-auto">
              <table class="min-w-full">
                <thead>
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-bold servi-grey-font uppercase bg-slate-50">Concepto</th>
                    <th class="px-6 py-3 text-left text-xs font-bold servi-grey-font uppercase bg-slate-50">Fecha</th>
                    <th class="px-6 py-3 text-left text-xs font-bold servi-grey-font uppercase bg-slate-50">Categoría</th>
                    <th class="px-6 py-3 text-right text-xs font-bold servi-grey-font uppercase bg-slate-50">Monto</th>
                    <th class="px-6 py-3 bg-slate-50"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="gasto in listaGastos" :key="gasto.id_temporal" class="border-t border-gray-100 hover:bg-slate-50">
                    <td class="px-6 py-4 text-sm servi-grey-font font-medium flex items-center gap-3">
                      <img v-if="gasto.tipoArchivo === 'imagen'" :src="gasto.previewUrl" class="w-8 h-8 rounded object-cover border" />
                      <div v-else-if="gasto.tipoArchivo === 'pdf'" class="w-8 h-8 rounded bg-gray-100 border flex items-center justify-center text-red-500" title="Archivo PDF">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      </div>
                      <div v-else class="w-8 h-8 rounded bg-gray-50 border border-dashed flex items-center justify-center text-gray-300" title="Sin comprobante">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      {{ gasto.descripcion }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm servi-grey-font">{{ gasto.fecha_emision }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold border border-slate-200">{{ gasto.categoria }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold text-right">{{ formatearDinero(gasto.monto) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button @click="eliminarGasto(gasto.id_temporal)" class="text-red-500 hover:text-red-700 font-bold bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors">Quitar</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        <div class="lg:col-span-1 order-first lg:order-none">
          <div class="servi-adapt-bg rounded-xl shadow-lg border-t-4 border-yellow-500 p-4 md:p-6 lg:sticky lg:top-6">
            <h2 class="text-lg md:text-xl font-bold mb-4 md:mb-6 servi-grey-font uppercase tracking-wide">Resumen del Mes</h2>
            
            <div class="space-y-3 md:space-y-4 mb-6 md:mb-8">
              <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                <span class="servi-grey-font text-sm font-medium">Total Administrativo</span>
                <span class="font-bold servi-grey-font">{{ formatearDinero(totalAdministrativo) }}</span>
              </div>
              <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                <span class="servi-grey-font text-sm font-medium">Total Operacional</span>
                <span class="font-bold servi-grey-font">{{ formatearDinero(totalOperacional) }}</span>
              </div>
            </div>

            <div class="servi-blue p-3 md:p-4 rounded-xl flex justify-between items-center mb-4 md:mb-6 shadow-md">
              <span class="text-xs md:text-sm font-bold text-yellow-500 uppercase tracking-wider">Total General</span>
              <span class="text-xl md:text-2xl font-bold text-white">{{ formatearDinero(totalGeneral) }}</span>
            </div>
            
            <p class="text-xs servi-grey-font text-center mt-3 md:mt-4 opacity-70">Estado actual: Pendiente de Revisión</p>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>