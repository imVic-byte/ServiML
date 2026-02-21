<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const volver = () => {
    router.push({ name: "listado-fichas-de-trabajo" });
}
</script>
    
<template>
    <button @click="volver"
          class="mb-4 flex items-center gap-1 text-sm servi-grey-font hover:opacity-80 transition cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
</template>