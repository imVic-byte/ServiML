<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient.js';
import navbar from '@/components/componentes/navbar.vue';
import volver from '@/components/componentes/volver.vue';

const route = useRoute();
const router = useRouter();
const idFicha = route.params.id;

const cargandoDatos = ref(true);
const guardando = ref(false);

const fechaFichaBD = ref('');
const mesFichaMostrado = ref('');

const concepto = ref('');
const monto = ref('');
const categoria = ref('Administrativo');
const fechaEmision = ref('');
const categoriasDisponibles = ['Administrativo', 'Operacional'];

const listaGastos = ref([]);

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

    fechaFichaBD.value = cabecera.fecha;
    const fechaObj = new Date(cabecera.fecha + 'T00:00:00');
    mesFichaMostrado.value = fechaObj.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

    const { data: detalles, error: errorDetalles } = await supabase
      .from('detalle_gastos_fijos')
      .select('*')
      .eq('id_gastos_fijos', idFicha);

    if (errorDetalles) throw errorDetalles;

    listaGastos.value = detalles.map(d => ({
      id_temporal: d.id,
      descripcion: d.descripcion,
      monto: d.monto,
      categoria: d.categoria,
      fecha_emision: d.fecha_emision,
      comprobante: d.comprobante
    }));

  } catch (error) {
    console.error("Error al cargar para editar:", error.message);
    alert("Error al cargar la ficha.");
    router.push('/gastos');
  } finally {
    cargandoDatos.value = false;
  }
};

onMounted(() => {
  if (idFicha) cargarFicha();
});

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
    comprobante: null
  });

  concepto.value = '';
  monto.value = '';
  fechaEmision.value = '';
};

const eliminarGasto = (id_temporal) => {
  listaGastos.value = listaGastos.value.filter(g => g.id_temporal !== id_temporal);
};

const guardarCambios = async () => {
  if (listaGastos.value.length === 0) {
    alert('La ficha debe tener al menos un gasto. Si deseas eliminarla por completo, debes hacerlo desde otra vista.');
    return;
  }

  guardando.value = true;
  try {
    const { error: errorCabecera } = await supabase
      .from('gastos_fijos')
      .update({
        total_administrativo: totalAdministrativo.value,
        total_operacional: totalOperacional.value,
        total_general: totalGeneral.value
      })
      .eq('id', idFicha);

    if (errorCabecera) throw errorCabecera;

    const { error: errorBorrar } = await supabase
      .from('detalle_gastos_fijos')
      .delete()
      .eq('id_gastos_fijos', idFicha);

    if (errorBorrar) throw errorBorrar;

    const detallesAInsertar = listaGastos.value.map(g => ({
      descripcion: g.descripcion,
      monto: g.monto,
      categoria: g.categoria,
      fecha_emision: g.fecha_emision,
      comprobante: g.comprobante,
      id_gastos_fijos: idFicha
    }));

    const { error: errorInsertar } = await supabase
      .from('detalle_gastos_fijos')
      .insert(detallesAInsertar);

    if (errorInsertar) throw errorInsertar;

    alert('Cambios guardados exitosamente.');
    router.push(`/gastos/ver/${idFicha}`);

  } catch (error) {
    console.error("Error al actualizar la BD:", error.message);
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
          <button @click="router.push(`/gastos/ver/${idFicha}`)"
          class="mb-4 flex items-center gap-1 text-sm servi-grey-font hover:opacity-80 transition cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-2">
            <h1 class="text-xl md:text-3xl font-bold servi-grey-font border-l-4 border-yellow-500 pl-3 capitalize">
              Editando: {{ mesFichaMostrado }}
            </h1>
            <div class="flex gap-2 w-full md:w-auto">
              <button @click="router.push(`/gastos/ver/${idFicha}`)" class="flex-1 md:flex-none bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded shadow-sm hover:bg-slate-100 font-semibold text-sm">
                Cancelar
              </button>
              <button @click="guardarCambios" :disabled="guardando" class="flex-1 md:flex-none servi-blue text-white px-5 py-2 rounded shadow-md font-semibold text-sm disabled:opacity-50">
                {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            
            <div class="servi-adapt-bg rounded-lg shadow-sm overflow-hidden">
              <div class="servi-blue px-6 py-4 border-b-4 border-yellow-500">
                <h2 class="text-lg font-bold text-white">Agregar Gasto a la Ficha</h2>
              </div>
              
              <form @submit.prevent="agregarGasto" class="p-6 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="flex flex-col">
                    <label class="text-sm font-bold servi-grey-font mb-1">Concepto / Descripción *</label>
                    <input v-model="concepto" type="text" required class="border border-gray-100 rounded-md p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none servi-grey-font" placeholder="Ej. Materiales extra">
                  </div>
                  
                  <div class="flex flex-col">
                    <label class="text-sm font-bold servi-grey-font mb-1">Monto *</label>
                    <input v-model="monto" type="number" required min="1" class="border border-gray-100 rounded-md p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none servi-grey-font">
                  </div>
                  
                  <div class="flex flex-col">
                    <label class="text-sm font-bold servi-grey-font mb-1">Categoría *</label>
                    <select v-model="categoria" class="border border-gray-100 rounded-md p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none servi-grey-font">
                      <option v-for="cat in categoriasDisponibles" :key="cat" :value="cat">{{ cat }}</option>
                    </select>
                  </div>
                  
                  <div class="flex flex-col">
                    <label class="text-sm font-bold servi-grey-font mb-1">Fecha de Emisión *</label>
                    <input v-model="fechaEmision" type="date" required class="border border-gray-100 rounded-md p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none servi-grey-font">
                  </div>
                </div>

                <div class="flex justify-end pt-2">
                  <button type="submit" class="bg-yellow-500 text-slate-900 px-6 py-2 rounded-md font-bold shadow-sm hover:bg-yellow-400 transition-colors">
                    Añadir a la lista
                  </button>
                </div>
              </form>
            </div>

            <div class="servi-adapt-bg rounded-lg shadow-sm">
              <div class="border-yellow-500 border-b-4 px-4 md:px-6 py-3 md:py-4 rounded-t-lg servi-blue flex justify-between items-center text-white">
                <h2 class="text-base md:text-lg font-bold">Gastos Registrados</h2>
                <span class="text-xs md:text-sm font-semibold">{{ listaGastos.length }} ítems</span>
              </div>
              
              <div v-if="listaGastos.length === 0" class="p-6 text-center text-gray-500 font-medium">
                La ficha está vacía.
              </div>

              <div v-else class="hidden md:block overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-bold servi-grey-font uppercase">Concepto</th>
                      <th class="px-6 py-3 text-left text-xs font-bold servi-grey-font uppercase">Categoría</th>
                      <th class="px-6 py-3 text-right text-xs font-bold servi-grey-font uppercase">Monto</th>
                      <th class="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="gasto in listaGastos" :key="gasto.id_temporal" class="border-t border-gray-100 hover:bg-slate-50">
                      <td class="px-6 py-4 text-sm servi-grey-font font-medium">{{ gasto.descripcion }}</td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold border border-slate-200">{{ gasto.categoria }}</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm servi-grey-font font-bold text-right">{{ formatearDinero(gasto.monto) }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button @click="eliminarGasto(gasto.id_temporal)" class="text-red-500 hover:text-red-700 font-bold bg-red-50 px-3 py-1 rounded">Quitar</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="lg:col-span-1 order-first lg:order-none">
            <div class="servi-adapt-bg rounded-lg shadow-lg border-t-4 border-yellow-500 p-4 md:p-6 lg:sticky lg:top-6">
              <h2 class="text-lg md:text-xl font-bold mb-4 md:mb-6 servi-grey-font">Nuevos Totales</h2>
              
              <div class="space-y-3 md:space-y-4 mb-6 md:mb-8">
                <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span class="servi-grey-font text-sm">Total Administrativo</span>
                  <span class="font-bold servi-grey-font">{{ formatearDinero(totalAdministrativo) }}</span>
                </div>
                <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span class="servi-grey-font text-sm">Total Operacional</span>
                  <span class="font-bold servi-grey-font">{{ formatearDinero(totalOperacional) }}</span>
                </div>
              </div>

              <div class="servi-blue p-3 md:p-4 rounded-lg flex justify-between items-center mb-4 md:mb-6">
                <span class="text-xs md:text-sm font-bold text-yellow-500 uppercase tracking-wider">Total General</span>
                <span class="text-xl md:text-2xl font-bold text-white">{{ formatearDinero(totalGeneral) }}</span>
              </div>
              
              <p class="text-xs text-yellow-600 bg-yellow-50 p-2 rounded text-center mt-3 md:mt-4 font-semibold">
                * Los cambios no se aplicarán hasta que presiones "Guardar Cambios".
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </div>
</template>