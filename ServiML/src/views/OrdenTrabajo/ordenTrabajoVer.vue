<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../../lib/supabaseClient.js";
import { useRoute, useRouter } from "vue-router";
import navbar from "../../components/componentes/navbar.vue";
import cargando from "../../components/componentes/cargando.vue";
import subirFotos from "../../components/componentes/subir-fotos.vue";
import modal from "../../components/componentes/modal.vue";
const isCerrado = ref(false);
const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true });
const redirigir = () => {
  modalState.value.visible = false;
};
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
          console.error("Error al guardar observación:", obsError);
          alert("Hubo un error al guardar una observación.");
        }
      }
    }
  if (error) {
    console.error("Error al guardar cambios:", error);
    alert("Hubo un error al guardar los cambios.");
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
    .select("*, presupuesto(*), vehiculo(*), cliente(*)")
    .eq("id", route.params.id)
    .single();
  if (data) {
    orden.value = data;
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
    console.error("Error al borrar foto:", error);
    alert("Hubo un error al borrar la foto.");
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
    console.error("Error al actualizar estado:", error);
    alert("Hubo un error al actualizar el estado.");
  } else {
    orden.value.estado_actual_id = selectedEstado.value.id;
    await handleIsCerrado(selectedEstado.value.id);
    if (selectedEstado.value.id === 6) {
      handleGenerarInformeFinal();
    }
  }

  closeModal();
  manejarBloqueo(false);
}

onMounted( async () => {
  await obtenerOrden();
  obtenerEstados();
  traerObservaciones();
});
</script>

<template>
  <navbar
    titulo="ServiML"
    :subtitulo="'OT No. ' + orden.presupuesto?.numero_folio"
    class="navbar"
    searchInput="false"
    v-if="!loading"
  />
  <div v-if="isCerrado">
    <div class="m-5 p-4 servi-blue servi-yellow-font rounded-xl shadow-sm flex items-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p class="font-bold">La orden de trabajo está cerrada. No se pueden realizar modificaciones.</p>
    </div>
  </div>
  <div
    v-if="loading"
    class="flex justify-center items-center h-screen w-full fixed top-0 left-0 bg-white z-50"
  >
    <cargando />
  </div>
  <div
    class="w-full bg-gray-100 p-4 rounded-lg shadow-inner justify-center items-center flex"
  >
    <div class="flex overflow-x-auto snap-x cursor-grab active:cursor-grabbing">
      <div
        v-for="estado in estados"
        :key="estado.id"
        class="flex flex-col items-center"
      >
        <div
          v-if="estado.id !== 1"
          @click="openModal(estado)"
          class="w-48 h-10 text-end pl-4 p-2 flex items-center justify-center font-bold text-sm"
          :style="{
            clipPath:
              'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%, 15% 50%)',
            backgroundColor: estado.color,
          }"
        >
          <p class="font-bold text-gray-800 truncate">{{ estado.estado }}</p>
        </div>
        <svg
          v-if="estado.id === orden.estado_actual_id"
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-blue-600 mb-1 animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 15l7-7 7 7"
          />
        </svg>
      </div>
    </div>
  </div>
  
  <div
    v-if="showModal"
    class="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none bg-black/60 backdrop-blur-sm"
  >
    <div
      class="servi-blue rounded-lg p-6 max-w-sm w-full shadow-xl pointer-events-auto"
    >
      <h3 class="text-xl font-bold servi-white-font mb-2">Confirmar cambio</h3>
      <p class="servi-white-font text-sm mb-6">
        ¿Confirmas que el nuevo estado es "{{ selectedEstado?.estado }}"?
      </p>
      <div class="flex justify-end gap-3">
        <button
          @click="closeModal()"
          class="px-4 py-2 servi-yellow-font rounded-md"
        >
          Cancelar
        </button>
        <button
          @click="confirmarCambioEstado()"
          class="px-4 py-2 servi-yellow servi-blue-font rounded-md font-bold"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>

  <div
    v-if="showSecondModal"
    class="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none bg-black/70 backdrop-blur-md"
  >
    <div
      class="bg-red-50 rounded-lg p-6 max-w-sm w-full shadow-2xl pointer-events-auto border-2 border-red-500"
    >
      <div class="flex items-center gap-2 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 class="text-xl font-bold text-red-700">¡Acción Irreversible!</h3>
      </div>
      
      <p class="text-gray-800 text-sm mb-2 font-semibold">
        Estás a punto de marcar la orden como "{{ selectedEstado?.estado }}".
      </p>
      <p class="text-gray-600 text-xs mb-6">
        Una vez confirmado, la Orden de Trabajo se cerrará permanentemente y no podrás realizar más ediciones ni cambios de estado.
      </p>
      <div class="flex justify-end gap-3">
        <button
          @click="closeModal()"
          class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
        >
          Cancelar
        </button>
        <button
          @click="ejecutarCambioReal()"
          class="px-4 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 shadow-lg"
        >
          Sí, Finalizar OT
        </button>
      </div>
    </div>
  </div>
  <div
    v-if="showThirdModal"
    class="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none bg-black/70 backdrop-blur-md"
  >
    <div
      class="bg-red-50 rounded-lg p-6 max-w-sm w-full shadow-2xl pointer-events-auto border-2 border-red-500"
    >
      <div class="flex items-center gap-2 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 class="text-xl font-bold text-red-700">¡Acción Irreversible!</h3>
      </div>
      
      <p class="text-gray-800 text-sm mb-2 font-semibold">
        Estás a punto de marcar la orden como "{{ selectedEstado?.estado }}".
      </p>
      <p class="text-gray-600 text-xs mb-6">
        Una vez confirmado, se generará el informe final.
      </p>
      <div class="flex justify-end gap-3">
        <button
          @click="closeModal()"
          class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
        >
          Cancelar
        </button>
        <button
          @click="ejecutarCambioReal()"
          class="px-4 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 shadow-lg"
        >
          Sí, Generar Informe Final
        </button>
      </div>
    </div>
  </div>

  <div
    v-show="!loading"
    class="mx-5 servi-blue servi-white-font rounded-xl shadow-sm p-4"
  >
    <div class="flex justify-between items-center mb-2">
      <h1 class="servi-yellow-font text-sm font-bold">INFORMACIÓN GENERAL</h1>
      <button
        @click="guardarCambios()"
        class="servi-yellow servi-blue-font px-2 py-1 rounded-xl text-sm font-bold"
      >
        Guardar Cambios
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      <div class="flex flex-col">
        <label class="font-semibold mb-1" for="kilometraje_inicial"
          >Kilometraje Inicial</label
        >
        <input
          class="servi-white text-black rounded-xl py-1 px-2"
          type="number"
          v-model="orden.kilometraje_inicial"
        />
      </div>

      <div class="flex flex-col">
        <label class="font-semibold mb-1" for="combustible_inicial"
          >Combustible Inicial</label
        >
        <input
          class="servi-white text-black rounded-xl py-1 px-2"
          type="number"
          v-model="orden.combustible_inicial"
        />
      </div>

      <div class="flex flex-col">
        <label class="font-semibold mb-1" for="fecha_ingreso"
          >Fecha de Ingreso</label
        >
        <input
          class="servi-white text-black rounded-xl py-1 px-2"
          type="datetime-local"
          v-model="orden.fecha_ingreso"
        />
      </div>

      <div class="flex flex-col">
        <label class="font-semibold mb-1" for="fecha_promesa"
          >Fecha Promesa</label
        >
        <input
          class="servi-white text-black rounded-xl py-1 px-2"
          type="date"
          v-model="orden.fecha_promesa"
        />
      </div>

      <div class="flex flex-col">
        <label class="font-semibold mb-1" for="prioridad">Prioridad</label>
        <select
          class="servi-white text-black rounded-xl py-2 px-2"
          name="prioridad"
          id="prioridad"
          v-model="orden.prioridad"
        >
          <option value="1">Alta</option>
          <option value="2">Media</option>
          <option value="3">Baja</option>
        </select>
      </div>

      <div class="flex flex-col">
        <label class="font-semibold mb-1" for="tipo_trabajo"
          >Tipo de Trabajo</label
        >
        <input
          class="servi-white text-black rounded-xl py-1 px-2"
          type="text"
          v-model="orden.tipo_trabajo"
        />
      </div>

      <div class="flex flex-col md:col-span-2 lg:col-span-3">
        <label class="font-semibold mb-1" for="motivo_ingreso"
          >Motivo de Ingreso</label
        >
        <textarea
          class="servi-white text-black rounded-xl py-1 px-2 h-24"
          v-model="orden.motivo_ingreso"
        ></textarea>
      </div>
    </div>
  </div>
   <div class="mb-3 servi-blue p-5 rounded-xl servi-yellow-font mx-5 mt-5">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-sm font-bold uppercase tracking-wider">
            Observaciones
          </h3>
          <button 
            @click="agregarObservacion"
            class="flex items-center gap-2 servi-yellow servi-blue-font font-semibold p-2 rounded-full shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div v-if="observaciones.length === 0" class="col-span-full py-8 text-center rounded-xl servi-yellow-font opacity-60">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No hay observaciones registradas</p>
        </div>

        <div class="space-y-3">
          <div 
            v-for="(observacion, index) in observaciones" 
            :key="observacion.id"
            class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/30 shadow-sm transition-all duration-200 hover:shadow-md hover:border-yellow-400/50"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs servi-blue-font font-semibold">
                Observación #{{ index + 1 }}
              </span>
              <button v-if="observacion.isNew"
                @click="eliminarObservacion(index)"
                class="text-red-400 hover:text-red-300 transition-colors p-1 rounded-full hover:bg-red-500/20"
                title="Eliminar observación"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <textarea 
              v-model="observacion.texto"
              placeholder="Escribe aquí la observación..."
              class="w-full bg-white text-gray-900 rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow"
            ></textarea>
          </div>
        </div>
      </div>
      
  <div v-show="!loading" class="pb-24">
    <div class="flex flex-col m-5">
      <div class="mb-3 servi-blue p-5 rounded-xl servi-yellow-font">
        <h3 class="text-sm font-bold uppercase tracking-wider mb-3">
          Evidencia Fotográfica
        </h3>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="fotos">
          <div
            v-if="!listaFotos || listaFotos.length === 0"
            class="col-span-full py-8 text-center rounded-xl servi-yellow-font"
          >
            <p>No hay fotos registradas</p>
          </div>

          <div
            v-for="imagen in listaFotos"
            :key="imagen.id"
            class="relative group aspect-square servi-yellow-font"
          >
            <img
              :src="imagen.url"
              alt="Evidencia ServiML"
              class="w-full h-full object-cover rounded-xl border-3 servi-yellow-border shadow-sm"
            />
            <button
              @click="borrarFoto(imagen.id)"
              class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 servi-white-font"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div>
          <h2
            class="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2"
          ></h2>
          <subirFotos @loading="manejarBloqueo" @recargarFotos="obtenerFotos" />
        </div>
      </div>
    </div>
    <modal v-if="modalState.visible" :titulo="modalState.titulo" :mensaje="modalState.mensaje" :exito="modalState.exito" @cerrar="redirigir" />
    <div v-if="!loading && orden.estado_actual_id === 6" class="flex justify-center items-center w-md mx-auto">
      <button @click="redirigirInformeFinal" class="servi-yellow servi-blue-font px-4 py-2 rounded-xl flex items-center gap-1 text-sm font-bold transition-colors hover:opacity-90 shadow-md">
        <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
        </svg>
        </span>
        <span class="hidden sm:block">Ver Informe Final</span>
      </button>
    </div>
  </div>
</template>