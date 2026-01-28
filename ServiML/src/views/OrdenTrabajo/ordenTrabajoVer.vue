<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../../lib/supabaseClient.js";
import { useRoute } from "vue-router";
import navbar from "../../components/componentes/navbar.vue";
import cargando from "../../components/componentes/cargando.vue";
import subirFotos from "../../components/componentes/subir-fotos.vue";

const route = useRoute();
const orden = ref({});
const loading = ref(true);
const listaFotos = ref([]);
const estados = ref([]);
const showModal = ref(false);
const selectedEstado = ref(null);

const manejarBloqueo = (estado) => {
  loading.value = estado;
}

const obtenerFotos = async () => {
  const { data } = await supabase
    .from("imagenes")
    .select("*")
    .eq("id_orden_trabajo", route.params.id);
  listaFotos.value = data;
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
};

const obtenerEstados = async () => {
  const { data } = await supabase
    .from('tabla_estados')
    .select('*')
    .order('orden');
  if (data) {
    estados.value = data;
  }
  console.log(estados.value);
}

const borrarFoto = async (id) => {
  manejarBloqueo(true);
  const { error } = await supabase
    .from("imagenes")
    .delete('*')
    .eq("id", id);
  if (error) {
    console.error("Error al borrar foto:", error);
    alert("Hubo un error al borrar la foto.");
  }
  await obtenerFotos();
  manejarBloqueo(false);
}

const openModal = (estado) => {
  selectedEstado.value = estado;
  showModal.value = true;
}

const closeModal = () => {
  showModal.value = false;
  selectedEstado.value = null;
}

const confirmarCambioEstado = async () => {
  if (selectedEstado.value) {
    manejarBloqueo(true);
    const { error } = await supabase
      .from('OT_bitacora')
      .insert({
        ot_id: route.params.id,
        nuevo_estado_id: selectedEstado.value.id,
        tipo_evento: 'cambio_estado'
      })
    
    if (error) {
      console.error("Error al actualizar estado:", error);
      alert("Hubo un error al actualizar el estado.");
    } else {
      orden.value.estado_actual_id = selectedEstado.value.id;
      console.log("Estado actualizado:", selectedEstado.value.estado);
    }
    
    closeModal();
    manejarBloqueo(false);
  }
}

onMounted(() => {
  obtenerOrden();
  obtenerEstados();
});
</script>

<template>
  <navbar
    titulo="ServiML"
    :subtitulo="'OT No. ' + orden.presupuesto?.numero_folio"
    class="navbar"
    searchInput="false"
  />

  <div v-if="loading" class="flex justify-center items-center h-screen w-full fixed top-0 left-0 bg-white z-50">
     <cargando />
  </div>
  <div class="w-full bg-gray-100 p-4 rounded-lg shadow-inner justify-center items-center flex">
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
          :style="{ clipPath: 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%, 15% 50%)', backgroundColor: estado.color }"
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      </div>
    </div>
  </div>

  <div 
    v-if="showModal" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
      <h3 class="text-lg font-bold text-gray-800 mb-2">Confirmar cambio</h3>
      <p class="text-gray-600 mb-6">
        ¿Confirmas que el nuevo estado es "{{ selectedEstado?.estado }}"?
      </p>
      <div class="flex justify-end gap-3">
        <button 
          @click="closeModal()" 
          class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
        >
          Cancelar
        </button>
        <button 
          @click="confirmarCambioEstado()" 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>

  <div v-show="!loading" class="flex flex-col mx-5 servi-blue servi-white-font rounded-xl shadow-sm p-4">
    <h2 class="servi-blue servi-white-font rounded-xl flex flex-col shadow-sm">Datos</h2>
    <label for="fecha_ingreso">Fecha de Ingreso</label>
    <input class="servi-white rounded-lg" type="date" id="fecha_ingreso" v-model="orden.fecha_ingreso" />
    <label for="kilometraje_inicial">Kilometraje inicial</label>
    <input class="servi-white rounded-lg" type="number" id="kilometraje_inicial" v-model="orden.kilometraje_inicial"/>
    <label for="combustible_inicial">Combustible inicial</label>
    <input class="servi-white rounded-lg" type="number" id="combustible_inicial" v-model="orden.combustible_inicial"/>
    <label for="motivo_ingreso">Motivo de ingreso</label>
    <input class="servi-white rounded-lg" type="text" id="motivo_ingreso" v-model="orden.motivo_ingreso"/>
    <label for="tipo_trabajo">Tipo de trabajo</label>
    <input class="servi-white rounded-lg" type="text" id="tipo_trabajo" v-model="orden.tipo_trabajo"/>
    <label for="estado">Estado</label>
    <select class="servi-white rounded-lg" id="estado" v-model="orden.estado">
      <option v-for="estado in estados" :key="estado.id" :value="estado.estado">{{ estado.estado }}</option>
    </select>
  </div>

  <div v-show="!loading" class="pb-24">
    <div class="flex flex-col m-5">
      <div class="mb-3 servi-blue p-5 rounded-xl servi-yellow-font">
        <h3 class="text-sm font-bold uppercase tracking-wider mb-3">
          Evidencia Fotográfica
        </h3>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="fotos">
          <div v-if="!listaFotos || listaFotos.length === 0" class="col-span-full py-8 text-center rounded-xl servi-yellow-font">
            <p>No hay fotos registradas</p>
          </div>

          <div v-for="imagen in listaFotos" :key="imagen.id" class="relative group aspect-square servi-yellow-font">
            <img 
              :src="imagen.url" 
              alt="Evidencia ServiML" 
              class="w-full h-full object-cover rounded-xl border-3 servi-yellow-border shadow-sm" 
            />
            <button 
              @click="borrarFoto(imagen.id)" 
              class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 servi-white-font"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2"></h2>
        
        <subirFotos 
          @loading="manejarBloqueo"
          @recargarFotos="obtenerFotos"
        />
      </div>
    </div>
  </div>
</template>