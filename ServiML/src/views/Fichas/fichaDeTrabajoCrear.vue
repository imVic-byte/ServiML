<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabaseClient'
import navbar from "../../components/componentes/navbar.vue"
import volver from "../../components/componentes/volveraListaFicha.vue"
import modal from "../../components/componentes/modal.vue" // <-- IMPORTACIÓN AGREGADA
import { useInterfaz } from '@/stores/interfaz'

const router = useRouter()
const interfaz = useInterfaz()

// CORRECCIÓN: modalState bien escrito y ficha_id también
const modalState = ref({ visible: false, titulo: "", mensaje: "", exito: true });
const ficha_id = ref(null)

// 1. Variables del formulario
const nombre = ref("");
const apellido = ref("");
const telefono = ref("");
const correo = ref("");
const codigoPais = ref("56") 

const clienteSeleccionado = ref(null)
const tallerSeleccionado = ref('')
const motivoIngreso = ref('')
const origenIngreso = ref('cliente')
const fechaPromesa = ref('')
const loading = ref(false)

// 2. Variables del autocompletado
const talleres = ref([])
const clientesSugeridos = ref([])
const clienteAutocompletado = ref(false)
let clienteTimeout = null

// 3. Carga inicial
const cargarDatosBase = async () => {
  interfaz.showLoading()
  try {
    const { data: dataTalleres } = await supabase.from('serviml_taller').select('id, nombre')
    talleres.value = dataTalleres || []
  } catch (error) {
    console.error("Error al cargar datos:", error)
  } finally {
    interfaz.hideLoading()
  }
}

// 4. Lógica del autocompletado de clientes
const buscarClientes = (e) => {
  clienteSeleccionado.value = null 
  
  const texto = e.target.value.trim()
  if (clienteTimeout) clearTimeout(clienteTimeout)
  if (texto.length < 2) {
    clientesSugeridos.value = []
    return
  }
  clienteTimeout = setTimeout(async () => {
    const { data } = await supabase
      .from('cliente')
      .select('id, nombre, apellido, telefono, email')
      .ilike('nombre', `%${texto}%`)
      .limit(8)
    if (data) clientesSugeridos.value = data
  }, 300)
}

const abrirClienteAutocompletado = () => { clienteAutocompletado.value = true }

const cerrarClienteAutocompletado = () => {
  setTimeout(() => { clienteAutocompletado.value = false }, 150)
}

const seleccionarCliente = (cliente) => {
  nombre.value = cliente.nombre
  apellido.value = cliente.apellido
  telefono.value = cliente.telefono || ""
  correo.value = cliente.email || ""
  clienteSeleccionado.value = cliente.id
  clienteAutocompletado.value = false
  clientesSugeridos.value = []
}

const redirigir = () => {
  if (modalState.value.exito && ficha_id.value) {
    router.push({ name: 'ficha-de-trabajo', params: { id: ficha_id.value } });
  } else {
    modalState.value.visible = false;
  }
};

// 5. Función principal para guardar
const guardarNuevaFicha = async () => {
  if (!nombre.value || !apellido.value) {
    modalState.value = { visible: true, titulo: "Datos incompletos", mensaje: "Por favor ingresa el nombre y apellido del cliente.", exito: false };
    return
  }
  if (!tallerSeleccionado.value || !motivoIngreso.value) {
    modalState.value = { visible: true, titulo: "Datos incompletos", mensaje: "Por favor completa el Taller y el Motivo de Ingreso.", exito: false };
    return
  }

  loading.value = true
  interfaz.showLoadingOverlay()
  
  try {
    let idDelClienteFinal = clienteSeleccionado.value;
    if (!idDelClienteFinal) {
      const { data: nuevoCliente, error: errCliente } = await supabase
        .from('cliente')
        .insert({
          nombre: nombre.value.trim(),
          apellido: apellido.value.trim(),
          telefono: telefono.value.trim(),
          email: correo.value.trim(),
          codigo_pais: codigoPais.value
        })
        .select('id')
        .single()

      if (errCliente) throw new Error("Error al registrar el nuevo cliente: " + errCliente.message)
      idDelClienteFinal = nuevoCliente.id
    }

    const { data, error } = await supabase
      .from('ficha_de_trabajo')
      .insert({
        id_cliente: idDelClienteFinal,
        id_taller: tallerSeleccionado.value,
        motivo_ingreso: motivoIngreso.value,
        origen_ingreso: origenIngreso.value,
        fecha_promesa: fechaPromesa.value || null,
        estado: 1
      })
      .select()
      .single()

    if (error) throw error

    ficha_id.value = data.id;
    modalState.value = { visible: true, titulo: "¡Éxito!", mensaje: "Ficha creada correctamente.", exito: true };
    
  } catch (err) {
    console.error(err)
    modalState.value = { visible: true, titulo: "Error", mensaje: err.message || "Ocurrió un error al intentar crear la ficha.", exito: false };
  } finally {
    loading.value = false
    interfaz.hideLoadingOverlay()
  }
}

onMounted(() => {
  cargarDatosBase()
})
</script>

<template>
  <div class="servi-white min-h-screen font-sans">
    <navbar titulo="ServiML" subtitulo="Nueva Ficha de Trabajo" class="navbar sticky top-0 z-50 shadow-sm" />

    <div class="mx-auto p-4 max-w-7xl pb-28 pt-8">
      <volver />
        
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 rounded-lg mt-4">

        <div class="lg:col-span-7 space-y-12 servi-adapt-bg rounded-xl">

          <section>
            <h2 class="text-2xl w-full servi-blue servi-yellow-font border-b-2 border-yellow-400 rounded-t-lg p-2 inline-block pb-1 mb-6">
              Cliente
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-3">
              
              <div class="group relative">
                <label class="block text-xs font-bold servi-grey-font uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Nombre *</label>
                <input v-model="nombre" type="text"
                  class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none text-lg transition-colors"
                  placeholder="Juan" 
                  @input="buscarClientes"
                  @focus="abrirClienteAutocompletado"
                  @blur="cerrarClienteAutocompletado"
                  autocomplete="off" />
                
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
                <label class="block text-xs font-bold servi-grey-font uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Apellido *</label>
                <input v-model="apellido" type="text"
                  class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none text-lg transition-colors"
                  placeholder="Perez" />
              </div>

              <div class="group">
                <label class="block text-xs font-bold servi-grey-font uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Teléfono</label>
                <div class="flex items-center gap-4">
                  <div class="relative w-[110px]">
                    <select v-model="codigoPais"
                      class="w-full py-2 pl-2 pr-8 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none text-lg text-left cursor-pointer appearance-none">
                      <option value="56">+56</option>
                      <option value="54">+54</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                  <input v-model="telefono" type="text" inputmode="numeric" maxlength="12"
                    class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none text-lg transition-colors"
                    placeholder="912345678" />
                </div>
              </div>

              <div class="group">
                <label class="block text-xs font-bold servi-grey-font uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Correo Electrónico</label>
                <input v-model="correo" type="email"
                  class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none text-lg transition-colors"
                  placeholder="ejemplo@correo.com" />
              </div>
            </div>
          </section>

          <section>
            <h2 class="text-2xl w-full font-light servi-blue servi-yellow-font border-b-2 border-yellow-400 rounded-t-lg p-2 inline-block pb-1 mb-6">
              Motivo de Ingreso
            </h2>
            <div class="px-3 pb-8">
              <div class="group">
                <label class="block text-xs font-bold servi-grey-font uppercase tracking-wide mb-1 transition-colors group-focus-within:text-blue-800">Diagnóstico / Descripción detallada *</label>
                <textarea v-model="motivoIngreso" rows="4"
                  class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none resize-none transition-colors"
                  placeholder="Describe el problema o motivo por el que ingresa el vehículo..."></textarea>
              </div>
            </div>
          </section>

        </div>

        <div class="lg:col-span-5 relative">
          <div class="servi-adapt-bg shadow-xl sticky top-24 rounded-xl">
            <h2 class="text-2xl w-full font-light servi-blue servi-yellow-font border-b-2 border-yellow-400 rounded-t-lg p-2 inline-block pb-1 mb-6">
              Detalles del Ingreso
            </h2>
            
            <div class="space-y-6 mb-8 px-6">
              
              <div class="group">
                <label class="block text-xs font-bold servi-grey-font uppercase tracking-wide mb-1">Taller *</label>
                <div class="relative">
                  <select v-model="tallerSeleccionado" class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none text-base transition-colors appearance-none cursor-pointer">
                    <option value="" disabled selected>Seleccione un taller...</option>
                    <option v-for="t in talleres" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div class="group">
                <label class="block text-xs font-bold servi-grey-font uppercase tracking-wide mb-1">Origen Ingreso</label>
                <div class="relative">
                  <select v-model="origenIngreso" class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none text-base transition-colors appearance-none cursor-pointer">
                    <option value="cliente">Conducido por Cliente</option>
                    <option value="grua">Grúa / Remolque</option>
                    <option value="tercero">Chofer / Tercero</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div class="group">
                <label class="block text-xs font-bold servi-grey-font uppercase tracking-wide mb-1">Fecha Promesa (Opcional)</label>
                <input type="date" v-model="fechaPromesa" class="w-full py-2 servi-adapt-bg servi-grey-font border-b border-gray-100 focus:border-blue-900 focus:outline-none text-base transition-colors cursor-pointer" />
              </div>

            </div>

            <button @click="guardarNuevaFicha"
              class="w-full servi-blue servi-yellow-font text-sm font-bold py-4 px-4 rounded-b-lg hover:bg-blue-800 transition-all flex justify-center items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              :disabled="loading">
              <span v-if="loading">Procesando...</span>
              <span v-else>CREAR FICHA</span>
              <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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