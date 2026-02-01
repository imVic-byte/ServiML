<script setup>
import { ref, computed} from "vue";
import navbar from "../../components/componentes/navbar.vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import inputRut from "../../components/componentes/inputRut.vue";
import modal from "../../components/componentes/modal.vue";
import cargando2 from "../../components/componentes/cargando2.vue";
const router = useRouter();
const patente = ref("");
const tipoPresupuesto = ref("Simple");
const diagnostico = ref("");
const descuento = ref(0);
const incremento = ref(0);
const cliente = ref("");
const contacto = ref("");
const correo = ref("");
const items = ref([]);
const ivaPorcentaje = ref(0);
const ivaBoolean = ref(true);
const rut = ref("");
const rutValido = ref(true);
const loading = ref(false);
const checkRut = (valido) => {
  rutValido.value = valido;
};

const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true });


const redirigir = () => {
  if (modalState.value.exito) {
    router.push({ name: "listado-presupuestos" });
  } else {
    modalState.value.visible = false;
  }
};
const agregarItem = () => items.value.push({ descripcion: "", monto: 0 });
const eliminarItem = (index) => items.value.splice(index, 1);

const totales = computed(() => {
  const subtotal = items.value.reduce(
    (acc, item) => acc + (Number(item.monto) || 0),
    0
  );

  let dsc = tipoPresupuesto.value === "Simple" ? 0 : descuento.value;
  let inc = tipoPresupuesto.value === "Simple" ? 0 : incremento.value;

  const total_neto = subtotal - dsc + inc;

  let pctIva = 0;
  if (tipoPresupuesto.value === "Simple") {
    pctIva = ivaBoolean.value ? 19 : 0;
  } else {
    pctIva = ivaPorcentaje.value;
  }

  const iva = total_neto * (pctIva / 100);
  const total_final = total_neto + iva;

  return {
    subtotal,
    descuento: dsc,
    incremento: inc,
    total_neto,
    iva,
    total_final,
  };
});

const formatearMoneda = (valor) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(valor);
};

const validarFormulario = () => {
  if (!patente.value || patente.value.trim() === "" || patente.value.length > 7) {
    modalState.value = {
      visible: true,
      titulo: "Faltan datos",
      mensaje: "Debes ingresar una patente válida del vehículo.",
      exito: false,
    };
    return false;
  }
  if (!correo.value || correo.value.trim() === "") {
    modalState.value = {
      visible: true,
      titulo: "Faltan datos",
      mensaje: "Debes ingresar el correo del cliente.",
      exito: false,
    };
    return false;
  }
  if (!cliente.value || cliente.value.trim() === "") {
    modalState.value = {
      visible: true,
      titulo: "Faltan datos",
      mensaje: "Debes ingresar el nombre del cliente.",
      exito: false,
    };
    return false;
  }

  if (items.value.length === 0) {
    modalState.value = {
      visible: true,
      titulo: "Presupuesto vacío",
      mensaje: "Debes agregar al menos un ítem o repuesto al detalle.",
      exito: false,
    };
    return false;
  }

  if (tipoPresupuesto.value === "Detallado") {
    if (!rut.value || !rutValido.value) {
      modalState.value = {
        visible: true,
        titulo: "RUT Inválido",
        mensaje:
          "El RUT ingresado no es correcto. Verifica el dígito verificador.",
        exito: false,
      };
      return false;
    };
    if (!contacto.value || contacto.value.length < 7) {
    modalState.value = {
      visible: true,
      titulo: "Faltan datos",
      mensaje: "Debes ingresar el contacto del cliente.",
      exito: false,
    };  
    return false;
  };
  }

  return true;
};
const enviarFormulario = async () => {
  if (!validarFormulario()) return;
  loading.value = true;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Sesión expirada");

    const { data, error } = await supabase.functions.invoke(
      "crear-presupuesto",
      {
        body: {
          patente: patente.value,
          cliente: cliente.value,
          rut: rut.value,
          contacto: contacto.value,
          email: correo.value,
          diagnostico: diagnostico.value,
          ...totales.value,
          detalles: items.value,
        },
      }
    );
    loading.value = false;
    modalState.value = {
      visible: true,
      titulo: "¡Éxito!",
      mensaje: "El presupuesto ha sido guardado correctamente.",
      exito: true,
    };
  } catch (err) {
    loading.value = false;
    modalState.value = {
      visible: true,
      titulo: "Error",
      mensaje: "No se pudo guardar el presupuesto.",
      exito: false,
    };
  }
};
</script>
<template>
  <navbar titulo="ServiML" subtitulo="Crear Presupuesto" />

  <div class="pb-28 mx-auto p-4 max-w-lg">
    <div
      class="flex items-center justify-center gap-2 my-4 bg-gray-100 p-1 rounded-lg font-bold"
    >
      <button
        v-for="tipo in ['Simple', 'Detallado']"
        :key="tipo"
        @click="tipoPresupuesto = tipo"
        class="flex-1 px-4 py-2 rounded-full transition-all font-medium text-sm"
        :class="tipoPresupuesto === tipo ? 'activo shadow-sm' : 'text-gray-500'"
      >
        {{ tipo }}
      </button>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
      <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
        >Patente</label
      >
      <input
        v-model="patente"
        type="text"
        placeholder="ABCD-12"
        class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200"
      />

      <div>
        <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
          >Cliente</label
        >
        <input
          v-model="cliente"
          type="text"
          placeholder="Nombre cliente"
          class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200"
        />
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
          >Correo</label
        >
        <input
          v-model="correo"
          type="email"
          placeholder="Correo cliente"
          class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200"
        />
      </div>
      <inputRut
        v-model="rut"
        v-if="tipoPresupuesto === 'Detallado'"
        @check-rut="checkRut"
      />
      <div v-if="tipoPresupuesto === 'Detallado'">
        <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
          >Contacto</label
        >
        <input
          v-model="contacto"
          type="number"
          placeholder="9 9999 9999"
          min="0"
          max="999999999"
          class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200"
        />
      </div>

      <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
        >Diagnóstico</label
      >
      <textarea
        v-model="diagnostico"
        rows="2"
        class="w-full p-2 border border-gray-100 rounded-lg bg-gray-200"
      ></textarea>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <h3 class="text-sm font-bold text-gray-700 mb-3">Ítems y Repuestos</h3>
      <div v-for="(item, index) in items" :key="index" class="flex gap-2 mb-2">
        <input
          v-model="item.descripcion"
          type="text"
          class="flex-1 p-2 bg-gray-200 rounded-lg text-sm"
          placeholder="Repuesto/Servicio"
        />
        <input
          v-model.number="item.monto"
          type="number"
          class="w-24 p-2 bg-gray-200 rounded-lg text-right text-sm"
        />
        <button @click="eliminarItem(index)" class="text-red-400 px-1">
          ✕
        </button>
      </div>
      <button
        @click="agregarItem"
        class="servi-blue rounded-lg py-1 px-2 servi-yellow-font text-sm"
      >
        + Agregar ítem
      </button>
    </div>

    <div
      v-if="tipoPresupuesto === 'Simple'"
      class="bg-blue-50 rounded-xl p-6 text-center border border-blue-100"
    >
      <div class="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          @click="ivaBoolean = true"
          :class="ivaBoolean ? 'activo' : ''"
          class="flex-1 py-1 rounded-full text-xs"
        >
          Con IVA
        </button>
        <button
          @click="ivaBoolean = false"
          :class="!ivaBoolean ? 'activo' : ''"
          class="flex-1 py-1 rounded-full text-xs"
        >
          Sin IVA
        </button>
      </div>
      <p class="text-3xl font-bold servi-blue-font">
        {{ formatearMoneda(totales.total_final) }}
      </p>
    </div>

    <div
      v-else
      class="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
    >
      <div class="flex justify-between mb-2 text-sm">
        <span>Subtotal Neto</span
        ><span>{{ formatearMoneda(totales.subtotal) }}</span>
      </div>
      <div class="flex justify-between mb-2 text-sm">
        <span>Descuento (-)</span
        ><input
          v-model.number="descuento"
          type="number"
          class="w-20 bg-gray-200 text-right"
        />
      </div>
      <div class="flex justify-between mb-2 text-sm">
        <span>Incremento (+)</span
        ><input
          v-model.number="incremento"
          type="number"
          class="w-20 bg-gray-200 text-right"
        />
      </div>
      <div class="flex justify-between mb-3 text-sm">
        <span>IVA (%)</span
        ><input
          v-model.number="ivaPorcentaje"
          type="number"
          class="w-20 bg-gray-200 text-right"
        />
      </div>
      <div class="flex justify-between pt-3 border-t font-bold">
        <span>TOTAL</span
        ><span class="text-xl text-blue-900">{{
          formatearMoneda(totales.total_final)
        }}</span>
      </div>
    </div>

    <button
      @click="enviarFormulario"
      :disabled="!rutValido && tipoPresupuesto === 'Detallado'"
      class="w-full mt-6 servi-blue servi-yellow-font py-3 rounded-lg font-bold"
    >
      Guardar Presupuesto
    </button>
    <cargando2 v-if="loading" />
    <modal v-if="modalState.visible" :titulo="modalState.titulo" :mensaje="modalState.mensaje" :exito="modalState.exito" @cerrar="redirigir" />
  </div>
</template>
<style scoped>
.activo {
  background-color: #1f3d64;
  color: #d8b462;
}
</style>