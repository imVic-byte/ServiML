<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from "../../lib/supabaseClient.js";
const router = useRouter();
const props = defineProps({
  orden: {
    type: Object,
    required: true
  },
  estado: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <div :class="estado.estado" class="servi-white  mx-2 servi-blue-font arriba p-2 mb-2">
  <div clasS="flex justify-between items-center">
    <span class="font-bold text-lg">{{ orden.presupuesto.numero_folio }}</span>
    <span :style="{ backgroundColor: estado.color }" class="servi-blue-font px-2 py-1 rounded-lg estado">{{ estado.estado }}</span>
  </div>
  <div class="flex justify-between items-center  abajo servi-blue-font font-bold text-lg">
    <RouterLink :to="{ name: 'ver-orden-de-trabajo', params: { id: orden.id } }" class="servi-yellow font-bold servi-blue-font p-2 sm:px-10 sm:py-4 rounded-full flex items-center justify-center transition-all hover:scale-105">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 font-extrabold">
  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
</svg>

    </RouterLink>
  </div>
  </div>  
</template>
<style scoped>
.arriba {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.abajo {
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
.estado {
  text-transform: uppercase;
  font-size: 0.65rem;
}
</style>