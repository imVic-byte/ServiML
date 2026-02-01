<script setup>
defineProps({
    titulo: String,
    mensaje: String,
    exito: Boolean,
});
const emit = defineEmits(["cerrar"]);
</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300">
            <div class="p-6 text-center servi-blue">
                <div :class="[
                    'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4',
                    exito
                        ? 'border-2 border-green-500 text-green-500'
                        : 'border-2 border-red-500 text-red-500',
                ]">
                    <svg v-if="exito" xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>

                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h3 class="text-xl font-black servi-white-font">{{ titulo }}</h3>
                <p class="servi-white-font mt-2">{{ mensaje }}</p>
            </div>

            <div class="p-4 servi-blue flex justify-center">
                <button @click="emit('cerrar')" :class="[
                    'w-full py-3 rounded-xl font-bold transition-transform active:scale-95 servi-blue-font servi-yellow',
                ]">
                    Continuar
                </button>
            </div>
        </div>
    </div>
</template>