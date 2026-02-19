<script setup>
import { ref, computed, onMounted } from "vue";
import navbar from "../../components/componentes/navbar.vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import modal from "../../components/componentes/modal.vue";
import { useInterfaz } from '@/stores/interfaz.js'
const router = useRouter();
const interfaz = useInterfaz();
const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true });
const diagnostico = ref("");
const descuentoPorcentaje = ref('');
const nombre = ref("");
const apellido = ref("");
const codigoPais = ref("+56");
const telefono = ref("");
const correo = ref("");
const items = ref([{ descripcion: "", monto: "", cantidad: 1 }]);
const ivaBoolean = ref(true);

const alertaEmail = ref(true);
const cotizacion_id = ref(null);
const loading = ref(false);

// ── Autocompletado de servicios ──
const serviciosCatalogo = ref([])
const autocompletadoActivo = ref(-1)

const sugerenciasFiltradas = computed(() => {
  if (autocompletadoActivo.value < 0) return []
  const texto = (items.value[autocompletadoActivo.value]?.descripcion || '').toLowerCase().trim()
  if (!texto) return serviciosCatalogo.value
  return serviciosCatalogo.value.filter(s => s.nombre.toLowerCase().includes(texto))
})

const abrirAutocompletado = (index) => {
  autocompletadoActivo.value = index
}
const cerrarAutocompletado = () => {
  setTimeout(() => { autocompletadoActivo.value = -1 }, 150)
}
const seleccionarServicio = (servicio, index) => {
  items.value[index].descripcion = servicio.nombre
  items.value[index].monto = servicio.precio
  items.value[index].cantidad = items.value[index].cantidad || 1
  autocompletadoActivo.value = -1
}

const cargarServicios = async () => {
  const { data } = await supabase
    .from('servicios')
    .select('nombre, precio')
    .eq('activo', true)
    .order('nombre', { ascending: true })
  if (data) serviciosCatalogo.value = data
}

// ── Autocompletado de clientes ──
const clientesSugeridos = ref([])
const clienteAutocompletado = ref(false)
let clienteTimeout = null

const buscarClientes = (e) => {
  const texto = e.target.value.trim()
  if (clienteTimeout) clearTimeout(clienteTimeout)
  if (texto.length < 2) {
    clientesSugeridos.value = []
    return
  }
  clienteTimeout = setTimeout(async () => {
    const { data } = await supabase
      .from('cliente')
      .select('id, nombre, apellido')
      .ilike('nombre', `%${texto}%`)
      .limit(8)
    if (data) clientesSugeridos.value = data
  }, 300)
}

const abrirClienteAutocompletado = () => {
  clienteAutocompletado.value = true
}
const cerrarClienteAutocompletado = () => {
  setTimeout(() => {
    clienteAutocompletado.value = false
  }, 150)
}
const seleccionarCliente = (cliente) => {
  nombre.value = cliente.nombre
  apellido.value = cliente.apellido
  clienteAutocompletado.value = false
  clientesSugeridos.value = []
}

const agregarItem = () => items.value.push({ descripcion: "", monto: "", cantidad: 1 });
const eliminarItem = (index) => items.value.splice(index, 1);

// Utilidades
const toCamelCase = (texto) => {
  if (!texto) return ''
  return texto.trim().split(/\s+/).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
}

// Validaciones
const esEmailValido = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validarFormulario = () => {
  if (!nombre.value || !apellido.value) {
    modalState.value = { visible: true, titulo: "Datos incompletos", mensaje: "Completa los datos del cliente.", exito: false };
    return false;
  }
  if (!diagnostico.value) {
    modalState.value = { visible: true, titulo: "Datos incompletos", mensaje: "La descripción / diagnóstico es obligatorio.", exito: false };
    return false;
  }
  if (items.value.length === 0) {
    modalState.value = { visible: true, titulo: "Sin servicios", mensaje: "Agrega al menos un servicio o repuesto.", exito: false };
    return false;
  }

  for (const item of items.value) {
    if (!item.descripcion || !item.monto || Number(item.monto) <= 0) {
      modalState.value = { visible: true, titulo: "Item incompleto", mensaje: "Todos los items deben tener descripción y un monto válido.", exito: false };
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
  const subtotal = items.value.reduce((acc, item) => acc + ((Number(item.monto) || 0) * (Number(item.cantidad) || 1)), 0);
  const dsc = descuentoPorcentaje.value || 0;
  const total_neto = subtotal - (subtotal * (dsc / 100));
  const pctIva = ivaBoolean.value ? 19 : 0;
  const iva = total_neto * (pctIva / 100);
  const total_final = total_neto + iva;

  return { subtotal, descuento: dsc, total_neto, iva, total_final };
});

const enviarFormulario = async () => {
  if (!validarFormulario()) return;
  interfaz.showLoadingOverlay()
  loading.value = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sesión expirada");

    const { data, error } = await supabase.functions.invoke("crear-cotizacion", {
      body: {
        nombre: toCamelCase(nombre.value),
        apellido: toCamelCase(apellido.value),
        diagnostico: toCamelCase(diagnostico.value),
        ...totales.value,
        detalles: items.value.map((item) => ({
          descripcion: toCamelCase(item.descripcion),
          monto: item.monto,
          cantidad: item.cantidad || 1,
        })),
      },
    });

    if (error) throw error;

    cotizacion_id.value = data.data.id;
    modalState.value = { visible: true, titulo: "¡Éxito!", mensaje: "Cotización creada correctamente.", exito: true };
  } catch (err) {
    console.error(err);
    modalState.value = { visible: true, titulo: "Error", mensaje: "No se pudo guardar la cotización.", exito: false };
  } finally {
    loading.value = false;
    interfaz.hideLoadingOverlay()
  }
};

const redirigir = () => {
  if (modalState.value.exito) {
    router.push({ name: "ver-cotizacion", params: { id: cotizacion_id.value } });
  } else {
    modalState.value.visible = false;
  }
};

onMounted(() => {
  cargarServicios()
})
</script>

<template>
  <div class="servi-white min-h-screen font-sans">
    <navbar titulo="ServiML" subtitulo="Nueva Cotización" class="navbar sticky top-0 z-50 shadow-sm" />

    <div class="mx-auto p-4 max-w-7xl pb-28 pt-8">

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 rounded-lg">

        <div class="lg:col-span-7 space-y-12 servi-adapt-bg rounded-xl">

          <!-- CLIENTE -->
          <section>
            <h2
              class="text-2xl w-full servi-blue servi-yellow-font border-b-2 border-yellow-400 rounded-t-lg p-2 inline-block pb-1 mb-6">
              Cliente
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-3">
              <div class="group relative">
                <label
                  class="block text-xs font-bold servi-grey-font uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Nombre</label>
                <input v-model="nombre" type="text"
                  class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none text-lg transition-colors"
                  placeholder="Juan" 
                  @input="buscarClientes"
                  @focus="abrirClienteAutocompletado"
                  @blur="cerrarClienteAutocompletado"
                  autocomplete="off" />
                <!-- Dropdown autocompletado clientes -->
                <div v-if="clienteAutocompletado && clientesSugeridos.length > 0"
                  class="absolute z-30 left-0 right-0 top-full mt-1 servi-adapt-bg border border-gray-100 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <button v-for="cli in clientesSugeridos" :key="cli.id" type="button"
                    class="w-full px-3 py-2.5 text-left hover:bg-blue-50 flex items-center gap-2 text-sm transition-colors cursor-pointer"
                    @mousedown.prevent="seleccionarCliente(cli)">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 servi-grey-font opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span class="servi-grey-font">{{ cli.nombre }} {{ cli.apellido }}</span>
                  </button>
                </div>
              </div>
              <div class="group">
                <label
                  class="block text-xs font-bold servi-grey-font uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Apellido</label>
                <input v-model="apellido" type="text"
                  class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none text-lg transition-colors"
                  placeholder="Perez" />
              </div>
              <div class="md:col-span-2 group">
                <label
                  class="block text-xs font-bold servi-grey-font uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Diagnóstico
                  / Descripción</label>
                <textarea v-model="diagnostico" rows="2"
                  class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none servi-white-font resize-none transition-colors"
                  placeholder="Describe el trabajo o servicio solicitado..."></textarea>
              </div>
            </div>
          </section>

          <!-- SERVICIOS / ITEMS -->
          <section>
            <h2
              class="text-2xl w-full font-light servi-blue servi-yellow-font border-b-2 border-yellow-400 rounded-t-lg p-2 inline-block pb-1 mb-6">
              Servicios
            </h2>
            <div class="space-y-4 px-3">
              <div v-for="(item, index) in items" :key="index" class="animate-fadeIn relative"
                :style="{ zIndex: autocompletadoActivo === index ? 20 : 0 }">
                <div class="flex gap-4 items-end">
                  <div class="flex-1 group relative">
                    <label class="block text-xs servi-grey-font mb-0.5">Descripción</label>
                    <input v-model="item.descripcion" type="text"
                      class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none text-sm"
                      placeholder="Buscar servicio..." @focus="abrirAutocompletado(index)" @blur="cerrarAutocompletado()"
                      @input="abrirAutocompletado(index)" autocomplete="off" />
                    <!-- Dropdown autocompletado -->
                    <div v-if="autocompletadoActivo === index && sugerenciasFiltradas.length > 0"
                      class="absolute z-30 left-0 right-0 top-full mt-1 servi-adapt-bg border border-gray-100 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      <button v-for="servicio in sugerenciasFiltradas" :key="servicio.nombre" type="button"
                        class="w-full px-3 py-2.5 text-left servi-adapt-bg-100 hover:bg-blue-50 flex justify-between items-center gap-2 text-sm transition-colors cursor-pointer"
                        @mousedown.prevent="seleccionarServicio(servicio, index)">
                        <span class="truncate servi-white-font">{{ servicio.nombre }}</span>
                        <span class="text-xs font-semibold servi-grey-font whitespace-nowrap">{{
                          formatearMoneda(servicio.precio) }}</span>
                      </button>
                    </div>
                  </div>
                  <div class="w-28 group">
                    <label class="block text-xs servi-grey-font mb-0.5">P. Unit.</label>
                    <input v-model.number="item.monto" type="number"
                      class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none text-sm text-right"
                      placeholder="$0" />
                  </div>
                  <div class="w-16 group">
                    <label class="block text-xs servi-grey-font mb-0.5">Cant.</label>
                    <input v-model.number="item.cantidad" type="number" min="1"
                      class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none text-sm text-center"
                      placeholder="1" />
                  </div>
                  <div class="w-28 text-right pb-2">
                    <label class="block text-xs servi-grey-font mb-0.5">Total</label>
                    <span class="text-sm font-semibold servi-grey-font">{{ formatearMoneda((Number(item.monto) || 0) * (Number(item.cantidad) || 1)) }}</span>
                  </div>
                  <button @click="eliminarItem(index)" class="servi-grey-font hover:text-red-500 pb-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <button @click="agregarItem"
                class="mt-4 text-sm font-bold servi-blue servi-yellow-font px-2 py-1 rounded-sm mb-2 hover:text-blue-600 flex items-center gap-2 transition-colors">
                <span class="text-xl ">+</span> Agregar otro ítem
              </button>
            </div>
          </section>

        </div>

        <!-- RESUMEN / TOTALES -->
        <div class="lg:col-span-5 relative">
          <div class="servi-adapt-bg shadow-xl sticky top-24 rounded-xl">
            <h2
              class="text-2xl w-full font-light servi-blue servi-yellow-font border-b-2 border-yellow-400 rounded-t-lg p-2 inline-block pb-1 mb-6">
              Resumen
            </h2>
            <div class="space-y-4 mb-8 px-3">
              <div class="flex justify-between text-sm">
                <span class="servi-grey-font">Subtotal</span>
                <span class="font-medium servi-grey-font">{{ formatearMoneda(totales.subtotal) }}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="servi-grey-font">Descuento</span>
                <div class="flex items-center gap-1 border-b border-gray-100 w-16">
                  <input v-model.number="descuentoPorcentaje" type="number"
                    class="w-full text-right text-sm servi-grey-font focus:outline-none" placeholder="0" />
                  <span class="text-xs font-bold servi-grey-font">%</span>
                </div>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="servi-grey-font">Impuesto (IVA)</span>
                <div class="flex flex-col items-end gap-1">
                  <button @click="ivaBoolean = !ivaBoolean"
                    class="text-xs font-bold px-2 py-0.5 rounded transition-colors"
                    :class="ivaBoolean ? 'bg-blue-100 text-blue-800' : 'servi-adapt-bg servi-grey-font'">
                    {{ ivaBoolean ? '19%' : 'Exento' }}
                  </button>
                  <p class="text-xs servi-grey-font">Presionar para cambiar</p>
                </div>
              </div>
              <div class="flex justify-between text-sm border-t pt-4 ">
                <span class="servi-grey-font">Monto IVA</span>
                <span class="font-medium servi-grey-font">{{ formatearMoneda(totales.iva) }}</span>
              </div>
            </div>

            <div class="flex justify-between items-center mb-8 px-3">
              <span class="text-xs font-bold servi-grey-font tracking-widest uppercase">Total Estimado</span>
              <div class="text-right">
                <p class="text-3xl font-bold servi-yellow-font">{{ formatearMoneda(totales.total_final) }}</p>
              </div>
            </div>

            <button @click="enviarFormulario"
              class="w-full servi-blue servi-yellow-font text-sm font-bold py-4 mb-4 px-4 rounded-b-lg hover:bg-blue-800 transition-all flex justify-center items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              :disabled="loading">
              <span v-if="loading">Procesando...</span>
              <span v-else>EMITIR COTIZACIÓN</span>
              <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <modal v-if="modalState.visible" :titulo="modalState.titulo" :mensaje="modalState.mensaje"
        :exito="modalState.exito" @cerrar="redirigir" />
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
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
</style>
