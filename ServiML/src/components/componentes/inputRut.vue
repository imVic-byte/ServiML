<script setup>
import {ref, watch} from 'vue'
import { validarRut } from '../../js/validarRUT.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'check-rut']);

const esValidoLocal = ref(true);
let timeoutId = null;

const actualizarInput = (event) => {
  emit('update:modelValue', event.target.value);
};

watch(() => props.modelValue, (nuevoValor) => {
  clearTimeout(timeoutId);

  timeoutId = setTimeout(() => {
    if (!nuevoValor) {
      esValidoLocal.value = true;
      emit('check-rut', { valido: false, rut: nuevoValor });
      return;
    }

    const esValido = validarRut(nuevoValor);
    esValidoLocal.value = esValido;
    
    emit('check-rut', { valido: esValido, rut: nuevoValor });
  }, 500);
});
</script>
<template>
  <div>
    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Rut</label>
    <input 
      :value="modelValue" 
      @input="actualizarInput" 
      :class="{ 'border-red-500': !esValidoLocal }" 
      type="text" 
      placeholder="12345678-9" 
      class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200" 
    />
  </div>
</template>