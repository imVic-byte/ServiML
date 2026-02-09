<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../../lib/supabaseClient.js";
import { useRoute, useRouter } from "vue-router";
import navbar from "../../components/componentes/navbar.vue";
import { useInterfaz } from "@/stores/interfaz.js";
import subirFotos from "../../components/componentes/subir-fotos.vue";
import modal from "../../components/componentes/modal.vue";
import medidorCombustible from "../../components/ordenTrabajo/medidorCombustible.vue";

const hoy = new Date()
  .toLocaleString('sv-SE') // YYYY-MM-DD HH:mm:ss
  .replace('T', ' ');

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '';

  const fecha = new Date(fechaStr.replace(' ', 'T'));
  if (isNaN(fecha)) return 'Fecha inválida';

  return fecha.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const isCerrado = ref(false);
const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true });
const redirigir = () => {
  modalState.value.visible = false;
};
const interfaz = useInterfaz();
const route = useRoute();
const router = useRouter();
const orden = ref({});
const loading = ref(true);
const listaFotos = ref([]);
const estados = ref([]);
const showModal = ref(false);
const showSecondModal = ref(false); 
const showThirdModal = ref(false);
const selectedEstado = ref(null);
const observaciones = ref([]);
const fechaIngreso = ref(null);
const nivelCombustible = ref(0);



const redirigirInformeFinal = () => {
  router.push({ name: 'ver-informe-final', params: { id: orden.value.id } });
};

const manejarBloqueo = (estado) => {
  loading.value = estado;
};

const verificarEstadoCerrado = () => {
  if (isCerrado.value) {
    modalState.value = {
      visible: true,
      titulo: "Acción no permitida",
      mensaje: "No se pueden realizar cambios en una orden de trabajo cerrada.",
      exito: false,
    };
    return true;
  }
}

const agregarObservacion = () => {
  if (verificarEstadoCerrado()) return;
  observaciones.value.push({
    id: Date.now(),
    texto: "",
    fecha: new Date().toISOString(),
    isNew: true,
  });
};

const eliminarObservacion = (index) => {
  if (verificarEstadoCerrado()) return;
  observaciones.value.splice(index, 1);
};

const guardarCambios = async () => {
  if (verificarEstadoCerrado()) return;
  manejarBloqueo(true);
  const { error } = await supabase
    .from("orden_trabajo")
    .update({
      kilometraje_inicial: orden.value.kilometraje_inicial,
      combustible_inicial: orden.value.combustible_inicial,
      fecha_ingreso: orden.value.fecha_ingreso,
      fecha_promesa: orden.value.fecha_promesa,
      prioridad: orden.value.prioridad,
      tipo_trabajo: orden.value.tipo_trabajo,
      motivo_ingreso: orden.value.motivo_ingreso,
    })
    .eq("id", route.params.id);
    for (const obs of observaciones.value) {
      if (obs.isNew) {
        const { error: obsError } = await supabase.from("OT_bitacora").insert({
          ot_id: route.params.id,
          tipo_evento: "observacion",
          observacion: obs.texto,
        });
        if (obsError) {
          console.error(obsError);
        }
      }
    }
  modalState.value = {
    visible: true,
    titulo: error ? "Error" : "¡Éxito!",
    mensaje: error
      ? "Hubo un error al guardar los cambios."
      : "Los cambios se han guardado correctamente.",
    exito: !error,
  };
  manejarBloqueo(false);
};

const traerObservaciones = async () => {
  const { data } = await supabase
    .from("OT_bitacora")
    .select("*")
    .eq("ot_id", route.params.id)
    .eq("tipo_evento", "observacion")
    .order("created_at", { ascending: true });
  if (data) {
    observaciones.value = data.map((obs) => ({
      id: obs.id,
      texto: obs.observacion,
      fecha: obs.created_at,
      isNew: false,
    }));
  }
  interfaz.hideLoading()
};

const obtenerFotos = async () => {
  const { data } = await supabase
    .from("imagenes")
    .select("*")
    .eq("id_orden_trabajo", route.params.id);
  listaFotos.value = data;
};

const handleIsCerrado = async (estado_actual_id) => {
  const {data} = await supabase
    .from('tabla_estados')
    .select('*')
    .eq('id', estado_actual_id);
  if (data && data.length > 0) {
    isCerrado.value = data[0].finaliza;
  }
}

const obtenerOrden = async () => {
  manejarBloqueo(true);
  const { data } = await supabase
    .from("orden_trabajo")
    .select("*, presupuesto(*), vehiculo(*), cliente(*), trabajadores(*)")
    .eq("id", route.params.id)
    .single();
  if (data) {
    orden.value = data;
    fechaIngreso.value = formatearFecha(data.fecha_ingreso);
    nivelCombustible.value = data.combustible_inicial ?? 0;
    await obtenerFotos();
  }
  manejarBloqueo(false);
  await handleIsCerrado(orden.value.estado_actual_id);
};

const obtenerEstados = async () => {
  const { data } = await supabase
    .from("tabla_estados")
    .select("*")
    .order("orden");
  if (data) {
    estados.value = data;
  }
};

const borrarFoto = async (id) => {
  if (verificarEstadoCerrado()) return;
  manejarBloqueo(true);
  const { error } = await supabase.from("imagenes").delete("*").eq("id", id);
  if (error) {
    console.error(error);
  }
  await obtenerFotos();
  manejarBloqueo(false);
};

const openModal = (estado) => {
  selectedEstado.value = estado;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  showSecondModal.value = false;
  showThirdModal.value = false;
  selectedEstado.value = null;
};

const confirmarCambioEstado = () => {
  if (verificarEstadoCerrado()) return;
  
  if (selectedEstado.value) {
    if (selectedEstado.value.id === 7 || selectedEstado.value.id === 8) {
      showModal.value = false;
      showSecondModal.value = true;
      return;
    }
    if (selectedEstado.value.id === 6) {
      showThirdModal.value = true;
      return;
    }
    ejecutarCambioReal();
  }
};

const handleGenerarInformeFinal = async () => {
  const {data, error} = await supabase.from("informe_final").insert({
    ot_id: orden.value.id,
    created_at: new Date().toISOString()
  }).select().single();

  if (error) {
    return;
  }

  router.push({ 
    name: 'ver-informe-final',
    params: { id: orden.value.id },
    query: { enviar: 'true' } 
  });
};

const ejecutarCambioReal = async () => {
  manejarBloqueo(true);
  const { error } = await supabase.from("OT_bitacora").insert({
    ot_id: route.params.id,
    nuevo_estado_id: selectedEstado.value.id,
    tipo_evento: "cambio_estado",
  });

  if (error) {
    console.error(error);
  } else {
    orden.value.estado_actual_id = selectedEstado.value.id;
    await handleIsCerrado(selectedEstado.value.id);
    if (selectedEstado.value.id === 6) {
      await handleGenerarInformeFinal();
    }
    if (selectedEstado.value.id == 11) {
      fechaIngreso.value = formatearFecha(hoy);
      await supabase.from('orden_trabajo').update({'fecha_ingreso': hoy}).eq('id', route.params.id);
    }
  }
  closeModal();
  manejarBloqueo(false);
}

onMounted( async () => {
  interfaz.showLoading();
  await obtenerOrden();
  obtenerEstados();
  traerObservaciones();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-12">
    <navbar
      titulo="ServiML"
      :subtitulo="'OT No. ' + orden.presupuesto?.numero_folio"
      class="sticky top-0 z-40"
      searchInput="false"
    />
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-15">
      <div v-if="isCerrado" class="mb-6 p-4 bg-blue-100 border-l-4 border-blue-600 text-blue-800 rounded shadow-sm flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="font-bold">La orden de trabajo está cerrada. Modo solo lectura.</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 overflow-x-auto">
        <div class="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-2 min-w-max md:min-w-0">
          <div v-for="estado in estados" :key="estado.id" class="flex flex-col items-center group">
            <div
              v-if="estado.id !== 1"
              @click="openModal(estado)"
              class="relative px-6 py-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              :class="{'opacity-50 hover:opacity-100': estado.id !== orden.estado_actual_id}"
            >
              <div 
                class="absolute inset-0 transform -skew-x-12 rounded shadow-sm"
                :style="{ backgroundColor: estado.color }"
              ></div>
              <span class="relative z-10 font-bold text-white text-sm whitespace-nowrap">{{ estado.estado }}</span>
            </div>
            
            <div v-if="estado.id === orden.estado_actual_id" class="mt-2 text-blue-600 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="servi-blue px-6 py-4 flex justify-between items-center">
              <h1 class="servi-yellow-font font-bold text-lg tracking-wide">INFORMACIÓN GENERAL</h1>
            </div>
            
            <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Patente</label>
                <div class="relative">
                  <p>{{ orden.vehiculo?.patente }}</p>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Modelo</label>
                <div class="relative">
                  <p>{{ orden.vehiculo?.marca }} {{ orden.vehiculo?.modelo }}</p>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</label>
                <div class="relative">
                  <p>{{ orden.cliente?.nombre + ' ' + orden.cliente?.apellido }}</p>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</label>
                <div class="relative">
                  <p>+{{ orden.cliente?.codigo_pais }} {{ orden.cliente?.telefono }}</p>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                <div class="relative">
                  <p>{{ orden.cliente?.email || 'No registrado' }}</p>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Motivo de Ingreso</label>
                <p>{{ orden.motivo_ingreso }}</p>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Responsable</label>
                <p v-if="!orden.id_empleado">No asignado</p>
                <p v-else>{{ orden.trabajadores?.nombre + ' ' + orden.trabajadores?.apellido || 'No asignado' }}</p>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha de Ingreso</label>
                <p>{{ fechaIngreso || 'No registrado' }}</p>
              </div>
            </div>
          </div>



          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="servi-blue px-6 py-4 flex justify-between items-center">
              <h1 class="servi-yellow-font font-bold text-lg tracking-wide">DATOS INICIALES</h1>
            </div>
            <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Kilometraje Inicial</label>
                <div class="relative">
                  <input class="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium" type="number" v-model="orden.kilometraje_inicial" />
                  <span class="absolute right-3 top-2.5 text-gray-400 text-sm">km</span>
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Combustible Inicial</label>
                <medidorCombustible v-model="nivelCombustible" />
              </div>            
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha Promesa</label>
                <input class="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium" type="date" v-model="orden.fecha_promesa" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Prioridad</label>
                <select class="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium" v-model="orden.prioridad">
                  <option value="1">Alta</option>
                  <option value="2">Media</option>
                  <option value="3">Baja</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo de Trabajo</label>
                <input class="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium" type="text" v-model="orden.tipo_trabajo" />
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div class="servi-blue px-6 py-4 flex justify-between items-center">
              <h3 class="servi-yellow-font font-bold text-lg tracking-wide uppercase">Bitácora de Observaciones</h3>
              <button 
                @click="agregarObservacion"
                class="servi-yellow text-blue-900 font-bold p-2 rounded-full shadow-md transition-all transform hover:scale-105"
                title="Agregar Observación"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            <div class="p-6 bg-gray-50 min-h-[200px] max-h-[500px] overflow-y-auto">
              <div v-if="observaciones.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p class="text-sm">No hay observaciones registradas</p>
              </div>

              <div class="space-y-4">
                <div 
                  v-for="(observacion, index) in observaciones" 
                  :key="observacion.id"
                  class="flex gap-4 group"
                >
                  <div class="flex-shrink-0 mt-1">
                    <div class="w-8 h-8 rounded-full servi-blue flex items-center justify-center text-yellow-400 font-bold text-xs">
                      {{ index + 1 }}
                    </div>
                  </div>
                  <div class="flex-grow">
                     <div class="relative bg-white border border-gray-200 p-4 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start mb-2">
                          <span class="text-xs text-gray-400 font-semibold">{{ new Date(observacion.fecha).toLocaleDateString() }}</span>
                          <button v-if="observacion.isNew" @click="eliminarObservacion(index)" class="text-red-400 hover:text-red-600">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <textarea 
                          v-model="observacion.texto"
                          placeholder="Escriba los detalles aquí..."
                          class="w-full text-gray-700 bg-transparent border-0 p-0 focus:ring-0 resize-none text-sm leading-relaxed"
                          rows="2"
                        ></textarea>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Acciones</h3>
            <div class="flex flex-col gap-3">
              <button
                @click="guardarCambios()"
                class="w-full servi-yellow servi-blue-font py-3 px-4 rounded-lg font-bold shadow-sm hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Guardar Todo
              </button>

              <button 
                v-if="!loading && orden.estado_actual_id === 6"
                @click="redirigirInformeFinal" 
                class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-bold shadow-sm hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Ver Informe Final
              </button>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-fit">
            <div class="servi-blue px-6 py-4">
               <h3 class="servi-yellow-font font-bold text-lg tracking-wide uppercase">Evidencia</h3>
            </div>
            
            <div class="p-4">
              <div class="grid grid-cols-2 lg:grid-cols-2 gap-3 mb-4">
                <div
                  v-if="!listaFotos || listaFotos.length === 0"
                  class="col-span-full py-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg"
                >
                  <p class="text-sm">Sin fotos</p>
                </div>

                <div
                  v-for="imagen in listaFotos"
                  :key="imagen.id"
                  class="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
                >
                  <img
                    :src="imagen.url"
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      @click="borrarFoto(imagen.id)"
                      class="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transform transition-transform hover:scale-110"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <subirFotos @loading="manejarBloqueo" @recargarFotos="obtenerFotos" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/60 backdrop-blur-sm">
      <div class="bg-white servi-blue-font rounded-lg p-6 max-w-sm w-full shadow-2xl">
        <h3 class="text-xl font-bold servi-blue-font mb-2">Confirmar cambio</h3>
        <p class="text-gray-600 text-sm mb-6">¿Confirmas cambiar el estado a <span class="font-bold servi-blue-font">"{{ selectedEstado?.estado }}"</span>?</p>
        <div class="flex justify-end gap-3">
          <button @click="closeModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium">Cancelar</button>
          <button @click="confirmarCambioEstado()" class="px-4 py-2 servi-blue text-white rounded-md font-bold hover:bg-blue-700">Confirmar</button>
        </div>
      </div>
    </div>

    <div v-if="showSecondModal" class="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-md">
      <div class="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl border-l-4 border-red-600">
        <div class="flex items-center gap-2 mb-4">
          <div class="p-2 bg-red-100 rounded-full text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900">Finalizar Orden</h3>
        </div>
        <p class="text-gray-600 text-sm mb-6">Estás a punto de cerrar esta orden permanentemente. No podrás realizar más ediciones.</p>
        <div class="flex justify-end gap-3">
          <button @click="closeModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium">Cancelar</button>
          <button @click="ejecutarCambioReal()" class="px-4 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700">Sí, Finalizar</button>
        </div>
      </div>
    </div>

    <div v-if="showThirdModal" class="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-md">
      <div class="bg-white servi-blue-font rounded-lg p-6 max-w-sm w-full shadow-2xl border-l-4 border-red-600">
         <div class="flex items-center gap-2 mb-4">
          <div class="p-2 bg-red-100 rounded-full text-red-600">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900">Generar Informe</h3>
        </div>
        <p class="text-gray-600 text-sm mb-6">Esto cambiará el estado a "{{ selectedEstado?.estado }}", generará el PDF y lo enviará al cliente.</p>
        <div class="flex justify-end gap-3">
          <button @click="closeModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium">Cancelar</button>
          <button @click="ejecutarCambioReal()" class="px-4 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700">Sí, Generar</button>
        </div>
      </div>
    </div>

    <modal v-if="modalState.visible" :titulo="modalState.titulo" :mensaje="modalState.mensaje" :exito="modalState.exito" @cerrar="redirigir" />
  </div>
</template>