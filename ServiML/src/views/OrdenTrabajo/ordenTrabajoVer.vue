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
    .select("*")
    .eq("id", route.params.id)
    .single();
  if (data) {
    orden.value = data;
    await obtenerFotos();
  }
  manejarBloqueo(false);
};

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


onMounted(() => {
  obtenerOrden();
});
</script>

<template>
  <navbar
    titulo="ServiML"
    subtitulo="Orden de Trabajo"
    class="navbar"
    searchInput="true"
  />

  <div v-if="loading" class="flex justify-center items-center h-screen w-full fixed top-0 left-0 bg-white z-50">
     <cargando />
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