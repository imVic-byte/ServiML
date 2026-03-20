<script setup>
import {ref, onMounted, defineEmits} from 'vue'
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient";
const router = useRouter()
const FichasDisponibles=ref([])
const FichasSeleccionadas = ref([]) 

const buscarFichasDisponibles = async () => {
  const { data: disponibles, error: errDisponibles } = await supabase
    .from("ficha_de_trabajo")
    .select("*, cliente(*),orden_trabajo(id,vehiculo(id,marca,modelo,patente))")
    .in('estado',[1,6])
    .order("id", { ascending: false });
  FichasDisponibles.value = disponibles || [];
  FichasSeleccionadas.value = [];
};

const FichaDeTrabajoCrearCotizacion = (id) =>{
    router.push({ name: 'crear-cotizacion-ficha-de-trabajo', params: {id: id } })
}

const emit=defineEmits(['cerrar'])

onMounted(()=>{
    buscarFichasDisponibles()
})
</script>
<template>
    <div
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        class="servi-blue servi-yellow-font rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
        <div class="px-6 flex justify-end pt-4">
          <button @click="emit('cerrar')" class="servi-yellow rounded-xl w-[10%] text-white/80 hover:text-white">X</button>
        </div>
        <div class="px-6 flex flex-col pb-4 border-b border-white/10">
          <div class="flex flex-col">
            <h2 class="text-lg font-bold servi-yellow-font">Agregar Fichas</h2>
            <p class="text-sm text-white/80">Selecciona una Ficha de trabajo</p>
          </div>
        </div>

        <div class="p-6 flex-1 overflow-y-auto space-y-2">
          <div v-if="FichasDisponibles.length === 0" class="text-center text-white/80 py-8">No hay fichas de trabajo disponibles</div>

          <button v-for="ot in FichasDisponibles" :key="ot.id" type="button" @click="FichaDeTrabajoCrearCotizacion(ot.id)"
            class="w-full p-3 rounded-lg transition-all flex justify-between items-center text-left servi-yellow servi-blue-font hover:opacity-90">
            <div class="flex items-center gap-3 min-w-0">
              <div class="min-w-0">
                <span class="font-bold block truncate"
                  :class="FichasSeleccionadas.includes(ot.id) ? 'text-white' : 'text-white'">
                  Ficha #{{ ot.id }}
                </span>
                <p class="text-white">Cliente: {{ ot.cliente.nombre }} {{ ot.cliente.apellido }}</p>
                <div class="text-white">Vehiculos:
                    <p v-for="vehiculo in ot.orden_trabajo" :key="vehiculo.id">
                        - {{ vehiculo.vehiculo.marca }} {{ vehiculo.vehiculo.modelo }} ({{ vehiculo.vehiculo.patente }})
                    </p>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
</template>