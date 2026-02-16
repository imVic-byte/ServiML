<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '../../stores/user.js';
import { useRouter } from 'vue-router';
import navbar from '../../components/componentes/navbar.vue';
import { useInterfaz } from '@/stores/interfaz.js';
import { supabase } from '../../lib/supabaseClient.js';

const userStore = useUserStore();
const router = useRouter();
const interfaz = useInterfaz();

const formulario = reactive({
  nombre: '',
  apellido: '',
  rut: '',
  email: '',
  telefono: '',
  rol: 'Trabajador'
});

const estado = reactive({
  cargando: false,
  mensaje: '',
  tipo: ''
});

const errores = reactive({
  nombre: '',
  apellido: '',
  rut: '',
  email: '',
  telefono: ''
});

const validarRut = ref(true);
const mostrarModal = ref(false);

// --- Helpers ---

const toCamelCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-záéíóúñü\s]/gi, '')
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatearRut = (rut) => {
  let valor = rut.replace(/[^0-9kK]/g, '');
  if (valor.length < 2) return valor;
  const cuerpo = valor.slice(0, -1);
  const dv = valor.slice(-1).toUpperCase();
  let cuerpoFormateado = '';
  let count = 0;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    cuerpoFormateado = cuerpo[i] + cuerpoFormateado;
    count++;
    if (count === 3 && i !== 0) {
      cuerpoFormateado = '.' + cuerpoFormateado;
      count = 0;
    }
  }
  return `${cuerpoFormateado}-${dv}`;
};

const validarDigitoRut = (rut) => {
  const limpio = rut.replace(/[.\-]/g, '');
  if (limpio.length < 2) return false;
  const cuerpo = limpio.slice(0, -1);
  const dvIngresado = limpio.slice(-1).toUpperCase();
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = suma % 11;
  let dvEsperado;
  if (resto === 0) dvEsperado = '0';
  else if (resto === 1) dvEsperado = 'K';
  else dvEsperado = String(11 - resto);
  return dvIngresado === dvEsperado;
};

const onRutInput = () => {
  formulario.rut = formatearRut(formulario.rut);
  errores.rut = '';
};

const validarEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validarFormulario = () => {
  let valido = true;
  Object.keys(errores).forEach(k => errores[k] = '');

  if (!formulario.nombre.trim()) {
    errores.nombre = 'El nombre es obligatorio.';
    valido = false;
  }
  if (!formulario.apellido.trim()) {
    errores.apellido = 'El apellido es obligatorio.';
    valido = false;
  }
  const rutLimpio = formulario.rut.replace(/[.\-]/g, '');
  if (!rutLimpio) {
    errores.rut = 'El RUT es obligatorio.';
    valido = false;
  } else if (validarRut.value && !validarDigitoRut(formulario.rut)) {
    errores.rut = 'El RUT ingresado no es válido.';
    valido = false;
  }
  if (!formulario.email.trim()) {
    errores.email = 'El email es obligatorio.';
    valido = false;
  } else if (!validarEmail(formulario.email)) {
    errores.email = 'El formato del email no es válido.';
    valido = false;
  }
  if (!formulario.telefono.trim()) {
    errores.telefono = 'El teléfono es obligatorio.';
    valido = false;
  }
  return valido;
};

const gestionarInvitacion = async () => {
  if (!validarFormulario()) return;

  // Format before sending
  formulario.nombre = toCamelCase(formulario.nombre);
  formulario.apellido = toCamelCase(formulario.apellido);
  formulario.rut = formatearRut(formulario.rut);

  estado.cargando = true;
  estado.mensaje = '';
  estado.tipo = '';

  try {
    const { error } = await supabase.functions.invoke('invitar-usuario', { body: { ...formulario } });

    if (error) throw error;

    estado.mensaje = '¡Invitación enviada correctamente! El trabajador recibirá un correo para activar su cuenta.';
    estado.tipo = 'success';
    mostrarModal.value = true;

    Object.assign(formulario, {
      nombre: '',
      apellido: '',
      rut: '',
      email: '',
      telefono: '',
      rol: 'Trabajador'
    });
  } catch (error) {
    estado.mensaje = `Error: ${error.message}`;
    estado.tipo = 'error';
    mostrarModal.value = true;
  } finally {
    estado.cargando = false;
  }
};

const cerrarModal = () => {
  mostrarModal.value = false;
  if (estado.tipo === 'success') {
    router.push('/gestion-usuarios');
  }
};

const volver = () => {
  router.back();
};

onMounted(async () => {
  interfaz.showLoading();
  await new Promise(resolve => setTimeout(resolve, 500));
  interfaz.hideLoading();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-40">
    <navbar class="navbar" titulo="Invitar Trabajador" subtitulo="Creación y gestión de usuarios"></navbar>
    
    <div class="max-w-2xl mx-auto mt-6 px-4 sm:px-0 sm:mt-10">
      
      <button 
        @click="volver"
        class="mb-6 flex items-center text-sm font-bold text-[#1f3d64] hover:text-[#D8B462] transition-colors py-2 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4 mr-2 transition-transform group-hover:-translate-x-1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Volver a la lista
      </button>

      <div class="servi-adapt-bg rounded-2xl shadow-2xl overflow-hidden">
        
        <div class="servi-blue p-8 sm:p-10 text-center relative border-b-4 border-[#D8B462]">
          <h2 class="text-2xl sm:text-3xl font-extrabold servi-yellow-font tracking-tight">Registrar Nuevo Trabajador</h2>
          <p class="text-white opacity-90 text-base mt-3 max-w-lg mx-auto leading-relaxed">
            Completa los datos a continuación para enviar una invitación oficial al sistema.
          </p>
          <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D8B462] to-transparent opacity-50"></div>
        </div>
        
        <form @submit.prevent="gestionarInvitacion" class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-10">
          
          <!-- Nombre -->
          <div class="space-y-2 group">
            <label class="block text-sm font-bold text-gray-600 transition-colors group-focus-within:text-[#1f3d64]">Nombre</label>
            <input 
              v-model="formulario.nombre" 
              type="text" 
              class="w-full border-2 rounded-xl p-3.5 focus:border-[#D8B462] focus:ring-0 focus:bg-[#fffdf5] transition-all outline-none text-base text-[#1f3d64] font-medium"
              :class="errores.nombre ? 'border-red-400' : 'border-gray-200'"
            />
            <p v-if="errores.nombre" class="text-red-500 text-xs font-medium">{{ errores.nombre }}</p>
          </div>

          <!-- Apellido -->
          <div class="space-y-2 group">
            <label class="block text-sm font-bold text-gray-600 transition-colors group-focus-within:text-[#1f3d64]">Apellido</label>
            <input 
              v-model="formulario.apellido" 
              type="text" 
              class="w-full border-2 rounded-xl p-3.5 focus:border-[#D8B462] focus:ring-0 focus:bg-[#fffdf5] transition-all outline-none text-base text-[#1f3d64] font-medium"
              :class="errores.apellido ? 'border-red-400' : 'border-gray-200'"
            />
            <p v-if="errores.apellido" class="text-red-500 text-xs font-medium">{{ errores.apellido }}</p>
          </div>

          <!-- RUT -->
          <div class="space-y-2 group">
            <label class="block text-sm font-bold text-gray-600 transition-colors group-focus-within:text-[#1f3d64]">RUT</label>
            <input 
              v-model="formulario.rut" 
              @input="onRutInput"
              type="text" 
              placeholder="12.345.678-9"
              maxlength="12"
              class="w-full border-2 rounded-xl p-3.5 focus:border-[#D8B462] focus:ring-0 focus:bg-[#fffdf5] transition-all outline-none text-base text-[#1f3d64] font-medium placeholder-gray-300"
              :class="errores.rut ? 'border-red-400' : 'border-gray-200'"
            />
            <p v-if="errores.rut" class="text-red-500 text-xs font-medium">{{ errores.rut }}</p>
            <label class="flex items-center gap-2 mt-1 cursor-pointer select-none">
              <input type="checkbox" v-model="validarRut" class="w-4 h-4 rounded border-gray-300 text-[#1f3d64] focus:ring-[#D8B462] cursor-pointer accent-[#1f3d64]" />
              <span class="text-xs text-gray-500">Validar dígito verificador</span>
            </label>
          </div>

          <!-- Teléfono -->
          <div class="space-y-2 group">
            <label class="block text-sm font-bold text-gray-600 transition-colors group-focus-within:text-[#1f3d64]">Teléfono</label>
            <input 
              v-model="formulario.telefono" 
              type="tel" 
              class="w-full border-2 rounded-xl p-3.5 focus:border-[#D8B462] focus:ring-0 focus:bg-[#fffdf5] transition-all outline-none text-base text-[#1f3d64] font-medium"
              :class="errores.telefono ? 'border-red-400' : 'border-gray-200'"
            />
            <p v-if="errores.telefono" class="text-red-500 text-xs font-medium">{{ errores.telefono }}</p>
          </div>

          <!-- Email -->
          <div class="md:col-span-2 space-y-2 group">
            <label class="block text-sm font-bold text-gray-600 transition-colors group-focus-within:text-[#1f3d64]">Email Corporativo</label>
            <input 
              v-model="formulario.email" 
              type="email" 
              class="w-full border-2 rounded-xl p-3.5 focus:border-[#D8B462] focus:ring-0 focus:bg-[#fffdf5] transition-all outline-none text-base text-[#1f3d64] font-medium"
              :class="errores.email ? 'border-red-400' : 'border-gray-200'"
            />
            <p v-if="errores.email" class="text-red-500 text-xs font-medium">{{ errores.email }}</p>
          </div>

          <!-- Rol -->
          <div class="md:col-span-2 space-y-2 group">
            <label class="block text-sm font-bold text-gray-600 transition-colors group-focus-within:text-[#1f3d64]">Rol asignado</label>
            <div class="relative">
              <select 
                v-model="formulario.rol" 
                class="w-full border-2 border-gray-200 rounded-xl p-3.5 servi-adapt-bg focus:border-[#D8B462] focus:ring-0 focus:bg-[#fffdf5] transition-all outline-none cursor-pointer appearance-none text-base text-[#1f3d64] font-medium"
              >
                <option value="Trabajador">Trabajador</option>
                <option value="Administrador">Administrador</option>
                <option value="Gerente">Gerente</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#1f3d64]">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Submit -->
          <div class="md:col-span-2 mt-6">
            <button 
              type="submit" 
              :disabled="estado.cargando"
              class="w-full servi-blue servi-yellow-font font-extrabold py-4 rounded-xl hover:bg-[#152a45] hover:shadow-lg transform active:scale-98 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-3 text-lg cursor-pointer"
            >
              <svg v-if="estado.cargando" class="animate-spin h-6 w-6 text-[#D8B462]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ estado.cargando ? 'Procesando Invitación...' : 'Registrar e Invitar Ahora' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal resultado -->
    <div v-if="mostrarModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="servi-adapt-bg rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div class="p-6 text-center">
          <!-- Icono -->
          <div 
            class="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
            :class="estado.tipo === 'success' ? 'bg-green-100' : 'bg-red-100'"
          >
            <svg v-if="estado.tipo === 'success'" class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 class="text-lg font-bold servi-blue-font mb-2">
            {{ estado.tipo === 'success' ? '¡Invitación Enviada!' : 'Ocurrió un Error' }}
          </h3>
          <p class="text-sm text-gray-500 leading-relaxed">{{ estado.mensaje }}</p>
        </div>
        <div class="p-4 flex justify-center border-t border-gray-100">
          <button 
            @click="cerrarModal"
            class="w-full py-3 rounded-xl font-bold transition-transform active:scale-95 servi-blue servi-yellow-font cursor-pointer"
          >
            {{ estado.tipo === 'success' ? 'Volver a la lista' : 'Cerrar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>