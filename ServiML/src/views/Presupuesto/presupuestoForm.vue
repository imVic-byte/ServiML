<script setup>
import { ref, computed, onMounted } from "vue";
import navbar from "../../components/componentes/navbar.vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import modal from "../../components/componentes/modal.vue";
import cargando2 from "../../components/componentes/cargando2.vue";
import { useInterfaz } from '@/stores/interfaz.js'
const router = useRouter();
const interfaz = useInterfaz();

const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true });

const patente = ref("");
const modelo = ref("");
const marca = ref("");
const diagnostico = ref("");
const descuentoPorcentaje = ref('');
const nombre = ref("");
const apellido = ref("");
const codigoPais = ref("+56");
const telefono = ref("");
const correo = ref("");
const items = ref([{ descripcion: "", monto: "" }]);
const ivaBoolean = ref(true);

const alertaEmail = ref(true);
const presupuesto_id = ref(null);
const loading = ref(false);

const agregarItem = () => items.value.push({ descripcion: "", monto: "" });
const eliminarItem = (index) => items.value.splice(index, 1);

const validarFormulario = () => {
  if (!patente.value || patente.value.trim().length < 6) {
    modalState.value = { visible: true, titulo: "Datos incompletos", mensaje: "Ingresa una patente válida.", exito: false };
    return false;
  }
  if (!marca.value || !modelo.value) {
    modalState.value = { visible: true, titulo: "Datos incompletos", mensaje: "Marca y Modelo son obligatorios.", exito: false };
    return false;
  }
  if (!nombre.value || !apellido.value || !telefono.value) {
    modalState.value = { visible: true, titulo: "Datos incompletos", mensaje: "Completa los datos del cliente.", exito: false };
    return false;
  }
  if (!diagnostico.value) {
    modalState.value = { visible: true, titulo: "Datos incompletos", mensaje: "El diagnóstico es obligatorio.", exito: false };
    return false;
  }

  if (items.value.length === 0) {
    modalState.value = { visible: true, titulo: "Sin servicios", mensaje: "Agrega al menos un servicio o repuesto.", exito: false };
    return false;
  }
  
  for (const item of items.value) {
    if (!item.descripcion || !item.monto) {
      modalState.value = { visible: true, titulo: "Item incompleto", mensaje: "Todos los items deben tener descripción y monto.", exito: false };
      return false;
    }
  }
  return true;
};

const formatearMoneda = (valor) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(valor || 0);
};

const totales = computed(() => {
  const subtotal = items.value.reduce((acc, item) => acc + (Number(item.monto) || 0), 0);
  const dsc = descuentoPorcentaje.value || 0;
  const total_neto = subtotal - (subtotal * (dsc / 100));
  const pctIva = ivaBoolean.value ? 19 : 0;
  const iva = total_neto * (pctIva / 100);
  const total_final = total_neto + iva;

  return { subtotal, descuento: dsc, total_neto, iva, total_final };
});

const handleCorreo = () => {
  if (!correo.value && alertaEmail.value) {
    modalState.value = { visible: true, titulo: "Advertencia", mensaje: "¿Continuar sin correo del cliente?", exito: false };
    alertaEmail.value = false;
    return false;
  }
  return true;
}

const dosSemanasDespues = () => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 14);
  return fecha.toISOString().split("T")[0];
}

const enviarFormulario = async () => {
    interfaz.showLoadingOverlay()
  if (!validarFormulario()) return;
  if (alertaEmail.value && !correo.value) {
    handleCorreo();
    return;
  }
  
  loading.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sesión expirada");
    
    const { data, error } = await supabase.functions.invoke("crear-presupuesto", {
      body: {
        patente: patente.value.trim().toUpperCase(),
        marca: marca.value.trim().toUpperCase(),
        modelo: modelo.value.trim().toUpperCase(),
        nombre: nombre.value.trim().toUpperCase(),
        apellido: apellido.value.trim().toUpperCase(),
        codigoPais: codigoPais.value,
        telefono: telefono.value,
        email: correo.value,
        vencimiento: dosSemanasDespues(),
        diagnostico: diagnostico.value.toUpperCase(),
        ...totales.value,
        detalles: items.value.map((item) => ({
          descripcion: item.descripcion.toUpperCase(),
          monto: item.monto,
        })),
      },
    });

    if (error) throw error;

    presupuesto_id.value = data.data.id;
    modalState.value = { visible: true, titulo: "¡Éxito!", mensaje: "Presupuesto creado correctamente.", exito: true };
  } catch (err) {
    console.error(err);
    modalState.value = { visible: true, titulo: "Error", mensaje: "No se pudo guardar el presupuesto.", exito: false };
  } finally {
    loading.value = false;
    interfaz.hideLoadingOverlay()
  }
};

const redirigir = () => {
  if (modalState.value.exito) {
    router.push({ name: "ver-presupuesto", params: { id: presupuesto_id.value } });
  } else {
    modalState.value.visible = false;
  }
};
</script>

<template>
  <div class="bg-gray-50 min-h-screen font-sans">
    <navbar titulo="ServiML" subtitulo="Nuevo Presupuesto" class="navbar sticky top-0 z-50 shadow-sm"/>

    <div class="mx-auto p-4 max-w-7xl pb-28 pt-8">
      
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 rounded-lg">
        
        <div class="lg:col-span-7 space-y-12">
          
          <section>
            <h2 class="text-2xl w-full servi-blue servi-yellow-font border-b-2 border-yellow-400 rounded-t-lg p-2 inline-block pb-1 mb-6">
              Vehículo
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-3">
              <div class="group">
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Patente</label>
                <input
                  v-model="patente"
                  type="text"
                  class="w-full py-2 bg-transparent border-b border-gray-300 focus:border-blue-900 focus:outline-none text-xl font-medium uppercase transition-colors"
                  placeholder="AAAA11"
                  @input="patente = patente.toUpperCase()"
                  maxlength="7"
                />
              </div>
              <div class="group">
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Marca</label>
                <input v-model="marca" type="text" class="w-full py-2 bg-transparent border-b border-gray-300 focus:border-blue-900 focus:outline-none text-lg transition-colors" placeholder="Ej: Toyota" />
              </div>
              <div class="group">
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Modelo</label>
                <input v-model="modelo" type="text" class="w-full py-2 bg-transparent border-b border-gray-300 focus:border-blue-900 focus:outline-none text-lg transition-colors" placeholder="Ej: Yaris" />
              </div>
              <div class="md:col-span-2 group">
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Diagnóstico Técnico</label>
                <textarea
                  v-model="diagnostico"
                  rows="2"
                  class="w-full py-2 bg-transparent border-b border-gray-300 focus:border-blue-900 focus:outline-none text-gray-700 resize-none transition-colors"
                  placeholder="Describe el problema del vehículo..."
                ></textarea>
              </div>
            </div>
          </section>

          <section>
            <h2 class="text-2xl font-light w-full servi-blue servi-yellow-font border-b-2 border-yellow-400 rounded-t-lg p-2 inline-block pb-1 mb-6">
              Cliente
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-3">
              <div class="group">
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Nombre</label>
                <input v-model="nombre" type="text" class="w-full py-2 bg-transparent border-b border-gray-300 focus:border-blue-900 focus:outline-none text-lg transition-colors" />
              </div>
              <div class="group">
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Apellido</label>
                <input v-model="apellido" type="text" class="w-full py-2 bg-transparent border-b border-gray-300 focus:border-blue-900 focus:outline-none text-lg transition-colors" />
              </div>
              <div class="group">
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Teléfono</label>
                <div class="flex items-end gap-2">
                  <select v-model="codigoPais" class="w-20 py-2 bg-transparent border-b border-gray-300 focus:border-blue-900 focus:outline-none text-sm">
                    <option value="+56">+56</option>
                    <option value="+51">+51</option>
                  </select>
                  <input
                    v-model="telefono"
                    type="number"
                    class="flex-1 py-2 bg-transparent border-b border-gray-300 focus:border-blue-900 focus:outline-none text-lg transition-colors"
                    placeholder="912345678"
                  />
                </div>
              </div>
              <div class="group">
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Correo Electrónico</label>
                <input v-model="correo" type="email" class="w-full py-2 bg-transparent border-b border-gray-300 focus:border-blue-900 focus:outline-none text-lg transition-colors" placeholder="opcional" />
              </div>
            </div>
          </section>

          <section>
            <h2 class="text-2xl w-full font-light servi-blue servi-yellow-font border-b-2 border-yellow-400 rounded-t-lg p-2 inline-block pb-1 mb-6">
              Servicios
            </h2>
            <div class="space-y-4 px-3">
               <div v-for="(item, index) in items" :key="index" class="flex gap-4 items-end animate-fadeIn">
                 <div class="flex-1 group">
                   <input
                     v-model="item.descripcion"
                     type="text"
                     class="w-full py-2 bg-transparent border-b border-yellow-400 focus:border-blue-900 focus:outline-none text-sm"
                     placeholder="Descripción del servicio"
                   />
                 </div>
                 <div class="w-32 group">
                   <input
                     v-model.number="item.monto"
                     type="number"
                     class="w-full py-2 bg-transparent border-b border-yellow-400 focus:border-blue-900 focus:outline-none text-sm text-right"
                     placeholder="$0"
                   />
                 </div>
                 <button @click="eliminarItem(index)" class="text-gray-300 hover:text-red-500 pb-2 transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                 </button>
               </div>
               
               <button
                  @click="agregarItem"
                  class="mt-4 text-sm font-bold text-blue-800 hover:text-blue-600 flex items-center gap-2 transition-colors"
                >
                  <span class="text-xl">+</span> Agregar otro ítem
                </button>
            </div>
          </section>

        </div>

        <div class="lg:col-span-5 relative">
          <div class="bg-white shadow-xl rounded-sm sticky top-24">
            <h2 class="text-2xl w-full font-light servi-blue servi-yellow-font border-b-2 border-yellow-400 rounded-t-lg p-2 inline-block pb-1 mb-6">
              Resumen
            </h2>
             <div class="space-y-4 mb-8 px-3">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Subtotal</span>
                  <span class="font-medium">{{ formatearMoneda(totales.subtotal) }}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-600">Descuento</span>
                  <div class="flex items-center gap-1 border-b border-gray-200 w-16">
                    <input
                      v-model.number="descuentoPorcentaje"
                      type="number"
                      class="w-full text-right text-sm focus:outline-none"
                      placeholder="0"
                    />
                    <span class="text-gray-400">%</span>
                  </div>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-600">Impuesto (IVA)</span>
                  <div class="flex flex-col items-end gap-1">
                  <button 
                    @click="ivaBoolean = !ivaBoolean"
                    class="text-xs font-bold px-2 py-0.5 rounded transition-colors"
                    :class="ivaBoolean ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'"
                  >
                    {{ ivaBoolean ? '19%' : 'Exento' }}
                  </button>
                  <p class="text-xs text-gray-400">Presionar para cambiar</p>
                  </div>
                </div>
                <div class="flex justify-between text-sm border-t pt-4 ">
                  <span class="text-gray-600">Monto IVA</span>
                  <span class="font-medium">{{ formatearMoneda(totales.iva) }}</span>
                </div>
             </div>

             <div class="flex justify-between items-center mb-8 px-3">
               <span class="text-xs font-bold text-gray-400 tracking-widest uppercase">Total Estimado</span>
               <div class="text-right">
                 <p class="text-3xl font-bold text-blue-900">{{ formatearMoneda(totales.total_final) }}</p>
               </div>
             </div>

             <button
                @click="enviarFormulario"
                class="w-full servi-blue servi-yellow-font text-sm font-bold py-4 mb-4 px-4 rounded-b-lg hover:bg-blue-800 transition-all flex justify-center items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                :disabled="loading"
              >
                <span v-if="loading">Procesando...</span>
                <span v-else>EMITIR PRESUPUESTO</span>
                <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
          </div>
        </div>
      </div>
      
      <modal 
        v-if="modalState.visible" 
        :titulo="modalState.titulo" 
        :mensaje="modalState.mensaje" 
        :exito="modalState.exito" 
        @cerrar="redirigir" 
      />
    </div>
  </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
</style>