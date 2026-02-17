<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../../lib/supabaseClient.js';
import navbar from '../../components/componentes/navbar.vue';

const router = useRouter();

const deudas = ref([]);
const loading = ref(false);
const showModalCrear = ref(false);

// Formulario Nueva Deuda
const form = ref({
  nombre: '',
});

const filtroEstado = ref('todas');
const ordenCampo = ref('created_at');
const ordenAsc = ref(false);

const formatearFecha = (fechaString) => {
  if (!fechaString) return '---';
  const fecha = new Date(fechaString);
  return fecha.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
};

const estadoUI = (item) => {
  const esPendiente = (item?.estado || '').toLowerCase() === 'pendiente';
  return {
    label: esPendiente ? 'Pendiente' : 'Pagada',
    bg: esPendiente ? '#EF4444' : '#22C55E',
    fg: '#FFFFFF',
  };
};

const verDetalle = (id) => {
  router.push({ name: 'ver-deuda', params: { id } });
};

const cargarDeudas = async () => {
  loading.value = true;

  const { data, error } = await supabase
    .from('deudas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al cargar deudas:', error);
    deudas.value = [];
  } else {
    deudas.value = data || [];
  }

  loading.value = false;
};

const crearDeuda = async () => {
  if (!form.value.nombre) return;

  const { data, error } = await supabase
    .from('deudas')
    .insert({
      nombre: form.value.nombre,
      notificar_cada: 0,
      estado: 'pendiente',
    })
    .select()
    .single();

  if (error) {
    console.error('Error al crear deuda:', error);
    return;
  }

  if (data) {
    showModalCrear.value = false;
    form.value.nombre = '';
    await cargarDeudas();
    router.push({ name: 'listado-deudas', params: { id: data.id } });
  }
};

const limpiarFiltros = () => {
  filtroEstado.value = 'todas';
  ordenCampo.value = 'created_at';
  ordenAsc.value = false;
};

const cantidadPendientes = computed(() =>
  deudas.value.filter((d) => (d.estado || '').toLowerCase() === 'pendiente').length
);

const cantidadPagadas = computed(() =>
  deudas.value.filter((d) => (d.estado || '').toLowerCase() !== 'pendiente').length
);

const deudasFiltradas = computed(() => {
  let arr = [...deudas.value];

  if (filtroEstado.value === 'pendiente') {
    arr = arr.filter((d) => (d.estado || '').toLowerCase() === 'pendiente');
  } else if (filtroEstado.value === 'pagada') {
    // pagada = todo lo que NO sea pendiente (completada/pagada/etc.)
    arr = arr.filter((d) => (d.estado || '').toLowerCase() !== 'pendiente');
  }

  const asc = ordenAsc.value;
  const campo = ordenCampo.value;

  arr.sort((a, b) => {
    if (campo === 'nombre') {
      const an = (a.nombre || '').toLowerCase();
      const bn = (b.nombre || '').toLowerCase();
      if (an < bn) return asc ? -1 : 1;
      if (an > bn) return asc ? 1 : -1;
      return 0;
    }

    const ad = new Date(a.created_at || 0).getTime();
    const bd = new Date(b.created_at || 0).getTime();
    return asc ? ad - bd : bd - ad;
  });

  return arr;
});

onMounted(() => {
  cargarDeudas();
});
</script>

<template>
  <div class="min-h-screen servi-white pb-12 font-sans servi-grey-font">
    <navbar titulo="ServiML" subtitulo="Deudas y Abonos" class="navbar" />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Header + Toolbar -->
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold">Deudas</h2>
          <p class="servi-grey-font">Gestiona las deudas agrupadas por cliente</p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <!-- Filtros Estado -->
          <div
            class="inline-flex self-start w-fit rounded-xl border border-gray-100 servi-adapt-bg shadow-sm overflow-hidden">
            <button type="button" @click="filtroEstado = 'todas'" class="px-4 py-2 text-sm font-bold transition-colors"
              :class="filtroEstado === 'todas' ? 'servi-blue servi-yellow-font' : 'servi-adapt-bg servi-grey-font hover:opacity-80'">
              Todas
              <span class="ml-2 text-[11px] font-extrabold px-2 py-0.5 rounded-full"
                :class="filtroEstado === 'todas' ? 'servi-adapt-bg/20 text-white' : 'servi-adapt-bg servi-grey-font'">
                {{ deudas.length }}
              </span>
            </button>

            <button type="button" @click="filtroEstado = 'pendiente'"
              class="px-4 py-2 text-sm font-bold transition-colors border-l border-gray-100"
              :class="filtroEstado === 'pendiente' ? 'servi-blue servi-yellow-font' : 'servi-adapt-bg servi-grey-font hover:opacity-80'">
              Pendientes
              <span class="ml-2 text-[11px] font-extrabold px-2 py-0.5 rounded-full"
                :class="filtroEstado === 'pendiente' ? 'servi-adapt-bg/20 text-white' : 'bg-red-50 text-red-600'">
                {{ cantidadPendientes }}
              </span>
            </button>

            <button
              type="button"
              @click="filtroEstado = 'pagada'"
              class="px-4 py-2 text-sm font-bold transition-colors border-l border-gray-100"
              :class="filtroEstado === 'pagada' ? 'servi-blue servi-yellow-font' : 'servi-adapt-bg servi-grey-font hover:opacity-80'"
            >
              Pagadas
              <span
                class="ml-2 text-[11px] font-extrabold px-2 py-0.5 rounded-full"
                :class="filtroEstado === 'pagada' ? 'servi-adapt-bg/20 text-white' : 'bg-green-50 text-green-700'"
              >
                {{ cantidadPagadas }}
              </span>
            </button>
          </div>

          <!-- Orden + Acción -->
          <div class="flex items-center gap-2">
            <select
              v-model="ordenCampo"
              class="servi-yellow servi-grey-font font-bold border border-gray-100 rounded-lg px-3 py-2 shadow-sm outline-none"
              title="Ordenar por"
            >
              <option value="created_at">Fecha</option>
              <option value="nombre">Nombre</option>
            </select>

            <button
              type="button"
              @click="ordenAsc = !ordenAsc"
              class="servi-yellow servi-grey-font font-bold border border-gray-100 rounded-lg px-3 py-2 shadow-sm flex items-center gap-2 hover:opacity-90 transition"
              :title="ordenAsc ? 'Ascendente' : 'Descendente'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                :class="['h-4 w-4 transition-transform', ordenAsc ? '' : 'rotate-180']"
              >
                <path d="M12 5v14" />
                <path d="m19 12-7-7-7 7" />
              </svg>
              <span class="hidden sm:inline">{{ ordenAsc ? 'Asc' : 'Desc' }}</span>
            </button>

            <button
              @click="showModalCrear = true"
              class="servi-yellow servi-grey-font px-5 py-2.5 rounded-lg font-bold shadow-sm flex items-center gap-2 hover:opacity-90 transition"
            >
              <span class="text-xl leading-none">+</span>
              Nueva Deuda
            </button>

          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-700"></div>
      </div>

      <template v-else>
        <!-- Sin cuentas -->
        <div v-if="deudas.length === 0" class="servi-adapt-bg rounded-xl p-10 text-center shadow-sm border border-gray-100">
          <div class="servi-grey-font mb-2">
            <p class="servi-grey-font text-lg">No hay deudas creadas</p>
            <p class="text-sm servi-grey-font">Crea una deuda para agrupar OTs y registrar abonos.</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-12 w-12 mx-auto mt-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <button
            @click="showModalCrear = true"
            class="mt-2 inline-flex items-center gap-2 servi-yellow servi-grey-font px-4 py-2 rounded-lg font-bold shadow-sm hover:opacity-90"
          >
            <span class="text-xl leading-none">+</span>
            Crear la primera
          </button>
        </div>

        <!-- Con cuentas, pero filtros sin resultados -->
        <div
          v-else-if="deudasFiltradas.length === 0"
          class="servi-adapt-bg rounded-xl p-10 text-center shadow-sm border border-gray-100"
        >
          <p class="servi-grey-font text-lg font-bold">No hay resultados con esos filtros.</p>
          <p class="servi-grey-font">Prueba cambiando el estado o el orden.</p>
          <button
            @click="limpiarFiltros"
            class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg servi-yellow servi-grey-font font-bold shadow-sm hover:opacity-90"
          >
            Limpiar filtros
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- Listado -->
        <div v-else>
          <div class="hidden md:block servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="servi-blue servi-yellow-font text-xs uppercase tracking-wider border-b border-gray-100">
                  <th class="p-4 font-semibold">Deuda</th>
                  <th class="p-4 font-semibold">Estado</th>
                  <th class="p-4 font-semibold text-center">Notificación</th>
                  <th class="p-4 font-semibold text-center">Creación</th>
                  <th class="p-4 font-semibold text-center">Acción</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-gray-800">
                <tr
                  v-for="item in deudasFiltradas"
                  :key="item.id"
                  class="hover:opacity-80 cursor-pointer"
                  @click="verDetalle(item.id)"
                >
                  <td class="p-4">
                    <div class="font-bold">{{ item.nombre }}</div>
                    <div class="text-xs servi-grey-font">#{{ item.id }}</div>
                  </td>

                  <td class="p-4">
                    <span :style="{ backgroundColor: estadoUI(item).bg, color: estadoUI(item).fg }"
                      class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-sm">
                      {{ estadoUI(item).label }}
                    </span>
                  </td>

                  <td class="p-4 text-center">
                    <span v-if="(item.estado || '').toLowerCase() === 'pendiente' && item.notificar_cada > 0"
                      class="text-sm font-semibold">
                      🔔 Cada {{ item.notificar_cada }} días
                    </span>
                    <span v-else class="servi-grey-font">—</span>
                  </td>

                  <td class="p-4 text-center text-sm servi-grey-font">
                    {{ formatearFecha(item.created_at) }}
                  </td>

                  <td class="p-4 text-center">
                    <RouterLink
                      :to="{ name: 'ver-deuda', params: { id: item.id } }"
                      @click.stop
                      class="inline-flex servi-adapt-bg servi-grey-font p-2 rounded-full transition-transform hover:scale-110 shadow-sm"
                      aria-label="Ver detalle"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                        stroke="currentColor"
                        class="size-5"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="md:hidden">
            <div
              v-for="item in deudasFiltradas"
              :key="item.id"
              class="servi-adapt-bg mx-2 servi-grey-font card-shadow p-3 mb-3 flex flex-col gap-2 overflow-hidden transition-all hover:shadow-md"
              role="button"
              tabindex="0"
              @click="verDetalle(item.id)"
            >
              <div class="flex justify-between items-start border-b border-gray-100 pb-2">
                <div class="flex flex-col min-w-0">
                  <span class="font-bold text-lg truncate">{{ item.nombre }}</span>
                  <span class="text-xs servi-grey-font">Creada: {{ formatearFecha(item.created_at) }}</span>
                </div>

                <span :style="{ backgroundColor: estadoUI(item).bg, color: estadoUI(item).fg }"
                  class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-sm">
                  {{ estadoUI(item).label }}
                </span>
              </div>

              <div class="flex justify-between items-center text-sm">
                <span class="servi-grey-font">Notificación:</span>
                <span
                  v-if="(item.estado || '').toLowerCase() === 'pendiente' && item.notificar_cada > 0"
                  class="font-semibold"
                >
                  🔔 Cada {{ item.notificar_cada }} días
                </span>
                <span v-else class="servi-grey-font">—</span>
              </div>

              <div class="flex mt-2 pt-2 border-t border-gray-100 items-center justify-between">
                <span class="servi-grey-font text-sm pl-1">Ver Detalles</span>
                <RouterLink
                  :to="{ name: 'ver-deuda', params: { id: item.id } }"
                  @click.stop
                  class="servi-blue servi-grey-font p-2 rounded-full transition-transform hover:scale-110 shadow-sm"
                  aria-label="Ver detalle"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    class="size-5"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-if="showModalCrear"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        class="servi-blue servi-yellow-font rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="px-6 py-4 border-b border-white/10">
          <h2 class="text-lg font-bold servi-yellow-font">Abrir Nueva Deuda</h2>
          <p class="text-sm text-white/80">Crea una deuda para agrupar OTs y registrar abonos.</p>
        </div>

        <div class="p-6">
          <label class="block text-sm font-medium mb-2">Nombre referencia</label>
          <input
            v-model="form.nombre"
            type="text"
            placeholder="Ej: Juan Pérez, Deuda Pepe, etc."
            class="w-full rounded-lg px-3 py-2.5 servi-yellow servi-grey-font font-bold"
          />
        </div>

        <div class="px-6 py-4 flex justify-end gap-3">
          <button @click="showModalCrear = false" class="px-4 py-2 text-sm font-medium servi-yellow servi-grey-font rounded-lg">
            Cancelar
          </button>

          <button
            @click="crearDeuda"
            :disabled="!form.nombre"
            class="px-4 py-2 text-sm font-bold servi-yellow servi-grey-font rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-shadow {
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
