<script setup>
import { ref, computed, onMounted } from "vue";
import navbar from "../../components/componentes/navbar.vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabaseClient.js";
import modal from "../../components/componentes/modal.vue";
import cargando2 from "../../components/componentes/cargando2.vue";
const router = useRouter();

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
const items = ref([]);
const ivaBoolean = ref(true);

const alertaEmail = ref(true);
const presupuesto_id = ref(null);
const loading = ref(false);


const agregarItem = () => items.value.push({ descripcion: "", monto: "" });
const eliminarItem = (index) => items.value.splice(index, 1);


const validarFormulario = () => {
  if (!patente.value || patente.value.trim() === "" || patente.value.length > 7 || patente.value.length < 6) {
    modalState.value = {
      visible: true,
      titulo: "Faltan datos",
      mensaje: "Debes ingresar una patente válida del vehículo.",
      exito: false,
    };
    return false;
  }
  if (!modelo.value || modelo.value.trim() === "") {
    modalState.value = {
      visible: true,
      titulo: "Faltan datos",
      mensaje: "Debes ingresar el modelo del vehículo.",
      exito: false,
    };
    return false;
  }
  if (!marca.value || marca.value.trim() === "") {
    modalState.value = {
      visible: true,
      titulo: "Faltan datos",
      mensaje: "Debes ingresar la marca del vehículo.",
      exito: false,
    };
    return false;
  }
  if (!nombre.value || nombre.value.trim() === "") {
    modalState.value = {
      visible: true,
      titulo: "Faltan datos",
      mensaje: "Debes ingresar el nombre del cliente.",
      exito: false,
    };
    return false;
  }
  if (!apellido.value || apellido.value.trim() === "") {
    modalState.value = {
      visible: true,
      titulo: "Faltan datos",
      mensaje: "Debes ingresar el apellido del cliente.",
      exito: false,
    };
    return false;
  }
  if (!telefono.value) {
    modalState.value = {
      visible: true,
      titulo: "Faltan datos",
      mensaje: "Debes ingresar el teléfono del cliente.",
      exito: false,
    };
    return false;
  }
  if (!diagnostico.value || diagnostico.value.trim() === "") {
    modalState.value = {
      visible: true,
      titulo: "Faltan datos",
      mensaje: "Debes ingresar el diagnóstico del vehículo.",
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
  for (let i = 0; i < items.value.length; i++) {
    if (!items.value[i].descripcion || items.value[i].descripcion.trim() === "") {
      modalState.value = {
        visible: true,
        titulo: "Faltan datos",
        mensaje: "Debes ingresar la descripción del ítem.",
        exito: false,
      };
      return false;
    }
    if (!items.value[i].monto) {
      modalState.value = {
        visible: true,
        titulo: "Faltan datos",
        mensaje: "Debes ingresar el monto del ítem.",
        exito: false,
      };
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
  }).format(valor);
};

const totales = computed(() => {
  const subtotal = items.value.reduce(
    (acc, item) => acc + (Number(item.monto) || 0),
    0
  );

  let dsc = descuentoPorcentaje.value;
  if (!dsc || dsc === "") {
    dsc = 0;
  }
  const total_neto = subtotal - (subtotal * (dsc / 100));
  let pctIva = ivaBoolean.value ? 19 : 0;

  const iva = total_neto * (pctIva / 100);
  const total_final = total_neto + iva;

  return {
    subtotal,
    descuento: dsc,
    total_neto,
    iva,
    total_final,
  };
});

const handleCorreo = () => {
  if (!correo.value && alertaEmail.value) {
    modalState.value = {
      visible: true,
      titulo: "Atención",
      mensaje: "¿Deseas continuar sin correo del cliente?",
      exito: false,
      
    };
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
  if (!validarFormulario()) return;
  if (alertaEmail.value) {
    handleCorreo();
    return;
  }
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
          detalles: items.value.map((item) => {
            return {
              descripcion: item.descripcion.toUpperCase(),
              monto: item.monto,
            };
          }),
        },
      }
    );
    loading.value = false;
    presupuesto_id.value = data.data.id;
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

const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true });


const redirigir = () => {
  if (modalState.value.exito) {
    router.push({ name: "ver-presupuesto", params: { id: presupuesto_id.value } });
  } else {
    modalState.value.visible = false;
  }
};

</script>
<template>
  <navbar titulo="ServiML" subtitulo="Crear Presupuesto" class="navbar"/>

  <div class="pb-28 mx-auto p-4 max-w-lg">

    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
      <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
        >Patente</label
      >
      <input
        v-model="patente"
        type="text"
        placeholder="ABC123"
        class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200 uppercase"
        @input="patente = patente.toUpperCase()"
        maxlength="7"
      />
      <div>
        <label for="modelo" class="block text-xs font-bold text-gray-500 uppercase mb-1">Modelo</label>
        <input v-model="modelo" type="text" placeholder="Modelo" class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200" />
      </div>
      <div>
        <label for="marca" class="block text-xs font-bold text-gray-500 uppercase mb-1">Marca</label>
        <input v-model="marca" type="text" placeholder="Marca" class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200" />
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
          >Nombre del Cliente</label
        >
        <input
          v-model="nombre"
          type="text"
          placeholder="Juan"
          class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200"
        />
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
          >Apellido del Cliente</label
        >
        <input
          v-model="apellido"
          type="text"
          placeholder="Perez"
          class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200"
        />
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
          >Teléfono</label
        >
        <div class="flex gap-2">
          <select name="prefijo" id="prefijo" class="w-24 p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200" v-model="codigoPais">
          <option value="+56">+56</option>
          <option value="+51">+51</option>
          <option value="+54">+54</option>
          <option value="+55">+55</option>
          <option value="+591">+591</option>
        </select>
        <input
          v-model="telefono"
          type="number"
          placeholder="9 9999 9999"
          min="0"
          max="999999999"
          maxlength="10"
          class="w-full p-2 border border-gray-100 rounded-lg mb-3 bg-gray-200"
        />
        </div>
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
      <div class="flex justify-between mb-2 text-sm">
        <span>Subtotal</span
        ><span>{{ formatearMoneda(totales.subtotal) }}</span>
      </div>
      <div class="flex justify-between mb-2 text-sm">
        <span>Descuento (%)</span
        ><input
          v-model.number="descuentoPorcentaje"
          type="number"
          class="w-20 bg-gray-200 text-right rounded-lg px-1"
          placeholder="0"
        />
      </div>
      <div class="flex justify-between mb-2 text-sm">
        <span>Total Neto</span
        ><span>{{ formatearMoneda(totales.total_neto) }}</span>
      </div>
      <p class="text-3xl font-bold servi-blue-font">
        {{ formatearMoneda(totales.total_final) }}
      </p>
    </div>

    <button
      @click="enviarFormulario"
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