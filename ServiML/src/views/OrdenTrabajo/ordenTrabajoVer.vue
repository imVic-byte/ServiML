<script setup>
import { ref, onMounted, watch } from "vue";
import { supabase } from "../../lib/supabaseClient.js";
import { useRoute, useRouter } from "vue-router";
import navbar from "../../components/componentes/navbar.vue";
import modal from "../../components/componentes/modal.vue";
import medidorCombustible from "../../components/ordenTrabajo/medidorCombustible.vue"; 
import {subirFotos} from "../../js/subirFotos.js";
import { useInterfaz } from "@/stores/interfaz.js";

const hoy = new Date()
  .toLocaleString('sv-SE')
  .replace('T', ' ');

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr.replace(' ', 'T'));
  if (isNaN(fecha)) return 'Fecha inválida';
  return fecha.toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const isCerrado = ref(false);
const sinEmpleado = ref(false);
const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true });
const redirigir = () => { modalState.value.visible = false; };
const interfaz = useInterfaz();
const route = useRoute();
const router = useRouter();
const orden = ref({});
const loading = ref(true)
const listaFotos = ref([]);
const estados = ref([]);
const showModal = ref(false);
const showSecondModal = ref(false);
const showThirdModal = ref(false);
const selectedEstado = ref(null);
const observaciones = ref([]);
const fechaIngreso = ref(null);
const nivelCombustible = ref(0);
const fotosRecepcion = ref([]);

const activarInput = (index, tipo) => {
  const id = tipo === 'camara' ? `input-camara-${index}` : `input-galeria-${index}`;
  const inputElement = document.getElementById(id);
  if (inputElement) inputElement.click();
};

const activarInputRecepcion = (tipo) => {
  const id = tipo === 'camara' ? 'input-camara-recepcion' : 'input-galeria-recepcion';
  const inputElement = document.getElementById(id);
  if (inputElement) inputElement.click();
};

const procesarFotos = (event, index) => {
  const files = event.target.files;
  if (!files.length) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const previewUrl = URL.createObjectURL(file);
    observaciones.value[index].fotos.push({
      file: file,
      url: previewUrl,
      nombre: file.name
    });
  }
  event.target.value = '';
};

const removerFotoObservacion = (obsIndex, fotoIndex) => {
  if (verificarEstadoCerrado()) return;
  observaciones.value[obsIndex].fotos.splice(fotoIndex, 1);
};

const procesarFotosRecepcion = (event) => {
  const files = event.target.files;
  if (!files.length) return;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    fotosRecepcion.value.push({
      file: file,
      url: URL.createObjectURL(file),
      nombre: file.name,
      isNew: true
    });
  }
  event.target.value = '';
};

const removerFotoRecepcion = (index) => {
  if (verificarEstadoCerrado()) return;
  fotosRecepcion.value.splice(index, 1);
};

const redirigirInformeFinal = () => {
  router.push({ name: 'ver-informe-final', params: { id: orden.value.id } });
};

const manejarBloqueo = (estado) => {
  loading.value = estado;
};

const verificarEstadoCerrado = () => {
  if (isCerrado.value) {
    modalState.value = {
      visible: true,
      titulo: "Acción no permitida",
      mensaje: "Orden cerrada. No se permiten cambios.",
      exito: false,
    };
    return true;
  }
}

const agregarObservacion = () => {
  if (verificarEstadoCerrado()) return;
  observaciones.value.push({
    id: Date.now(),
    texto: "",
    fecha: new Date().toISOString(),
    isNew: true,
    fotos: []
  });
};

const eliminarObservacion = (index) => {
  if (verificarEstadoCerrado()) return;
  observaciones.value.splice(index, 1);
};

const handleEnTaller = async () => {
  await supabase.from('vehiculos').update({
    en_taller: true
  }).eq('id', orden.value.vehiculo_id);
}

const handleNoEnTaller = async () => {
  await supabase.from('vehiculos').update({
    en_taller: false
  }).eq('id', orden.value.vehiculo_id);
}

const guardarCambios = async () => {
  if (verificarEstadoCerrado()) return;
  manejarBloqueo(true);
  interfaz.showLoadingOverlay();
  const { error } = await supabase
    .from("orden_trabajo")
    .update({
      kilometraje_inicial: orden.value.kilometraje_inicial,
      combustible_inicial: nivelCombustible.value,
      fecha_ingreso: orden.value.fecha_ingreso,
      prioridad: orden.value.prioridad,
      tipo_trabajo: orden.value.tipo_trabajo,
      origen_ingreso: orden.value.origen_ingreso,
      diagnostico: orden.value.diagnostico,
      trae_documentos: orden.value.trae_documentos,
      trae_llaves: orden.value.trae_llaves,
      trae_candado_seguridad: orden.value.trae_candado_seguridad,
      trae_panel_radio: orden.value.trae_panel_radio,
      trae_rueda_repuesto: orden.value.trae_rueda_repuesto,
      trae_encendedor: orden.value.trae_encendedor
    })
    .eq("id", route.params.id);

  for (const obs of observaciones.value) {
    if (obs.isNew) {
      const { data: obsData, error: obsError } = await supabase
        .from("OT_bitacora")
        .insert({
          ot_id: route.params.id,
          tipo_evento: "observacion",
          observacion: obs.texto,
        })
        .select()
        .single();
      if (obsError) {
        console.error("Error guardando observación:", obsError);
        continue; 
      }
      if (obs.fotos && obs.fotos.length > 0 && obsData) {
        const resultado = await subirFotos(obsData.id, orden.value.presupuesto.numero_folio, obs.fotos);
       if (!resultado.exito) {
          console.error("Error subiendo fotos:", resultado.error);
        }
        else {
          console.log("Fotos subidas correctamente");
        }
      }
      else {
        console.log("No hay fotos para subir");
      }
    }
  }
  const fotosNuevas = fotosRecepcion.value.filter(f => f.isNew);
  if (fotosNuevas.length > 0) {
    const WORKER_URL = 'https://upload.soporte-serviml.workers.dev/';
    const registros = [];
    for (const foto of fotosNuevas) {
      const archivoReal = foto.file || foto;
      const nombreLimpio = archivoReal.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const formData = new FormData();
      const nombreUnico = `OT-${orden.value.presupuesto.numero_folio}-recepcion-${Date.now()}-${nombreLimpio}`;
      formData.append('file', archivoReal, nombreUnico);
      formData.append('numero_folio', orden.value.presupuesto.numero_folio);
      try {
        const res = await fetch(WORKER_URL, { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          registros.push({ url: data.url, id_OT: route.params.id });
        }
      } catch (e) {
        console.error('Error subiendo foto de recepción:', e);
      }
    }
    if (registros.length > 0) {
      const { error: errorFotos } = await supabase.from('OT_fotos_ingreso').insert(registros);
      if (errorFotos) console.error('Error guardando fotos de recepción:', errorFotos);
    }
  }

  modalState.value = {
    visible: true,
    titulo: error ? "Error" : "¡Éxito!",
    mensaje: error
      ? "Hubo un error al guardar los cambios."
      : "Los cambios se han guardado correctamente.",
    exito: !error,
  };
  
  if(!error) {
     await traerObservaciones();
     await traerFotosRecepcion();
     interfaz.hideLoadingOverlay();
  }
  manejarBloqueo(false);
};

const traerObservaciones = async () => {
  const { data } = await supabase
    .from("OT_bitacora")
    .select("*")
    .eq("ot_id", route.params.id)
    .eq("tipo_evento", "observacion")
    .order("created_at", { ascending: true });
  if (data) {
    observaciones.value = data.map((obs) => ({
      id: obs.id,
      texto: obs.observacion,
      fecha: obs.created_at,
      isNew: false,
      fotos: []
    }));
    for (const obs of observaciones.value) {
      const { data } = await supabase
        .from("OT_Fotos")
        .select("*")
        .eq("id_OT_bitacora", obs.id);
      if (data) {
        obs.fotos = data;
      }
    }
  }
  interfaz.hideLoading();
};

const traerFotosRecepcion = async () => {
  const { data } = await supabase
    .from('OT_fotos_ingreso')
    .select('*')
    .eq('id_OT', route.params.id);
  if (data) {
    fotosRecepcion.value = data.map(f => ({
      url: f.url,
      isNew: false
    }));
  }
};

const handleIsCerrado = async (estado_actual_id) => {
  const { data } = await supabase
    .from('tabla_estados')
    .select('*')
    .eq('id', estado_actual_id);
  if (data && data.length > 0) {
    isCerrado.value = data[0].finaliza;
  }
}

const obtenerOrden = async () => {
  manejarBloqueo(true);
  const { data } = await supabase
    .from("orden_trabajo")
    .select("*, presupuesto(*), vehiculo(*), cliente(*), trabajadores(*)")
    .eq("id", route.params.id)
    .single();
  if (data) {
    orden.value = data;
    fechaIngreso.value = formatearFecha(data.fecha_ingreso);
    nivelCombustible.value = data.combustible_inicial ?? 0;
  }
  manejarBloqueo(false);
  await handleIsCerrado(orden.value.estado_actual_id);
};

const obtenerEstados = async () => {
  const { data } = await supabase
    .from("tabla_estados")
    .select("*")
    .order("orden");
  if (data) {
    estados.value = data;
  }
};
const openModal = (estado) => {
  selectedEstado.value = estado;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  showSecondModal.value = false;
  showThirdModal.value = false;
  selectedEstado.value = null;
};

const verificarCambioEstado = (estado_id) => {
  if (estado_id === orden.value.estado_actual_id) return false;
  if (estado_id === 1) return false;
  if (estado_id === 11 && orden.value.fecha_ingreso !== null) return false;
  if (verificarEstadoCerrado()) return false;
  const estado_actual = estados.value.find((estado) => estado.id === orden.value.estado_actual_id);
  const estado_nuevo = estados.value.find((estado) => estado.id === estado_id);
  if (estado_nuevo.orden < estado_actual.orden) return false;
  return true;
}

const confirmarCambioEstado = () => {
  if (!verificarCambioEstado(selectedEstado.value.id)) return;
  if (selectedEstado.value) {
    if (selectedEstado.value.id === 7 || selectedEstado.value.id === 8) {
      showModal.value = false;
      showSecondModal.value = true;
      return;
    }
    if (selectedEstado.value.id === 6) {
      showThirdModal.value = true;
      return;
    }
    if(selectedEstado.value.id === 11) {
      handleEnTaller();
    }
    if (selectedEstado.value.id === 7 || selectedEstado.value.id === 8) {
      handleNoEnTaller();
    }
    ejecutarCambioReal();
  }
};

const handleGenerarInformeFinal = async () => {
  const d = new Date();
  const fechaActual = new Date(
    d.getTime() - d.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 19);
  const { data, error } = await supabase.from("informe_final").insert({
    ot_id: orden.value.id,
    created_at: fechaActual
  }).select().single();
  if (error) return;

  router.push({
    name: 'ver-informe-final',
    params: { id: orden.value.id },
    query: { enviar: 'true' }
  });
};

const ejecutarCambioReal = async () => {
  manejarBloqueo(true);
  
  let updateData = {
    estado_actual_id: selectedEstado.value.id
  };

  const d = new Date();
  const fechaActual = new Date(
    d.getTime() - d.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 19);

  if (selectedEstado.value.id === 9) { 
    updateData.fecha_estacionamiento = fechaActual;
    updateData.fecha_termino_estacionamiento = null;
  } 

  else if (orden.value.fecha_estacionamiento && !orden.value.fecha_termino_estacionamiento) {
    updateData.fecha_termino_estacionamiento = fechaActual;
  }

  const { error: errorBitacora } = await supabase.from("OT_bitacora").insert({
    ot_id: route.params.id,
    nuevo_estado_id: selectedEstado.value.id,
    tipo_evento: "cambio_estado",
  });

  if (errorBitacora) {
    console.error(error);
  } else {
    orden.value.estado_actual_id = selectedEstado.value.id;
    const { error: errorUpdate } = await supabase
    .from("orden_trabajo")
    .update(updateData)
    .eq("id", route.params.id);
    if (errorUpdate) {
    console.error("Error al actualizar estado en OT:", errorUpdate);
    alert("Hubo un error al actualizar el estado de la orden.");
    return;
    }
    if (updateData.fecha_estacionamiento) {
        orden.value.fecha_estacionamiento = updateData.fecha_estacionamiento;
    }
    if (updateData.fecha_termino_estacionamiento) {
        orden.value.fecha_termino_estacionamiento = updateData.fecha_termino_estacionamiento;
    }
    await handleIsCerrado(selectedEstado.value.id);
    
    if (selectedEstado.value.id === 6) {
      await handleGenerarInformeFinal();
    }
    if (selectedEstado.value.id == 11) {
      fechaIngreso.value = formatearFecha(hoy);
      await supabase.from('orden_trabajo').update({ 'fecha_ingreso': hoy }).eq('id', route.params.id);
    }
  }
  closeModal();
  manejarBloqueo(false);
}


onMounted(async () => {
  interfaz.showLoading();
  await obtenerOrden();
  if (!orden.value.id_empleado) {
    sinEmpleado.value = true;
    interfaz.hideLoading();
    setTimeout(() => {
      router.push({ name: 'ordenes-de-trabajo' });
    }, 3000);
    return;
  }
  obtenerEstados();
  traerObservaciones();
  traerFotosRecepcion();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-12">
    <navbar titulo="ServiML" :subtitulo="'OT No. ' + orden.presupuesto?.numero_folio" class="sticky top-0 z-40" searchInput="false" />
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-15">
      
      <div v-if="isCerrado" class="mb-6 p-4 bg-blue-100 border-l-4 border-blue-600 text-blue-800 rounded shadow-sm flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="font-bold">La orden de trabajo está cerrada. Modo solo lectura.</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 overflow-x-auto">
        <div class="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-2 min-w-max md:min-w-0">
          <div v-for="estado in estados" :key="estado.id" class="flex flex-col items-center group">
            <div v-if="estado.id !== 1" @click="verificarCambioEstado(estado.id) ? openModal(estado) : null"
              class="relative px-6 py-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              :class="{ 'opacity-50 hover:opacity-100': estado.id !== orden.estado_actual_id }">
              <div class="absolute inset-0 transform -skew-x-12 rounded shadow-sm" :style="{ backgroundColor: estado.color }"></div>
              <span class="relative z-10 font-bold text-white text-sm whitespace-nowrap">{{ estado.estado }}</span>
            </div>
            <div v-if="estado.id === orden.estado_actual_id" class="mt-2 text-blue-600 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div class="lg:col-span-2 space-y-6">
          
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="servi-blue px-6 py-4 flex justify-between items-center">
              <h1 class="servi-yellow-font font-bold text-lg tracking-wide">INFORMACIÓN GENERAL</h1>
            </div>
            <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1"><label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Patente</label><p>{{ orden.vehiculo?.patente }}</p></div>
              <div class="space-y-1"><label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Modelo</label><p>{{ orden.vehiculo?.marca }} {{ orden.vehiculo?.modelo }}</p></div>
              <div class="space-y-1"><label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</label><p>{{ orden.cliente?.nombre + ' ' + orden.cliente?.apellido }}</p></div>
              <div class="space-y-1"><label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</label><p>+{{ orden.cliente?.codigo_pais }} {{ orden.cliente?.telefono }}</p></div>
              <div class="space-y-1"><label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label><p>{{ orden.cliente?.email || 'No registrado' }}</p></div>
              <div class="space-y-1"><label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Motivo de Ingreso</label><p>{{ orden.motivo_ingreso }}</p></div>
              <div class="space-y-1"><label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Responsable</label><p>{{ orden.trabajadores?.nombre ? orden.trabajadores?.nombre + ' ' + orden.trabajadores?.apellido : 'No asignado' }}</p></div>
              <div class="space-y-1"><label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha de Ingreso</label><p>{{ fechaIngreso || 'No registrado' }}</p></div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="servi-blue px-6 py-4 flex justify-between items-center">
              <h1 class="servi-yellow-font font-bold text-lg tracking-wide">DATOS DE RECEPCIÓN</h1>
            </div>

            <div class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div class="flex flex-col gap-5">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha de Ingreso</label>
                    <input class="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium" type="datetime-local" v-model="orden.fecha_ingreso" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Prioridad</label>
                    <select class="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium" v-model="orden.prioridad">
                      <option value="1">Alta (Urgencia)</option>
                      <option value="2">Media (Normal)</option>
                      <option value="3">Baja (Proyecto)</option>
                    </select>
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-1 gap-4">
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Origen Ingreso</label>
                    <select class="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium" v-model="orden.origen_ingreso">
                      <option value="cliente">Conducido por Cliente</option>
                      <option value="grua">Grúa / Remolque</option>
                      <option value="tercero">Chofer / Tercero</option>
                    </select>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo de Trabajo</label>
                    <input class="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium" type="text" placeholder="Ej: Mantención 10.000km" v-model="orden.tipo_trabajo" />
                  </div>
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Kilometraje Actual</label>
                  <div class="relative">
                    <input class="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium pl-4" type="number" v-model="orden.kilometraje_inicial" />
                    <span class="absolute right-4 top-2.5 text-gray-400 text-sm font-bold">KM</span>
                  </div>
                </div>
                <div class="space-y-1 flex-row">
                  <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Diagnóstico Inicial</label>
                  <textarea class="w-full h-32 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 font-medium resize-none" placeholder="Describa el problema encontrado" v-model="orden.diagnostico"></textarea>
                </div>
              </div>

              <div class="flex flex-col gap-6">
                <div class="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label class="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                    <span>Nivel de Combustible</span>
                  </label>
                  <medidorCombustible v-model="nivelCombustible" />
                </div>
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Inventario Rápido</label>
                  <div class="grid grid-cols-2 gap-3">
                    <label class="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded-lg border hover:border-blue-400 transition-colors">
                      <input type="checkbox" v-model="orden.trae_documentos" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                      <span class="text-sm font-medium text-gray-700">Documentos</span>
                    </label>
                    <label class="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded-lg border hover:border-blue-400 transition-colors">
                      <input type="checkbox" v-model="orden.trae_llaves" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                      <span class="text-sm font-medium text-gray-700">Llaves</span>
                    </label>
                    <label class="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded-lg border hover:border-blue-400 transition-colors">
                      <input type="checkbox" v-model="orden.trae_candado_seguridad" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                      <span class="text-xs font-medium text-gray-700">Tuerca Seguridad</span>
                    </label>
                    <label class="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded-lg border hover:border-blue-400 transition-colors">
                      <input type="checkbox" v-model="orden.trae_panel_radio" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                      <span class="text-sm font-medium text-gray-700">Panel Radio</span>
                    </label>
                    <label class="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded-lg border hover:border-blue-400 transition-colors">
                      <input type="checkbox" v-model="orden.trae_rueda_repuesto" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                      <span class="text-sm font-medium text-gray-700">Rueda Repuesto</span>
                    </label>
                    <label class="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded-lg border hover:border-blue-400 transition-colors">
                      <input type="checkbox" v-model="orden.trae_encendedor" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                      <span class="text-sm font-medium text-gray-700">Encendedor</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- FOTOS DE RECEPCIÓN -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="servi-blue px-6 py-4 flex justify-between items-center">
              <h3 class="servi-yellow-font font-bold text-lg tracking-wide uppercase">Fotos de Recepción</h3>
            </div>

            <div class="p-6">
              <!-- Upload buttons -->
              <div class="flex gap-3 mb-5">
                <input 
                  type="file" 
                  id="input-camara-recepcion" 
                  class="hidden" 
                  accept="image/*" 
                  capture="environment"
                  @change="(e) => procesarFotosRecepcion(e)"
                />
                <input 
                  type="file" 
                  id="input-galeria-recepcion" 
                  class="hidden" 
                  accept="image/*" 
                  multiple
                  @change="(e) => procesarFotosRecepcion(e)"
                />

                <button 
                  @click="activarInputRecepcion('camara')"
                  class="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                  title="Tomar foto ahora"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Cámara
                </button>

                <button 
                  @click="activarInputRecepcion('galeria')"
                  class="flex items-center gap-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-lg transition-colors border border-gray-300 cursor-pointer"
                  title="Seleccionar de galería"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Galería
                </button>
              </div>

              <!-- Photo grid -->
              <div v-if="fotosRecepcion && fotosRecepcion.length > 0" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                <div v-for="(foto, fIndex) in fotosRecepcion" :key="fIndex" class="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group shadow-sm hover:shadow-md transition-shadow">
                  <img :src="foto.url" class="w-full h-full object-cover" />
                  <button @click="removerFotoRecepcion(fIndex)" class="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Empty state -->
              <div v-else class="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-sm font-medium">No hay fotos de recepción</p>
                <p class="text-xs mt-1">Use los botones de arriba para agregar fotos</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="servi-blue px-6 py-4 flex justify-between items-center">
              <h3 class="servi-yellow-font font-bold text-lg tracking-wide uppercase">Bitácora de Observaciones</h3>
              <button @click="agregarObservacion" class="servi-yellow text-blue-900 font-bold p-2 rounded-full shadow-md transition-all transform hover:scale-105" title="Agregar Observación">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div class="p-6 bg-gray-50 min-h-[200px] max-h-[500px] overflow-y-auto">
              <div v-if="observaciones.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p class="text-sm">No hay observaciones registradas</p>
              </div>

              <div class="space-y-4">
                <div v-for="(observacion, index) in observaciones" :key="observacion.id" class="flex gap-4 group">
                  <div class="flex-shrink-0 mt-1">
                    <div class="w-8 h-8 rounded-full servi-blue flex items-center justify-center text-yellow-400 font-bold text-xs">
                      {{ index + 1 }}
                    </div>
                  </div>
                  <div class="flex-grow">
                    <div class="relative bg-white border border-gray-200 p-4 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm hover:shadow-md transition-shadow">
                      <div class="flex justify-between items-start mb-2">
                        <span class="text-xs text-gray-400 font-semibold">{{ new Date(observacion.fecha).toLocaleDateString() }}</span>
                        <button v-if="observacion.isNew" @click="eliminarObservacion(index)" class="text-red-400 hover:text-red-600">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <textarea v-model="observacion.texto" placeholder="Escriba los detalles aquí..." class="w-full text-gray-700 bg-transparent border-0 p-0 focus:ring-0 resize-none text-sm leading-relaxed mb-3" rows="2"></textarea>
                      
                      <div class="flex flex-col gap-3 mt-2 border-t pt-2 border-gray-100">
                        <div v-if="observacion.fotos && observacion.fotos.length > 0" class="flex flex-wrap gap-2">
                          <div v-for="(foto, fIndex) in observacion.fotos" :key="fIndex" class="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group/foto">
                            <img :src="foto.url" class="w-full h-full object-cover" />
                            <button @click="removerFotoObservacion(index, fIndex)" class="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg opacity-0 group-hover/foto:opacity-100 transition-opacity">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div v-if="observacion.isNew" class="flex gap-2 mt-2">
  
  <input 
    type="file" 
    :id="`input-camara-${index}`" 
    class="hidden" 
    accept="image/*" 
    capture="environment"
    @change="(e) => procesarFotos(e, index)"
  />
  
  <input 
    type="file" 
    :id="`input-galeria-${index}`" 
    class="hidden" 
    accept="image/*" 
    multiple
    @change="(e) => procesarFotos(e, index)"
  />
  
  <button 
    @click="activarInput(index, 'camara')"
    class="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors border border-blue-200"
    title="Tomar foto ahora"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    Cámara
  </button>

  <button 
    @click="activarInput(index, 'galeria')"
    class="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors border border-gray-300"
    title="Seleccionar de galería"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    Galería
  </button>

</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Acciones</h3>
            <div class="flex flex-col gap-3">
              <button @click="guardarCambios()" class="w-full servi-yellow servi-blue-font py-3 px-4 rounded-lg font-bold shadow-sm hover:opacity-90 transition-opacity flex justify-center items-center gap-2 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Guardar Todo
              </button>

              <button v-if="!loading" @click="redirigirInformeFinal" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-bold shadow-sm hover:bg-blue-700 transition-colors flex justify-center items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Ver Informe Final
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/60 backdrop-blur-sm">
      <div class="bg-white servi-blue-font rounded-lg p-6 max-w-sm w-full shadow-2xl">
        <h3 class="text-xl font-bold servi-blue-font mb-2">Confirmar cambio</h3>
        <p class="text-gray-600 text-sm mb-6">¿Confirmas cambiar el estado a <span class="font-bold servi-blue-font">"{{ selectedEstado?.estado }}"</span>?</p>
        <div class="flex justify-end gap-3">
          <button @click="closeModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium">Cancelar</button>
          <button @click="confirmarCambioEstado()" class="px-4 py-2 servi-blue text-white rounded-md font-bold hover:bg-blue-700">Confirmar</button>
        </div>
      </div>
    </div>

    <div v-if="showSecondModal" class="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-md">
      <div class="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl border-l-4 border-red-600">
        <div class="flex items-center gap-2 mb-4">
          <div class="p-2 bg-red-100 rounded-full text-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
          <h3 class="text-xl font-bold text-gray-900">Finalizar Orden</h3>
        </div>
        <p class="text-gray-600 text-sm mb-6">Estás a punto de cerrar esta orden permanentemente.</p>
        <div class="flex justify-end gap-3">
          <button @click="closeModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium">Cancelar</button>
          <button @click="ejecutarCambioReal()" class="px-4 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700">Sí, Finalizar</button>
        </div>
      </div>
    </div>

    <div v-if="showThirdModal" class="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-md">
      <div class="bg-white servi-blue-font rounded-lg p-6 max-w-sm w-full shadow-2xl border-l-4 border-red-600">
        <div class="flex items-center gap-2 mb-4">
           <div class="p-2 bg-red-100 rounded-full text-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
          <h3 class="text-xl font-bold text-gray-900">Generar Informe</h3>
        </div>
        <p class="text-gray-600 text-sm mb-6">Esto cambiará el estado a "{{ selectedEstado?.estado }}", generará el PDF y lo enviará al cliente.</p>
        <div class="flex justify-end gap-3">
          <button @click="closeModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium">Cancelar</button>
          <button @click="ejecutarCambioReal()" class="px-4 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700">Sí, Generar</button>
        </div>
      </div>
    </div>

    <modal v-if="modalState.visible" :titulo="modalState.titulo" :mensaje="modalState.mensaje" :exito="modalState.exito" @cerrar="redirigir" />

    <!-- Modal sin empleado asignado -->
    <div v-if="sinEmpleado" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
        <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">Orden sin empleado asignado</h3>
        <p class="text-sm text-gray-500 mb-4">Esta orden de trabajo no tiene un empleado asignado. Serás redirigido al listado de órdenes.</p>
        <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500 mx-auto mb-2"></div>
        <p class="text-xs text-gray-400">Redirigiendo...</p>
      </div>
    </div>
  </div>
</template>