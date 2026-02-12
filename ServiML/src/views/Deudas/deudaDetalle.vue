<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import navbar from "../../components/componentes/navbar.vue";
import modal from "../../components/componentes/modal.vue";

const route = useRoute();
const router = useRouter();
const deudaId = route.params.id;

// Estados
const loading = ref(true);
const deuda = ref(null);
const otsEnDeuda = ref([]);
const abonos = ref([]);
const otsDisponibles = ref([]);
const otsSeleccionadas = ref([]); // selección múltiple

// Modales y UI
const showModalOT = ref(false);
const showModalAbono = ref(false);
const showConfig = ref(false);
const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true });

const nuevoAbono = ref(0);
const abonoObs = ref("");
const diasNotificacion = ref(0);
const procesandoNotificacion = ref(false);

// --- CÁLCULOS ---
const totalDeuda = computed(() =>
  otsEnDeuda.value.reduce((acc, item) => acc + (item.orden_trabajo?.presupuesto?.total_final || 0), 0)
);
const totalPagado = computed(() => abonos.value.reduce((acc, abono) => acc + (abono.monto || 0), 0));
const saldoPendiente = computed(() => totalDeuda.value - totalPagado.value);
const porcentajePagado = computed(() => {
  if (totalDeuda.value === 0) return 0;
  return Math.min(Math.round((totalPagado.value / totalDeuda.value) * 100), 100);
});

const esCompletada = computed(() => deuda.value?.estado === "completada");

// --- HELPERS UI ---
const estadoDeudaUI = computed(() => {
  const esPendiente = (deuda.value?.estado || "").toLowerCase() === "pendiente";
  return {
    label: esPendiente ? "Pendiente" : "Pagada",
    bg: esPendiente ? "#EF4444" : "#22C55E",
    fg: "#FFFFFF",
  };
});

const formatearDinero = (valor) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(valor || 0);

const formatearFecha = (fechaString) => {
  if (!fechaString) return "---";
  const fecha = new Date(fechaString);
  return fecha.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};

// --- CARGA DE DATOS ---
const cargarDatos = async () => {
  loading.value = true;

  const { data: dataDeuda, error } = await supabase
    .from("deudas")
    .select("*")
    .eq("id", deudaId)
    .single();

  if (error || !dataDeuda) {
    router.push("/deudas");
    return;
  }

  deuda.value = dataDeuda;
  diasNotificacion.value = dataDeuda.notificar_cada || 0;

  const { data: dataItems } = await supabase
    .from("deuda_items")
    .select(`id, orden_trabajo (id, created_at, vehiculo(modelo, patente), presupuesto(total_final))`)
    .eq("deuda_id", deudaId);
  otsEnDeuda.value = dataItems || [];

  const { data: dataAbonos } = await supabase
    .from("abonos")
    .select("*")
    .eq("deuda_id", deudaId)
    .order("created_at", { ascending: false });
  abonos.value = dataAbonos || [];

  loading.value = false;
};

// --- GESTIÓN DE ALERTAS ---
const guardarConfigNotificacion = async () => {
  procesandoNotificacion.value = true;

  const { error } = await supabase
    .from("deudas")
    .update({
      notificar_cada: diasNotificacion.value,
      ultima_notificacion: diasNotificacion.value > 0 ? new Date().toISOString() : null,
    })
    .eq("id", deudaId);

  if (!error) {
    showConfig.value = false;
    modalState.value = {
      visible: true,
      titulo: "Configurado",
      mensaje: `Alerta configurada cada ${diasNotificacion.value} días.`,
      exito: true,
    };
    cargarDatos();
  }

  procesandoNotificacion.value = false;
};

const marcarGestionado = async () => {
  const { error } = await supabase
    .from("deudas")
    .update({ ultima_notificacion: new Date().toISOString() })
    .eq("id", deudaId);

  if (!error) {
    modalState.value = {
      visible: true,
      titulo: "Gestionado",
      mensaje: "Recordatorio pospuesto según configuración.",
      exito: true,
    };
    cargarDatos();
  }
};

// --- GESTIÓN DE OTs ---
const buscarOTsDisponibles = async () => {
  const { data, error } = await supabase
    .from("orden_trabajo")
    .select(
      `
      *,
      presupuesto(total_final),
      vehiculo(modelo, patente),
      deuda_items ( id )
    `
    )
    .neq("estado_actual_id", 10)
    .is("deuda_items.id", null);

  if (!error) {
    otsDisponibles.value = data || [];
  }

  otsSeleccionadas.value = [];
  showModalOT.value = true;
};

const toggleSeleccionOT = (otId) => {
  if (otsSeleccionadas.value.includes(otId)) {
    otsSeleccionadas.value = otsSeleccionadas.value.filter((id) => id !== otId);
  } else {
    otsSeleccionadas.value.push(otId);
  }
};

const agregarOTsMasivas = async () => {
  if (otsSeleccionadas.value.length === 0) return;

  const itemsInsertar = otsSeleccionadas.value.map((otId) => ({
    deuda_id: deudaId,
    ot_id: otId,
  }));

  const { error } = await supabase.from("deuda_items").insert(itemsInsertar);

  if (!error) {
    await cargarDatos();
    showModalOT.value = false;
    otsSeleccionadas.value = [];
  } else {
    alert("Error al agregar OTs: " + error.message);
  }
};

// --- GESTIÓN DE ABONOS ---
const registrarAbono = async () => {
  if (nuevoAbono.value <= 0) return;

  const { error } = await supabase.from("abonos").insert({
    deuda_id: deudaId,
    monto: nuevoAbono.value,
    observacion: abonoObs.value,
  });

  if (!error) {
    await cargarDatos();
    showModalAbono.value = false;
    nuevoAbono.value = 0;
    abonoObs.value = "";

    modalState.value = {
      visible: true,
      titulo: "Abono Exitoso",
      mensaje: "Pago registrado.",
      exito: true,
    };
  }
};

const completarDeuda = async () => {
  const { error } = await supabase
    .from("deudas")
    .update({
      estado: "completada",
      notificar_cada: 0,
      ultima_notificacion: null,
    })
    .eq("id", deuda.value.id);

  if (!error) {
    deuda.value.estado = "completada";
    deuda.value.notificar_cada = 0;
    deuda.value.ultima_notificacion = null;
  }
};

onMounted(cargarDatos);
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-12 font-sans servi-blue-font">
    <navbar titulo="Gestión de Deuda" :subtitulo="deuda?.nombre || 'Detalle'" />

    <div v-if="loading" class="flex justify-center mt-10">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700"></div>
    </div>

    <div v-else class="max-w-7xl mx-auto px-4 py-8">
      <div class="servi-white card-shadow border border-gray-100 overflow-hidden mb-8">
        <div class="p-6 md:p-8 flex justify-between items-start flex-wrap gap-4">
          <div class="flex flex-col gap-2">
            <h1 class="text-2xl font-bold text-gray-900">{{ deuda.nombre }}</h1>

            <div class="flex items-center gap-2 flex-wrap">
              <span
                :style="{ backgroundColor: estadoDeudaUI.bg, color: estadoDeudaUI.fg }"
                class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-sm"
              >
                {{ estadoDeudaUI.label }}
              </span>

              <span
                v-if="deuda.estado === 'pendiente' && deuda.notificar_cada > 0"
                class="text-xs text-gray-500 flex items-center gap-1"
              >
                🔔 Cada {{ deuda.notificar_cada }} días
              </span>
            </div>
          </div>

          <div class="text-right">
            <p class="text-xs text-gray-500 uppercase">Saldo Pendiente</p>
            <p class="text-4xl font-extrabold text-gray-900">{{ formatearDinero(saldoPendiente) }}</p>
          </div>
        </div>

        <div class="px-6 pb-6">
          <div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div class="servi-blue h-3 rounded-full transition-all duration-700" :style="{ width: `${porcentajePagado}%` }"></div>
          </div>

          <div class="flex justify-between items-center mt-2">
            <span class="text-xs font-bold text-gray-600">{{ formatearDinero(totalPagado) }} / {{ formatearDinero(totalDeuda) }}</span>
            <span class="text-xs font-bold">{{ porcentajePagado }}% Pagado</span>
          </div>

          <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div class="text-xs text-gray-500 uppercase">OTs</div>
              <div class="font-bold text-gray-900">{{ otsEnDeuda.length }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div class="text-xs text-gray-500 uppercase">Total deuda</div>
              <div class="font-bold text-gray-900">{{ formatearDinero(totalDeuda) }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div class="text-xs text-gray-500 uppercase">Pagado</div>
              <div class="font-bold text-gray-900">{{ formatearDinero(totalPagado) }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div class="text-xs text-gray-500 uppercase">Saldo</div>
              <div class="font-bold text-gray-900">{{ formatearDinero(saldoPendiente) }}</div>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div v-if="!esCompletada" class="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-wrap gap-3 items-center">
          <button
            @click="buscarOTsDisponibles"
            class="flex rounded-lg servi-yellow servi-blue-font justify-center items-center px-4 py-2 font-bold shadow-sm hover:opacity-90 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Agregar OT
          </button>

          <button
            @click="showModalAbono = true"
            class="flex rounded-lg servi-blue servi-yellow-font justify-center items-center px-4 py-2 font-bold shadow-sm hover:opacity-90 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Abonar
          </button>

          <button
            v-if="deuda.estado === 'pendiente'"
            @click="completarDeuda"
            class="flex rounded-lg servi-blue servi-yellow-font justify-center items-center px-4 py-2 font-bold shadow-sm hover:opacity-90 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completar
          </button>

          <button
            @click="marcarGestionado"
            class="flex rounded-lg servi-yellow servi-blue-font justify-center items-center px-4 py-2 font-bold shadow-sm hover:opacity-90 transition ml-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clip-rule="evenodd"
              />
            </svg>
            Marcar Gestión
          </button>

          <button
            @click="showConfig = !showConfig"
            class="text-gray-500 font-bold hover:text-gray-800 px-3 flex items-center gap-1"
            title="Configurar recordatorio"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Config
          </button>
        </div>

        <!-- Config recordatorios -->
        <div v-if="showConfig" class="servi-blue p-4 border-t border-white/10 flex items-center gap-4 animate-fadeIn">
          <span class="servi-yellow-font font-bold text-sm">Recordarme cobrar cada:</span>
          <select v-model="diasNotificacion" class="rounded-lg px-3 py-2 servi-yellow servi-blue-font font-bold text-sm">
            <option :value="0">Nunca</option>
            <option :value="5">5 días</option>
            <option :value="10">10 días</option>
            <option :value="15">15 días</option>
            <option :value="30">30 días</option>
          </select>
          <button
            @click="guardarConfigNotificacion"
            class="px-4 py-2 text-sm font-bold servi-yellow servi-blue-font rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="procesandoNotificacion"
          >
            {{ procesandoNotificacion ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>

      <!-- Listados -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Órdenes -->
        <div class="card-shadow overflow-hidden border border-gray-200 bg-white">
          <div class="servi-blue servi-yellow-font px-4 py-3 flex items-center justify-between">
            <h3 class="font-bold text-xs uppercase tracking-wider">Órdenes ({{ otsEnDeuda.length }})</h3>
          </div>

          <div class="p-4">
            <div v-if="otsEnDeuda.length === 0" class="text-gray-400 text-center py-8">Sin OTs vinculadas</div>

            <div
              v-for="item in otsEnDeuda"
              :key="item.id"
              class="flex items-center justify-between py-3 border-b last:border-0 hover:bg-gray-50 px-2 rounded transition-colors"
            >
              <div class="min-w-0">
                <span class="font-bold text-gray-900 block">OT #{{ item.orden_trabajo.id }}</span>
                <span class="text-xs text-gray-500 block truncate">
                  {{ item.orden_trabajo.vehiculo.modelo }} - {{ item.orden_trabajo.vehiculo.patente }}
                </span>
                <span class="text-xs text-gray-400">Ingreso: {{ formatearFecha(item.orden_trabajo.created_at) }}</span>
              </div>

              <div class="flex items-center gap-3">
                <span class="font-bold text-gray-900">{{ formatearDinero(item.orden_trabajo.presupuesto?.total_final) }}</span>
                <RouterLink
                  :to="{ name: 'ver-orden-de-trabajo', params: { id: item.orden_trabajo.id } }"
                  class="servi-blue servi-white-font p-2 rounded-full transition-transform hover:scale-110 shadow-sm"
                  aria-label="Ver OT"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Abonos -->
        <div class="card-shadow overflow-hidden border border-gray-200 bg-white">
          <div class="servi-blue servi-yellow-font px-4 py-3 flex items-center justify-between">
            <h3 class="font-bold text-xs uppercase tracking-wider">Abonos Realizados</h3>
          </div>

          <div class="p-4">
            <div v-if="abonos.length === 0" class="text-gray-400 text-center py-8">Sin pagos registrados</div>

            <div
              v-for="abono in abonos"
              :key="abono.id"
              class="flex justify-between py-3 border-b last:border-0 hover:bg-gray-50 px-2 rounded transition-colors"
            >
              <div class="min-w-0">
                <span class="text-xs text-gray-400 block">{{ formatearFecha(abono.created_at) }}</span>
                <span class="text-sm text-gray-700 italic block truncate">{{ abono.observacion || 'Abono' }}</span>
              </div>

              <span class="font-bold text-gray-900">- {{ formatearDinero(abono.monto) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal OTs -->
    <div v-if="showModalOT" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="servi-blue servi-yellow-font rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
        <div class="px-6 py-4 border-b border-white/10">
          <h2 class="text-lg font-bold servi-yellow-font">Agregar Órdenes</h2>
          <p class="text-sm text-white/80">Selecciona una o varias OTs para vincular a esta cuenta.</p>
        </div>

        <div class="p-6 flex-1 overflow-y-auto space-y-2">
          <div v-if="otsDisponibles.length === 0" class="text-center text-white/80 py-8">No hay OTs disponibles para agregar</div>

          <button
            v-for="ot in otsDisponibles"
            :key="ot.id"
            type="button"
            @click="toggleSeleccionOT(ot.id)"
            class="w-full p-3 rounded-lg transition-all flex justify-between items-center text-left"
            :class="
              otsSeleccionadas.includes(ot.id)
                ? 'bg-white/10 ring-2 ring-white/50'
                : 'servi-yellow servi-blue-font hover:opacity-90'
            "
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0"
                :class="otsSeleccionadas.includes(ot.id) ? 'bg-white/20 border-white/50' : 'border-gray-300 bg-white'"
              >
                <svg v-if="otsSeleccionadas.includes(ot.id)" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>

              <div class="min-w-0">
                <span class="font-bold block truncate" :class="otsSeleccionadas.includes(ot.id) ? 'text-white' : 'text-gray-900'">
                  OT #{{ ot.id }}
                </span>
                <div class="text-xs truncate" :class="otsSeleccionadas.includes(ot.id) ? 'text-white/80' : 'text-gray-600'">
                  {{ ot.vehiculo?.modelo }} - {{ ot.vehiculo?.patente }}
                </div>
              </div>
            </div>

            <span class="font-bold" :class="otsSeleccionadas.includes(ot.id) ? 'text-white' : 'text-gray-900'">
              {{ formatearDinero(ot.presupuesto?.total_final) }}
            </span>
          </button>
        </div>

        <div class="px-6 py-4 border-t border-white/10">
          <button
            @click="agregarOTsMasivas"
            :disabled="otsSeleccionadas.length === 0"
            class="w-full servi-yellow servi-blue-font font-bold py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Agregar {{ otsSeleccionadas.length }} OTs Seleccionadas
          </button>

          <button @click="showModalOT = false" class="mt-3 text-white/80 w-full hover:text-white font-medium">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal Abono -->
    <div v-if="showModalAbono" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="servi-blue servi-yellow-font rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="px-6 py-4 border-b border-white/10">
          <h2 class="text-lg font-bold servi-yellow-font">Registrar Abono</h2>
          <p class="text-sm text-white/80">Ingresa el monto y una observación opcional.</p>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-white/80 uppercase mb-1">Monto</label>
            <input
              v-model="nuevoAbono"
              type="number"
              class="w-full rounded-lg px-3 py-2.5 servi-yellow servi-blue-font font-bold outline-none"
              placeholder="0"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-white/80 uppercase mb-1">Observación</label>
            <input
              v-model="abonoObs"
              type="text"
              class="w-full rounded-lg px-3 py-2.5 servi-yellow servi-blue-font font-bold outline-none"
              placeholder="Ej: Transferencia, efectivo, etc."
            />
          </div>
        </div>

        <div class="px-6 py-4 flex justify-end gap-3">
          <button @click="showModalAbono = false" class="px-4 py-2 text-sm font-medium servi-yellow servi-blue-font rounded-lg">Cancelar</button>

          <button
            @click="registrarAbono"
            class="px-4 py-2 text-sm font-bold servi-yellow servi-blue-font rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="nuevoAbono <= 0"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>

    <modal
      v-if="modalState.visible"
      :titulo="modalState.titulo"
      :mensaje="modalState.mensaje"
      :exito="modalState.exito"
      @cerrar="modalState.visible = false"
    />
  </div>
</template>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-shadow {
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  background-color: white;
}
</style>
