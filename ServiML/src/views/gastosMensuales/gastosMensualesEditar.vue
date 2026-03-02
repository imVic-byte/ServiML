<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient.js';
import navbar from '@/components/componentes/navbar.vue';
import volver from '@/components/componentes/volver.vue';

const route = useRoute();
const router = useRouter();
const idFicha = route.params.id;

// --- ESTADOS ---
const cargandoDatos = ref(true);
const guardando = ref(false);
const mesFichaBD = ref(''); 
const mesFichaMostrado = ref('');

// Formulario de nuevo gasto
const concepto = ref('');
const monto = ref('');
const categoria = ref('Administrativo');
const fechaEmision = ref('');
const categoriasDisponibles = ['Administrativo', 'Operacional'];

// Subida de Archivos en el formulario
const archivoFisico = ref(null);
const previewUrl = ref(null);
const tipoArchivo = ref(null);

const listaGastos = ref([]);

// --- CARGAR DATOS EXISTENTES ---
const cargarFicha = async () => {
  cargandoDatos.value = true;
  try {
    const { data: cabecera, error: errorCabecera } = await supabase
      .from('gastos_fijos')
      .select('*')
      .eq('id', idFicha)
      .single();

    if (errorCabecera) throw errorCabecera;

    if (cabecera.estado !== 1) {
      alert("Esta ficha ya está cerrada y no se puede editar.");
      router.push(`/gastos/ver/${idFicha}`);
      return;
    }

    mesFichaBD.value = cabecera.fecha;
    const fechaObj = new Date(cabecera.fecha + 'T00:00:00');
    mesFichaMostrado.value = fechaObj.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

    const { data: detalles, error: errorDetalles } = await supabase
      .from('detalle_gastos_fijos')
      .select('*')
      .eq('id_gastos_fijos', idFicha);

    if (errorDetalles) throw errorDetalles;

    // Pasamos los detalles a nuestra lista reactiva, manteniendo sus URLs si las tienen
    listaGastos.value = detalles.map(d => {
      let tipoDetectado = null;
      if (d.comprobante) {
        tipoDetectado = d.comprobante.toLowerCase().includes('.pdf') ? 'pdf' : 'imagen';
      }

      return {
        id_temporal: d.id, 
        descripcion: d.descripcion,
        monto: d.monto,
        categoria: d.categoria,
        fecha_emision: d.fecha_emision,
        comprobante: d.comprobante, // URL que viene de BD
        archivoRaw: null, // Porque no hay archivo nuevo que subir para este ítem
        previewUrl: d.comprobante, // Usamos la URL real como vista previa en la tabla
        tipoArchivo: tipoDetectado
      };
    });

  } catch (error) {
    console.error("Error al cargar:", error.message);
    router.push('/gastos');
  } finally {
    cargandoDatos.value = false;
  }
};

onMounted(() => {
  if (idFicha) cargarFicha();
});

// --- LÓGICA DE ARCHIVOS PARA EL FORMULARIO ---
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

// --- LÓGICA DE AGREGAR/ELIMINAR EN TABLA LOCAL ---
const agregarGasto = () => {
  if (!concepto.value || !monto.value || !fechaEmision.value) return;

  listaGastos.value.push({
    id_temporal: Date.now(),
    descripcion: concepto.value,
    monto: Number(monto.value),
    categoria: categoria.value,
    fecha_emision: fechaEmision.value,
    archivoRaw: archivoFisico.value, 
    previewUrl: previewUrl.value,
    tipoArchivo: tipoArchivo.value,
    comprobante: null // Al guardarse, se llenará con la URL de Cloudflare
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

// --- CÁLCULOS ---
const totalAdministrativo = computed(() => listaGastos.value.filter(g => g.categoria === 'Administrativo').reduce((acc, g) => acc + g.monto, 0));
const totalOperacional = computed(() => listaGastos.value.filter(g => g.categoria === 'Operacional').reduce((acc, g) => acc + g.monto, 0));
const totalGeneral = computed(() => totalAdministrativo.value + totalOperacional.value);
const formatearDinero = (valor) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor || 0);

// --- GUARDAR CAMBIOS EN BASE DE DATOS ---
const guardarCambios = async () => {
  if (listaGastos.value.length === 0) {
    alert('La ficha debe tener al menos un gasto.');
    return;
  }

  guardando.value = true;
  try {
    // 1. Actualizar los totales
    const { error: errorCabecera } = await supabase
      .from('gastos_fijos')
      .update({
        total_administrativo: totalAdministrativo.value,
        total_operacional: totalOperacional.value,
        total_general: totalGeneral.value
      })
      .eq('id', idFicha);

    if (errorCabecera) throw errorCabecera;

    // 2. Subir SOLO las fotos nuevas usando Worker Universal
    const WORKER_URL = 'https://upload.soporte-serviml.workers.dev/';
    const detallesAInsertar = [];

    for (const g of listaGastos.value) {
      let urlFinal = g.comprobante; // Si ya tenía foto, se mantiene. Si no tenía, es null.

      // Si g.archivoRaw existe, significa que es un gasto NUEVO que le subimos foto
      if (g.archivoRaw) {
        try {
          const archivoReal = g.archivoRaw;
          const nombreLimpio = archivoReal.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const nombreUnico = `GASTO-${idFicha}-${Date.now()}-${nombreLimpio}`;
          
          const formData = new FormData();
          formData.append('file', archivoReal, nombreUnico);
          formData.append('numero_folio', `GASTOS-EDIT`); 

          const resWorker = await fetch(WORKER_URL, { method: 'POST', body: formData });
          if (!resWorker.ok) throw new Error("Worker rechazó la imagen");
          
          const data = await resWorker.json();
          urlFinal = data.url; // Pisamos urlFinal con la nueva URL

        } catch (uploadError) {
          console.error("Error subiendo foto nueva:", uploadError);
          throw new Error(`Fallo al subir comprobante de: ${g.descripcion}`);
        }
      }

      detallesAInsertar.push({
        descripcion: g.descripcion,
        monto: g.monto,
        categoria: g.categoria,
        fecha_emision: g.fecha_emision,
        comprobante: urlFinal, 
        id_gastos_fijos: idFicha
      });
    }

    // 3. Borramos los detalles viejos y metemos la lista actualizada
    await supabase.from('detalle_gastos_fijos').delete().eq('id_gastos_fijos', idFicha);

    const { error: errorInsertar } = await supabase
      .from('detalle_gastos_fijos')
      .insert(detallesAInsertar);

    if (errorInsertar) throw errorInsertar;

    alert('Cambios guardados exitosamente.');
    router.push(`/gastos/ver/${idFicha}`);

  } catch (error) {
    console.error("Error BD:", error.message);
    alert('Hubo un error al guardar los cambios.');
  } finally {
    guardando.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen servi-white font-sans">
    <navbar titulo="ServiML" :subtitulo="'Editar Ficha de Gastos'" class="navbar"></navbar>
    <div class="max-w-7xl mx-auto pt-5 pb-30 px-4 md:px-8">
      
      <div v-if="cargandoDatos" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
      </div>

      <div v-else>
        <div class="mb-6">
          <button @click="router.push(`/gastos/ver/${idFicha}`)" class="mb-4 flex items-center gap-1 text-sm servi-grey-font hover:opacity-80 transition cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Volver a la ficha
          </button>

          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-2">
            <h1 class="text-xl md:text-3xl font-bold servi-grey-font border-l-4 border-yellow-500 pl-3 capitalize">
              Editando: {{ mesFichaMostrado }}
            </h1>
            <div class="flex gap-2 w-full md:w-auto">
              <button @click="guardarCambios" :disabled="guardando" class="flex-1 md:flex-none servi-blue text-white px-6 py-2.5 rounded-lg shadow-md font-bold text-sm disabled:opacity-50">
                {{ guardando ? 'Guardando cambios...' : 'Guardar Ficha Editada' }}
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            
            <div class="servi-adapt-bg rounded-lg shadow-sm overflow-hidden border border-gray-100">
              <div class="servi-blue px-6 py-4 flex justify-between items-center">
                <h2 class="text-lg font-bold text-white tracking-wide">Agregar Nuevo Gasto</h2>
              </div>
              
              <form @submit.prevent="agregarGasto" class="p-6 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="flex flex-col">
                    <label class="text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Concepto / Descripción *</label>
                    <input v-model="concepto" type="text" required class="w-full servi-adapt-bg border border-gray-100 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium text-sm" placeholder="Ej. Materiales extra">
                  </div>
                  
                  <div class="flex flex-col">
                    <label class="text-xs font-bold servi-grey-font uppercase tracking-wider mb-1">Monto *</label>
                    <input v-model="monto" type="number" required min="1" class="w-full servi-adapt-bg border border-gray-100 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium text-sm">
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
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Cámara
                      </button>

                      <button type="button" @click="activarInputComprobante('galeria')" class="flex items-center gap-2 text-sm font-bold servi-grey-font servi-adapt-bg hover:opacity-80 px-4 py-2.5 rounded-lg transition-colors border border-gray-100 shadow-sm cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Galería / PDF
                      </button>
                    </div>

                    <div v-else class="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                      <img v-if="tipoArchivo === 'imagen'" :src="previewUrl" class="w-full h-full object-cover" />
                      <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        <span class="text-[10px] text-gray-500 truncate px-1 w-full text-center">{{ archivoFisico.name }}</span>
                      </div>
                      <button type="button" @click="removerComprobante" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" title="Quitar archivo">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end pt-2">
                  <button type="submit" class="bg-yellow-500 text-slate-900 px-6 py-2.5 rounded-lg font-bold shadow-sm hover:bg-yellow-400 transition-colors">
                    Añadir a la lista
                  </button>
                </div>
              </form>
            </div>

            <div class="servi-adapt-bg rounded-lg shadow-sm border border-gray-100">
              <div class="border-yellow-500 border-b-4 px-4 md:px-6 py-3 md:py-4 rounded-t-lg servi-blue flex justify-between items-center text-white">
                <h2 class="text-base md:text-lg font-bold uppercase tracking-wide">Gastos Registrados</h2>
                <span class="text-xs md:text-sm font-semibold">{{ listaGastos.length }} ítems</span>
              </div>
              
              <div v-if="listaGastos.length === 0" class="p-6 text-center text-gray-500 font-medium">
                La ficha está vacía.
              </div>

              <div v-else class="hidden md:block overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-bold servi-grey-font uppercase bg-slate-50">Concepto</th>
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
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold border border-slate-200">{{ gasto.categoria }}</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold text-right">{{ formatearDinero(gasto.monto) }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button @click="eliminarGasto(gasto.id_temporal)" class="text-red-500 hover:text-red-700 font-bold bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors cursor-pointer">Quitar</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="lg:col-span-1 order-first lg:order-none">
            <div class="servi-adapt-bg rounded-xl shadow-lg border-t-4 border-yellow-500 p-4 md:p-6 lg:sticky lg:top-6">
              <h2 class="text-lg md:text-xl font-bold mb-4 md:mb-6 servi-grey-font uppercase tracking-wide">Nuevos Totales</h2>
              
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
              
              <p class="text-xs text-yellow-600 bg-yellow-50 p-3 rounded-lg text-center mt-3 font-semibold border border-yellow-100">
                * Los cambios no se aplicarán hasta que presiones "Guardar Ficha Editada".
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </div>
</template>