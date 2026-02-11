<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
    default: 50
  }
});

const emit = defineEmits(['update:modelValue']);

const fuelLevel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const handleInput = (event) => {
  fuelLevel.value = Number(event.target.value);
};

const needleRotation = computed(() => {
  const rotation = (fuelLevel.value / 100) * 180 - 90;
  return `rotate(${rotation} 100 100)`;
});

const fuelColor = computed(() => {
  if (fuelLevel.value <= 15) return '#ef4444'; 
  if (fuelLevel.value <= 40) return '#eab308'; 
  return '#22c55e'; 
});
</script>
<template>
  <div class="flex flex-col items-center justify-center p-8 servi-blue rounded-xl shadow-2xl w-full max-w-md mx-auto">
    <div class="relative w-64 h-32 mb-4 overflow-hidden">
      <svg viewBox="0 0 200 110" class="w-full h-full">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="black"
          stroke-width="12"
          stroke-linecap="round"
        />
        
        <path
          d="M 20 100 A 80 80 0 0 1 50 38"
          fill="none"
          stroke="#ef4444"
          stroke-width="12"
          stroke-linecap="round"
          class="opacity-80"
        />

        <line x1="20" y1="100" x2="30" y2="100" stroke="white" stroke-width="2" />
        <line x1="180" y1="100" x2="170" y2="100" stroke="white" stroke-width="2" />
        <line x1="100" y1="20" x2="100" y2="30" stroke="white" stroke-width="2" />

        <text x="0" y="105" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">E</text>
        <text x="190" y="105" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">F</text>

        <g :transform="needleRotation" class="transition-transform duration-700 ease-out will-change-transform">
          <line x1="100" y1="100" x2="100" y2="35" stroke="#f87171" stroke-width="4" stroke-linecap="round" />
          <circle cx="100" cy="100" r="6" fill="#4b5563" stroke="white" stroke-width="2" />
        </g>
        
        <g transform="translate(92, 70) scale(0.04)">
          <path fill="#9ca3af" d="M384 32H112C85.49 32 64 53.49 64 80v272c0 26.51 21.49 48 48 48h272c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zM144 192c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32zm0-96c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32z"/>
        </g>
      </svg>
    </div>

    <div class="flex items-center justify-between w-full mb-2">
      <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Nivel de Combustible</span>
      <span class="text-lg font-mono font-bold" :style="{ color: fuelColor }">{{ fuelLevel }}%</span>
    </div>

    <input
      type="range"
      min="0"
      max="100"
      :value="fuelLevel"
      @input="handleInput"
      class="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
</template>