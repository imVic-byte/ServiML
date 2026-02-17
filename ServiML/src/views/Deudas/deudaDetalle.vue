<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import navbar from "../../components/componentes/navbar.vue";
import modal from "../../components/componentes/modal.vue";
import {useInterfaz} from '../../stores/interfaz'
const route = useRoute();
const router = useRouter();
const deudaId = route.params.id;
const interfaz = useInterfaz();
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
const totalEstacionamiento = computed(() => {
  return otsEnDeuda.value.reduce((acc, item) => {
    return acc + calcularEstacionamientoOT(item.orden_trabajo);
  }, 0);
});


const calcularEstacionamientoOT = (ot) => {
  if (!ot?.fecha_estacionamiento) return 0;

  const fechaInicio = new Date(ot.fecha_estacionamiento);
  const fechaFin = ot.fecha_termino_estacionamiento
    ? new Date(ot.fecha_termino_estacionamiento)
    : new Date();

  const diasTotales = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
  let diasACobrar = diasTotales - 3;

  if (diasACobrar < 0) diasACobrar = 0;

  return diasACobrar * 5000;
};


const totalDeuda = computed(() => {
  const totalOTs = otsEnDeuda.value.reduce((acc, item) =>
    acc + (item.presupuesto?.total_final || 0), 0
  );

  return totalOTs + totalEstacionamiento.value;
});

const totalPagado = computed(() => {
  const total = abonos.value.reduce((acc, abono) => acc + (abono.monto || 0), 0);
  return Math.round(total);
});

const saldoPendiente = computed(() => {
  const saldo = totalDeuda.value - totalPagado.value;
  return Math.max(0, Math.round(saldo));
});

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

const formatearDinero = (valor) => {
  const valorLimpio = Math.round(valor || 0) || 0;
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(valorLimpio);
};

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
    .from("orden_trabajo")
    .select(`*, vehiculo(*), presupuesto(*), cliente(*)`) 
    .eq("id_deuda", deudaId)
    .order("id", { ascending: false });
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
      notificar_cada: diasNotificacion.value
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
    await cargarDatos();
  }

  procesandoNotificacion.value = false;
};

const buscarOTsDisponibles = async () => {
  const { data: disponibles, error: errDisponibles } = await supabase
    .from("orden_trabajo")
    .select("*, vehiculo(*), presupuesto(*), cliente(*)")
    .is("id_deuda", null)
    .order("id", { ascending: false });
  if (errDisponibles) {
    modalState.value = {
      visible: true,
      titulo: "Error",
      mensaje: "No se pudo validar OTs disponibles: " + errDisponibles.message,
      exito: false,
    };
    return;
  }
  otsDisponibles.value = disponibles || [];

  if (otsDisponibles.value.length === 0) {
    modalState.value = {
      visible: true,
      titulo: "Sin OTs disponibles",
      mensaje: "No hay órdenes de trabajo disponibles para asignar.",
      exito: false,
    };
    return;
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

  const { error } = await supabase.from("orden_trabajo").update({ id_deuda: deudaId }).in('id', otsSeleccionadas.value);

  if (!error) {
    await cargarDatos();
    showModalOT.value = false;
    otsSeleccionadas.value = [];
    modalState.value = {
      visible: true,
      titulo: "OTs Agregadas",
      mensaje: `Se agregaron las orden(es) de trabajo exitosamente.`,
      exito: true,
    };
  } else {
    modalState.value = {
      visible: true,
      titulo: "Error",
      mensaje: "Error al agregar OTs: " + error.message,
      exito: false,
    };
  }
};

// --- GESTIÓN DE ABONOS ---
const registrarAbono = async () => {
  interfaz.showLoadingOverlay();
  if (otsEnDeuda.value.length === 0) {
    modalState.value = {
      visible: true,
      titulo: "No se puede abonar",
      mensaje: "No hay OT’s asignadas a esta deuda.",
      exito: false,
    };
    return;
  }

  if (saldoPendiente.value <= 0) {
    modalState.value = {
      visible: true,
      titulo: "Saldo en 0",
      mensaje: "No hay saldo pendiente para abonar.",
      exito: false,
    };
    return;
  }

  if (!nuevoAbono.value || Number(nuevoAbono.value) <= 0) {
    modalState.value = {
      visible: true,
      titulo: "Monto inválido",
      mensaje: "Debes ingresar un monto mayor a 0.",
      exito: false,
    };
    return;
  }

  if (Number(nuevoAbono.value) > saldoPendiente.value) {
    modalState.value = {
      visible: true,
      titulo: "Monto inválido",
      mensaje: `No puedes abonar más de ${formatearDinero(saldoPendiente.value)}.`,
      exito: false,
    };
    return;
  }


  const { error } = await supabase.from("abonos").insert({
    deuda_id: deudaId,
    monto: Number(nuevoAbono.value),
    observacion: abonoObs.value,
  });

  if (error) {
    modalState.value = {
      visible: true,
      titulo: "Error",
      mensaje: error.message,
      exito: false,
    };
    return;
  }

  await cargarDatos();
  showModalAbono.value = false;
  interfaz.hideLoadingOverlay();
  nuevoAbono.value = 0;
  abonoObs.value = "";

  modalState.value = {
    visible: true,
    titulo: "Abono Exitoso",
    mensaje: "Pago registrado.",
    exito: true,
  };
};


const puedeAbonar = computed(() => {
  return otsEnDeuda.value.length > 0 && saldoPendiente.value > 0;
});

const puedeCompletar = computed(() => {
  return otsEnDeuda.value.length > 0 && saldoPendiente.value <= 0 && !esCompletada.value;
});

const abrirModalAbono = () => {
  if (otsEnDeuda.value.length === 0) {
    modalState.value = {
      visible: true,
      titulo: "No se puede abonar",
      mensaje: "Primero tienes que asignar al menos una OT a esta deuda.",
      exito: false,
    };
    return;
  }

  if (saldoPendiente.value <= 0) {
    modalState.value = {
      visible: true,
      titulo: "Saldo en 0",
      mensaje: "Esta deuda ya no tiene saldo pendiente.",
      exito: false,
    };
    return;
  }

  showModalAbono.value = true;
};

const eliminarOTDeuda = async (id) => {
  const ok = window.confirm(`¿Deseas desvincular la OT #${id} de esta deuda?`);
  if (!ok) return;

  const montoOT = deudaItem?.presupuesto?.total_final || 0;
  const nuevoTotal = totalDeuda.value - montoOT;
  const nuevoSaldo = nuevoTotal - totalPagado.value;

  if (nuevoSaldo <= 0) {
    modalState.value = {
      visible: true,
      titulo: "No se puede eliminar",
      mensaje:
        "No puedes eliminar esta OT porque ya existen abonos que dejarían el saldo en negativo.",
      exito: false,
    };
    return;
  }

  const { error } = await supabase
    .from("orden_trabajo")
    .update({ id_deuda: null })
    .eq("id", id);

  if (error) {
    modalState.value = {
      visible: true,
      titulo: "Error",
      mensaje: error.message,
      exito: false,
    };
    return;
  }

  await cargarDatos();

  modalState.value = {
    visible: true,
    titulo: "OT eliminada",
    mensaje: `La OT #${id} fue desvinculada correctamente.`,
    exito: true,
  };
};


const pedirConfirmacionCompletar = async () => {
  if (!puedeCompletar.value) {
    modalState.value = {
      visible: true,
      titulo: "No se puede completar",
      mensaje: "Para completar, la cuenta debe tener OTs y saldo pendiente en 0.",
      exito: false,
    };
    return;
  }

  const ok = window.confirm("¿Seguro que deseas marcar esta cuenta como completada?");
  if (!ok) return;

  await completarDeuda();
};

const completarDeuda = async () => {
  const { error } = await supabase
    .from("deudas")
    .update({
      estado: "completada",
      notificar_cada: 0
    })
    .eq("id", deuda.value.id);
    const {error: error2} = await supabase
    .from("orden_trabajo")
    .update({ pagado: true })
    .eq("id_deuda", deuda.value.id);
  if (!error && !error2) {
    await cargarDatos();
    modalState.value = {
      visible: true,
      titulo: "Deuda Completada",
      mensaje: "La deuda ha sido marcada como completada exitosamente.",
      exito: true,
    };
  } else {
    modalState.value = {
      visible: true,
      titulo: "Error",
      mensaje: error.message,
      exito: false,
    };
  }
};

onMounted(cargarDatos);
</script>

<template>
  <div class="min-h-screen servi-white pb-12 font-sans text-white">
    <navbar titulo="Gestión de Deuda" :subtitulo="deuda?.nombre || 'Detalle'" class="navbar" />

    <div v-if="loading" class="flex justify-center mt-10">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700"></div>
    </div>

    <div v-else class="max-w-7xl mx-auto px-4 py-8">
      <div class="servi-adapt-bg card-shadow border border-gray-100 overflow-hidden mb-8">
        <div class="p-6 md:p-8 flex justify-between items-start flex-wrap gap-4 servi-blue">
          <div class="flex flex-col gap-2">
            <h1 class="text-2xl font-bold text-white">{{ deuda.nombre }}</h1>

            <div class="flex items-center gap-2 flex-wrap">
              <span :style="{ backgroundColor: estadoDeudaUI.bg, color: estadoDeudaUI.fg }"
                class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-sm">
                {{ estadoDeudaUI.label }}
              </span>

              <span v-if="deuda.estado === 'pendiente' && deuda.notificar_cada > 0"
                class="text-xs text-white flex items-center gap-1">
                🔔 Cada {{ deuda.notificar_cada }} días
              </span>
            </div>
          </div>

          <div class="text-right">
            <p class="text-xs text-white uppercase">Saldo Pendiente</p>
            <p class="text-4xl font-extrabold text-white">{{ formatearDinero(saldoPendiente) }}</p>
          </div>
        </div>

        <div class="px-6 pb-6">
          <div class="w-full servi-adapt-bg mt-2 rounded-full h-3 overflow-hidden">
            <div class="bg-green-500 h-3 rounded-full transition-all duration-700"
              :style="{ width: `${porcentajePagado}%` }"></div>
          </div>

          <div class="flex justify-between items-center mt-2">
            <span class="text-xs font-bold servi-grey-font">{{ formatearDinero(totalPagado) }} / {{
              formatearDinero(totalDeuda) }}</span>
            <span class="text-xs font-bold">{{ porcentajePagado }}% Pagado</span>
          </div>

          <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div class="servi-blue rounded-lg p-3 border border-gray-100">
              <div class="text-xs text-white uppercase">OTs</div>
              <div class="font-bold text-white">{{ otsEnDeuda.length }}</div>
            </div>
            <div class="servi-blue rounded-lg p-3 border border-gray-100">
              <div class="text-xs text-white uppercase">Total deuda</div>
              <div class="font-bold text-white">{{ formatearDinero(totalDeuda) }}</div>
            </div>
            <div class="servi-blue rounded-lg p-3 border border-gray-100">
              <div class="text-xs text-white uppercase">Pagado</div>
              <div class="font-bold text-white">{{ formatearDinero(totalPagado) }}</div>
            </div>
            <div class="servi-blue rounded-lg p-3 border border-gray-100">
              <div class="text-xs text-white uppercase">Saldo</div>
              <div class="font-bold text-white">{{ formatearDinero(saldoPendiente) }}</div>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div v-if="!esCompletada"
          class="servi-adapt-bg px-6 py-4 border-t border-gray-100 flex flex-wrap gap-3 items-center">
          <button @click="buscarOTsDisponibles"
            class="flex rounded-lg servi-yellow text-white justify-center items-center px-4 py-2 font-bold shadow-sm hover:opacity-90 transition">
            <span class="text-xl leading-none mb-1">+ Agregar OT</span>
            <span class="hidden sm:inline"></span>
          </button>

          <button @click="abrirModalAbono" :disabled="!puedeAbonar"
            class="w-full sm:w-auto servi-blue servi-yellow-font font-bold py-2 px-6 rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            <span class="text-xl leading-none mb-1">$ Abonar</span>
            <span class="hidden sm:inline"></span>
          </button>

          <button v-if="deuda.estado === 'pendiente'" @click="pedirConfirmacionCompletar" :disabled="!puedeCompletar"
            class="w-full sm:w-auto servi-blue servi-yellow-font font-bold py-2 px-6 rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            <span class="text-xl leading-none mb-1">✓ Completar</span>
            <span class="hidden sm:inline"></span>
          </button>


          <button @click="showConfig = !showConfig"
            class="flex rounded-lg servi-yellow text-white justify-center items-center px-4 py-2 font-bold shadow-sm hover:opacity-90 transition">
            <span class="text-xl leading-none mb-1">⚙ Configurar</span>
            <span class="hidden sm:inline"></span>
          </button>

        </div>

        <!-- Config recordatorios -->
        <div v-if="showConfig" class="servi-blue p-4 border-t border-white/10 flex items-center gap-4 animate-fadeIn">
          <span class="servi-yellow-font font-bold text-sm">Recordarme cobrar cada:</span>
          <select v-model="diasNotificacion" class="rounded-lg px-3 py-2 servi-yellow text-white font-bold text-sm">
            <option :value="0">Nunca</option>
            <option :value="5">5 días</option>
            <option :value="10">10 días</option>
            <option :value="15">15 días</option>
            <option :value="30">30 días</option>
          </select>
          <button @click="guardarConfigNotificacion"
            class="px-4 py-2 text-sm font-bold servi-yellow text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="procesandoNotificacion">
            {{ procesandoNotificacion ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>

      <!-- Listados -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Órdenes -->
        <div class="card-shadow overflow-hidden border border-gray-100 servi-adapt-bg">
          <div class="servi-blue servi-yellow-font px-4 py-3 flex items-center justify-between">
            <h3 class="font-bold text-xs uppercase tracking-wider">Órdenes ({{ otsEnDeuda.length }})</h3>
          </div>

          <div class="p-4">
            <div v-if="otsEnDeuda.length === 0" class="text-white text-center py-8">Sin OTs vinculadas</div>

            <div v-for="item in otsEnDeuda" :key="item.id"
              class="flex items-center justify-between servi-blue py-3 border-b last:border-0 hover:opacity-80 px-2 rounded-xl transition-colors">
              <div class="min-w-0">
                <span class="font-bold text-white block">OT #{{ item.id }}</span>
                <span class="text-xs text-white block truncate">
                  {{ item.vehiculo?.modelo }} - {{ item.vehiculo?.patente }}
                </span>
                <span class="text-xs text-white">Ingreso: {{ formatearFecha(item.created_at) }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="p-4 text-right font-bold servi-grey-font">
                  {{
                    formatearDinero(
                      (item.presupuesto?.total_final || 0) +
                      calcularEstacionamientoOT(item)
                    )
                  }}
                </span>

                <RouterLink :to="{ name: 'ver-orden-de-trabajo', params: { id: item.id } }"
                  class="servi-blue servi-white-font p-2 rounded-full transition-transform hover:scale-110 shadow-sm"
                  aria-label="Ver OT">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                    stroke="currentColor" class="size-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </RouterLink>

                <!-- Botón eliminar ahora a la derecha -->
                <button type="button" @click.stop="eliminarOTDeuda(item)" class="p-2 rounded-full border border-gray-200 bg-white shadow-sm
           hover:bg-red-50 hover:border-red-200 transition" title="Eliminar OT" aria-label="Eliminar OT">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-600" viewBox="0 0 20 20"
                    fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M9 2a1 1 0 00-1 1v1H5a1 1 0 000 2h.293l.853 10.243A2 2 0 008.14 18h3.72a2 2 0 001.994-1.757L14.707 6H15a1 1 0 100-2h-3V3a1 1 0 00-1-1H9zm1 4a1 1 0 10-2 0v9a1 1 0 102 0V6zm4 0a1 1 0 10-2 0v9a1 1 0 102 0V6z"
                      clip-rule="evenodd" />
                  </svg>
                </button>
              </div>

            </div>
          </div>
        </div>

        <!-- Abonos -->
        <div class="card-shadow overflow-hidden border border-gray-100 servi-adapt-bg">
          <div class="servi-blue servi-yellow-font px-4 py-3 flex items-center justify-between">
            <h3 class="font-bold text-xs uppercase tracking-wider">Abonos Realizados</h3>
          </div>

          <div class="p-4">
            <div v-if="abonos.length === 0" class="text-white text-center py-8">Sin pagos registrados</div>

            <div v-for="abono in abonos" :key="abono.id"
              class="flex justify-between py-3 servi-blue border-b last:border-0 hover:opacity-80 px-2 rounded-xl transition-colors">
              <div class="min-w-0">
                <span class="text-xs text-white block">{{ formatearFecha(abono.created_at) }}</span>
                <span class="text-sm text-white italic block truncate">{{ abono.observacion || 'Abono' }}</span>
              </div>

              <span class="font-bold text-white">{{ formatearDinero(abono.monto) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal OTs -->
    <div v-if="showModalOT"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        class="servi-blue servi-yellow-font rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
        <div class="px-6 py-4 border-b border-white/10">
          <h2 class="text-lg font-bold servi-yellow-font">Agregar Órdenes</h2>
          <p class="text-sm text-white/80">Selecciona una o varias OTs para vincular a esta Deuda.</p>
        </div>

        <div class="p-6 flex-1 overflow-y-auto space-y-2">
          <div v-if="otsDisponibles.length === 0" class="text-center text-white/80 py-8">No hay OTs disponibles para
            agregar</div>

          <button v-for="ot in otsDisponibles" :key="ot.id" type="button" @click="toggleSeleccionOT(ot.id)"
            class="w-full p-3 rounded-lg transition-all flex justify-between items-center text-left" :class="otsSeleccionadas.includes(ot.id)
              ? 'bg-white/10 ring-2 ring-white/50'
              : 'servi-yellow servi-blue-font hover:opacity-90'
              ">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0"
                :class="otsSeleccionadas.includes(ot.id) ? 'bg-white/20 border-white/50' : 'border-gray-300 bg-white'">
                <svg v-if="otsSeleccionadas.includes(ot.id)" xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd" />
                </svg>
              </div>

              <div class="min-w-0">
                <span class="font-bold block truncate"
                  :class="otsSeleccionadas.includes(ot.id) ? 'text-white' : 'text-white'">
                  OT #{{ ot.id }}
                </span>
                <div class="text-xs truncate"
                  :class="otsSeleccionadas.includes(ot.id) ? 'text-white/80' : 'text-white'">
                  {{ ot.vehiculo?.modelo }} - {{ ot.vehiculo?.patente }}
                </div>
              </div>
            </div>

            <span class="font-bold" :class="otsSeleccionadas.includes(ot.id) ? 'text-white' : 'text-white'">
              {{ formatearDinero(ot.presupuesto?.total_final) }}
            </span>
          </button>
        </div>

        <div class="px-6 py-4 border-t border-white/10">
          <button @click="agregarOTsMasivas" :disabled="otsSeleccionadas.length === 0"
            class="w-full servi-yellow text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition">
            Agregar {{ otsSeleccionadas.length }} OTs Seleccionadas
          </button>

          <button @click="showModalOT = false"
            class="mt-3 text-white/80 w-full hover:text-white font-medium">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal Abono -->
    <div v-if="showModalAbono"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        class="servi-blue servi-yellow-font rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="px-6 py-4 border-b border-white/10">
          <h2 class="text-lg font-bold servi-yellow-font">Registrar Abono</h2>
          <p class="text-sm text-white/80">Ingresa el monto y una observación opcional.</p>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-white/80 uppercase mb-1">Monto</label>
            <input v-model="nuevoAbono" type="number"
              class="w-full rounded-lg px-3 py-2.5 servi-adapt-bg text-white font-bold outline-none" placeholder="0" />
          </div>

          <div>
            <label class="block text-xs font-bold text-white/80 uppercase mb-1">Observación</label>
            <input v-model="abonoObs" type="text"
              class="w-full rounded-lg px-3 py-2.5 servi-adapt-bg text-white font-bold outline-none"
              placeholder="Ej: Transferencia, efectivo, etc." />
          </div>
        </div>

        <div class="px-6 py-4 flex justify-end gap-3">
          <button @click="showModalAbono = false"
            class="px-4 py-2 text-sm font-medium servi-yellow text-white rounded-lg">Cancelar</button>

          <button @click="registrarAbono"
            class="px-4 py-2 text-sm font-bold servi-yellow text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="nuevoAbono <= 0">
            Confirmar
          </button>
        </div>
      </div>
    </div>


    <modal v-if="modalState.visible" :titulo="modalState.titulo" :mensaje="modalState.mensaje" :exito="modalState.exito"
      @cerrar="modalState.visible = false" />
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
}
</style>
