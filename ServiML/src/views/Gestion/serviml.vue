<script setup>
import { ref, onMounted } from 'vue'
import navbar from '../../components/componentes/navbar.vue'
import { useInterfaz } from '../../stores/interfaz.js'
import { supabase } from '../../lib/supabaseClient.js'

const interfaz = useInterfaz()
const tabActiva = ref('empresa')
const tabs = [
  { id: 'empresa', label: 'Empresa', icon: 'building' },
  { id: 'talleres', label: 'Talleres', icon: 'wrench' },
  { id: 'servicios', label: 'Servicios', icon: 'cog' },
  { id: 'cuentas', label: 'Cuentas Bancarias', icon: 'bank' },
]

// ── Empresa ──
const empresa = ref({
  nombre_fantasia: '',
  razon_social: '',
  rut: '',
  giro: '',
  direccion: '',
  ciudad: '',
  region: '',
  web: '',
  telefonos: [
    { valor: '', prioritario: false },
  ],
  emails: [
    { valor: '', prioritario: false },
  ],
  
})
const editandoEmpresa = ref(false)
const empresaBackup = ref(null)

const iniciarEdicionEmpresa = () => {
  empresaBackup.value = JSON.parse(JSON.stringify(empresa.value))
  editandoEmpresa.value = true
}
const cancelarEdicionEmpresa = () => {
  empresa.value = JSON.parse(JSON.stringify(empresaBackup.value))
  editandoEmpresa.value = false
}

const setPrioritarioEmail = (index) => {
  empresa.value.emails.forEach((e, i) => e.prioritario = i === index)
}

const talleres = ref([])

const obtenerTalleres = async () => {
  const { data, error } = await supabase
    .from('serviml_taller')
    .select('*')
  if (error) {
    console.error('Error al obtener los talleres:', error)
    return
  }
  if (data && data.length > 0) {
    talleres.value = data.map(t => ({
      id: t.id,
      nombre: t.nombre,
      direccion: t.direccion,
      capacidad_maxima: t.capacidad_maxima,
      activo: t.activo,
      porcentaje: 0
    }))
    for (const taller of talleres.value) {
      const { data: otData } = await supabase
        .from('orden_trabajo')
        .select('*, vehiculo(*)')
        .eq('id_taller', taller.id)
      if (otData && otData.length > 0) {
        const enTaller = otData.filter(ot => ot.vehiculo?.en_taller).length
        taller.porcentaje = (enTaller / taller.capacidad_maxima) * 100
      }
    }
  }
}

const mostrarModalTaller = ref(false)
const tallerEditando = ref(null)
const nuevoTaller = ref({ nombre: '', direccion: '', capacidad_maxima: 10, activo: true })

const abrirModalTaller = (taller = null) => {
  if (taller) {
    tallerEditando.value = taller.id
    nuevoTaller.value = { ...taller }
  } else {
    tallerEditando.value = null
    nuevoTaller.value = { nombre: '', direccion: '', capacidad_maxima: 10, activo: true }
  }
  mostrarModalTaller.value = true
}
const cerrarModalTaller = () => {
  mostrarModalTaller.value = false
  tallerEditando.value = null
}
const guardarTaller = async () => {
  if (tallerEditando.value) {
    const index = talleres.value.findIndex(t => t.id === tallerEditando.value)
    if (index !== -1) talleres.value[index] = { ...nuevoTaller.value }
  } else {
    talleres.value.push({ ...nuevoTaller.value, id: Date.now() })
  }
  let taller={id:nuevoTaller.value.id,nombre:nuevoTaller.value.nombre,direccion:nuevoTaller.value.direccion,capacidad_maxima:nuevoTaller.value.capacidad_maxima,activo:nuevoTaller.value.activo}
  const { error } = await supabase
    .from('serviml_taller')
    .upsert(taller)
  if (error) {
    console.error('Error al guardar el taller:', error)
    return
  }
  cerrarModalTaller()
}
const eliminarTaller = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este taller?')) return
  const { error } = await supabase
    .from('serviml_taller')
    .delete()
    .eq('id', id)
  if (error) {
    console.error('Error al eliminar el taller:', error)
    return
  }
  talleres.value = talleres.value.filter(t => t.id !== id)
}

// ── Servicios ──
const servicios = ref([])
const mostrarModalServicio = ref(false)
const servicioEditando = ref(null)
const nuevoServicio = ref({ nombre: '', precio: 0, activo: true })

const obtenerServicios = async () => {
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .order('nombre', { ascending: true })
  if (error) {
    console.error('Error al obtener los servicios:', error)
    return
  }
  if (data && data.length > 0) {
    servicios.value = data.map(s => ({
      id: s.id,
      nombre: s.nombre,
      precio: s.precio,
      activo: s.activo
    }))
  }
}

const abrirModalServicio = (servicio = null) => {
  if (servicio) {
    servicioEditando.value = servicio.id
    nuevoServicio.value = { ...servicio }
  } else {
    servicioEditando.value = null
    nuevoServicio.value = { nombre: '', precio: 0, activo: true }
  }
  mostrarModalServicio.value = true
}
const cerrarModalServicio = () => {
  mostrarModalServicio.value = false
  servicioEditando.value = null
}
const guardarServicio = async () => {
  if (servicioEditando.value) {
    const index = servicios.value.findIndex(s => s.id === servicioEditando.value)
    if (index !== -1) servicios.value[index] = { ...nuevoServicio.value }
  } else {
    servicios.value.push({ ...nuevoServicio.value, id: Date.now() })
  }
  const { error } = await supabase
    .from('servicios')
    .upsert(nuevoServicio.value)
  if (error) {
    console.error('Error al guardar el servicio:', error)
    return
  }
  cerrarModalServicio()
}
const eliminarServicio = async (id) => {
  if (!confirm('¿Eliminar este servicio?')) return
  const { error } = await supabase
    .from('servicios')
    .delete()
    .eq('id', id)
  if (error) {
    console.error('Error al eliminar el servicio:', error)
    return
  }
  servicios.value = servicios.value.filter(s => s.id !== id)
}

// ── Cuentas Bancarias ──
const cuentas = ref([])
const mostrarModalCuenta = ref(false)
const cuentaEditando = ref(null)
const nuevaCuenta = ref({ banco: '', tipo_cuenta: 'Cuenta Corriente', numero_cuenta: '', titular: '', rut_titular: '' })
const bancos = [
  { "codigo": "001", "nombre": "Banco de Chile" },
  { "codigo": "009", "nombre": "Banco Internacional" },
  { "codigo": "012", "nombre": "Banco Estado" },
  { "codigo": "016", "nombre": "Banco de Crédito e Inversiones (BCI)" },
  { "codigo": "028", "nombre": "Banco BICE" },
  { "codigo": "031", "nombre": "Banco Santander Chile" },
  { "codigo": "037", "nombre": "Scotiabank Chile" },
  { "codigo": "039", "nombre": "Banco Itaú Chile" },
  { "codigo": "049", "nombre": "Banco Security" },
  { "codigo": "051", "nombre": "Banco Falabella" },
  { "codigo": "053", "nombre": "Banco Ripley" },
  { "codigo": "055", "nombre": "Banco Consorcio" }
]

const obtenerCuentas = async () => {
  const { data, error } = await supabase
    .from('serviml_cuenta')
    .select('*')
    .eq('id_serviml', 1)
    .order('banco', { ascending: true })
  if (error) {
    console.error('Error al obtener cuentas bancarias:', error)
    return
  }
  if (data) cuentas.value = data
}

const abrirModalCuenta = (cuenta = null) => {
  if (cuenta) {
    cuentaEditando.value = cuenta.id
    nuevaCuenta.value = { ...cuenta }
  } else {
    cuentaEditando.value = null
    nuevaCuenta.value = { banco: '', tipo_cuenta: 'Cuenta Corriente', numero_cuenta: '', titular: '', rut_titular: '' }
  }
  mostrarModalCuenta.value = true
}
const cerrarModalCuenta = () => {
  mostrarModalCuenta.value = false
  cuentaEditando.value = null
}
const guardarCuenta = async () => {
  const payload = {
    id_serviml: 1,
    banco: nuevaCuenta.value.banco,
    tipo_cuenta: nuevaCuenta.value.tipo_cuenta,
    numero_cuenta: nuevaCuenta.value.numero_cuenta,
    titular: nuevaCuenta.value.titular,
    rut_titular: nuevaCuenta.value.rut_titular,
  }
  if (cuentaEditando.value) payload.id = cuentaEditando.value
  const { error } = await supabase
    .from('serviml_cuenta')
    .upsert(payload)
  if (error) {
    console.error('Error al guardar cuenta bancaria:', error)
    return
  }
  await obtenerCuentas()
  cerrarModalCuenta()
}
const eliminarCuenta = async (id) => {
  if (!confirm('¿Eliminar esta cuenta bancaria?')) return
  const { error } = await supabase
    .from('serviml_cuenta')
    .delete()
    .eq('id', id)
  if (error) {
    console.error('Error al eliminar cuenta bancaria:', error)
    return
  }
  cuentas.value = cuentas.value.filter(c => c.id !== id)
}

const formatoMoneda = (valor) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(valor)
}

const obtenerDatosEmpresa = async () => {
  // Datos principales
  const { data, error } = await supabase
    .from('serviml')
    .select('*')
    .eq('id', 1)
  if (error) {
    console.error('Error al obtener los datos de la empresa:', error)
    return
  }
  if (data && data[0]) {
    const d = data[0]
    empresa.value.nombre_fantasia = d.nombre_fantasia || ''
    empresa.value.razon_social = d.razon_social || ''
    empresa.value.rut = d.rut || ''
    empresa.value.giro = d.giro || ''
    empresa.value.direccion = d.dirección || ''
    empresa.value.ciudad = d.ciudad || ''
    empresa.value.region = d.región || ''
    empresa.value.web = d.sitio_web || ''
  }

  // Emails
  const { data: emails } = await supabase
    .from('serviml_email')
    .select('*')
    .eq('id_serviml', 1)
  if (emails && emails.length > 0) {
    empresa.value.emails = emails.map(e => ({
      id: e.id,
      valor: e.email,
      prioritario: e.prioritario || false
    }))
  }

  // Teléfonos
  const { data: tels } = await supabase
    .from('serviml_telefono')
    .select('*')
    .eq('id_serviml', 1)
  if (tels && tels.length > 0) {
    empresa.value.telefonos = tels.map(t => ({
      id: t.id,
      valor: t.telefono,
      prioritario: t.prioritario || false
    }))
  }
}

const guardarEmpresa = async () => {
  editandoEmpresa.value = false
  const { data, error } = await supabase
    .from('serviml')
    .update({
        rut: empresa.value.rut,
        nombre_fantasia: empresa.value.nombre_fantasia,
        razon_social: empresa.value.razon_social,
        giro: empresa.value.giro,
        dirección: empresa.value.direccion,
        ciudad: empresa.value.ciudad,
        región: empresa.value.region,
        sitio_web: empresa.value.web
    })
    .eq('id', 1)
  if (error) {
    console.error('Error al guardar la empresa:', error)
  } else {
    await guardarEmails()
    await guardarTelefonos()
  }
}

const guardarEmails = async () => {
  // Borrar los existentes
  await supabase.from('serviml_email').delete().eq('id_serviml', 1)
  // Insertar los que tengan valor
  const emailsValidos = empresa.value.emails.filter(e => e.valor.trim() !== '')
  if (emailsValidos.length === 0) return
  const filas = emailsValidos.map(e => ({
    id_serviml: 1,
    email: e.valor,
    prioritario: e.prioritario
  }))
  const { error } = await supabase.from('serviml_email').insert(filas)
  if (error) console.error('Error al guardar los emails:', error)
}

const guardarTelefonos = async () => {
  // Borrar los existentes
  await supabase.from('serviml_telefono').delete().eq('id_serviml', 1)
  // Insertar los que tengan valor
  const telsValidos = empresa.value.telefonos.filter(t => t.valor.trim() !== '')
  if (telsValidos.length === 0) return
  const filas = telsValidos.map(t => ({
    id_serviml: 1,
    telefono: t.valor,
    prioritario: t.prioritario
  }))
  const { error } = await supabase.from('serviml_telefono').insert(filas)
  if (error) console.error('Error al guardar los telefonos:', error)
}

const agregarTelefono = () => {
  empresa.value.telefonos.push({ valor: '', prioritario: false })
}
const eliminarTelefono = async (index) => {
  const tel = empresa.value.telefonos[index]
  const era_prioritario = tel.prioritario
  // Si tiene id de BD, eliminar de Supabase
  if (tel.id) {
    const { error } = await supabase.from('serviml_telefono').delete().eq('id', tel.id)
    if (error) console.error('Error al eliminar el teléfono:', error)
  }
  empresa.value.telefonos.splice(index, 1)
  if (era_prioritario && empresa.value.telefonos.length > 0) {
    empresa.value.telefonos[0].prioritario = true
  }
}

const setPrioritarioTelefono = (index) => {
  empresa.value.telefonos.forEach((t, i) => t.prioritario = i === index)
}

// ── Emails ──
const agregarEmail = () => {
  empresa.value.emails.push({ valor: '', prioritario: false })
}
const eliminarEmail = async (index) => {
  const em = empresa.value.emails[index]
  const era_prioritario = em.prioritario
  // Si tiene id de BD, eliminar de Supabase
  if (em.id) {
    const { error } = await supabase.from('serviml_emails').delete().eq('id', em.id)
    if (error) console.error('Error al eliminar el email:', error)
  }
  empresa.value.emails.splice(index, 1)
  if (era_prioritario && empresa.value.emails.length > 0) {
    empresa.value.emails[0].prioritario = true
  }
}
onMounted(async () => {
  interfaz.showLoading()
  await obtenerTalleres()
  await obtenerDatosEmpresa()
  await obtenerServicios()
  await obtenerCuentas()
  interfaz.hideLoading()
})
</script>

<template>
  <div class="servi-white">
    <navbar class="navbar" titulo="ServiML" subtitulo="Gestión del Sistema" />

    <div class="servi-white min-h-screen pb-30">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 pt-4">

      <!-- Header -->
      <div class="mb-6 hidden sm:block">
        <h1 class="text-2xl font-bold servi-grey-font">Gestión ServiML</h1>
        <p class="text-sm servi-grey-font mt-1">Administra la configuración general de la empresa.</p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="tabActiva = tab.id"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer"
          :class="tabActiva === tab.id
            ? 'servi-blue servi-yellow-font shadow-md'
            : 'servi-adapt-bg servi-grey-font border border-gray-100 hover:opacity-80'"
        >
          <!-- Building icon -->
          <svg v-if="tab.icon === 'building'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <!-- Wrench icon -->
          <svg v-if="tab.icon === 'wrench'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <!-- Cog icon -->
          <svg v-if="tab.icon === 'cog'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <!-- Bank icon -->
          <svg v-if="tab.icon === 'bank'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
          </svg>
          <!-- Box icon -->
          <svg v-if="tab.icon === 'box'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {{ tab.label }}
        </button>
      </div>

      <!-- ═══════════════════ TAB: EMPRESA ═══════════════════ -->
      <div v-if="tabActiva === 'empresa'">
        <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <!-- Header de la tarjeta -->
          <div class="servi-blue p-5 flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="p-2.5 servi-adapt-bg/10 rounded-full text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-bold servi-yellow-font">Datos de la Empresa</h2>
                <p class="servi-grey-font text-sm">Información general y contacto</p>
              </div>
            </div>
            <button
              v-if="!editandoEmpresa"
              @click="iniciarEdicionEmpresa"
              class="px-4 py-2 servi-yellow servi-grey-font rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            >
              Editar
            </button>
          </div>
          <div class="p-6">
            <!-- Campos simples -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div v-for="(campo, key) in {
                nombre_fantasia: 'Nombre Comercial',
                razon_social: 'Razón Social',
                rut: 'RUT Empresa',
                giro: 'Giro',
                direccion: 'Dirección',
                ciudad: 'Ciudad',
                region: 'Región',
                web: 'Sitio Web'
              }" :key="key">
                <label class="block">
                  <span class="text-xs servi-grey-font uppercase font-bold tracking-wide">{{ campo }}</span>
                  <input
                    v-if="editandoEmpresa"
                    v-model="empresa[key]"
                    type="text"
                    class="mt-1 block w-full rounded-lg border border-gray-100 px-3 py-2.5 text-sm servi-blue servi-grey-font focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    :placeholder="campo"
                  />
                  <p v-else class="mt-1 servi-grey-font font-medium text-sm servi-blue rounded-lg px-3 py-2.5">
                    {{ empresa[key] || '—' }}
                  </p>
                </label>
              </div>
            </div>

            <!-- Teléfonos -->
            <div class="mt-6 pt-5 border-t border-gray-100">
              <div class="flex justify-between items-center mb-3">
                <span class="text-xs servi-grey-font uppercase font-bold tracking-wide">Teléfonos de Contacto</span>
                <button v-if="editandoEmpresa" @click="agregarTelefono" class="text-xs servi-grey-font font-semibold hover:underline cursor-pointer flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Agregar
                </button>
              </div>
              <div class="space-y-2">
                <div v-for="(tel, index) in empresa.telefonos" :key="'tel-'+index" class="flex items-center gap-2">
                  <button
                    @click="editandoEmpresa && setPrioritarioTelefono(index)"
                    class="flex-shrink-0 p-1 rounded-full transition"
                    :class="editandoEmpresa ? 'cursor-pointer hover:bg-yellow-50' : 'cursor-default'"
                    :title="tel.prioritario ? 'Prioritario' : 'Marcar como prioritario'"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="tel.prioritario ? 'text-yellow-500' : 'servi-grey-font'" :fill="tel.prioritario ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                  <div class="flex-1">
                    <input
                      v-if="editandoEmpresa"
                      v-model="tel.valor"
                      type="tel"
                      class="block w-full rounded-lg border border-gray-100 px-3 py-2.5 text-sm servi-blue servi-grey-font focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="+56 9 1234 5678"
                    />
                    <p v-else class="servi-grey-font font-medium text-sm servi-blue rounded-lg px-3 py-2.5">
                      {{ tel.valor || '—' }}
                    </p>
                  </div>
                  <span v-if="!editandoEmpresa && tel.prioritario" class="text-xs font-semibold servi-yellow servi-grey-font px-2 py-0.5 rounded-full whitespace-nowrap">Principal</span>
                  <button v-if="editandoEmpresa && empresa.telefonos.length > 1" @click="eliminarTelefono(index)" class="flex-shrink-0 p-1.5 servi-grey-font hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Emails -->
            <div class="mt-6 pt-5 border-t border-gray-100">
              <div class="flex justify-between items-center mb-3">
                <span class="text-xs servi-grey-font uppercase font-bold tracking-wide">Emails de Contacto</span>
                <button v-if="editandoEmpresa" @click="agregarEmail" class="text-xs servi-grey-font font-semibold hover:underline cursor-pointer flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Agregar
                </button>
              </div>
              <div class="space-y-2">
                <div v-for="(em, index) in empresa.emails" :key="'em-'+index" class="flex items-center gap-2">
                  <button
                    @click="editandoEmpresa && setPrioritarioEmail(index)"
                    class="flex-shrink-0 p-1 rounded-full transition"
                    :class="editandoEmpresa ? 'cursor-pointer hover:bg-yellow-50' : 'cursor-default'"
                    :title="em.prioritario ? 'Prioritario' : 'Marcar como prioritario'"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="em.prioritario ? 'text-yellow-500' : 'servi-grey-font'" :fill="em.prioritario ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                  <div class="flex-1">
                    <input
                      v-if="editandoEmpresa"
                      v-model="em.valor"
                      type="email"
                      class="block w-full rounded-lg border border-gray-100 px-3 py-2.5 text-sm servi-blue servi-grey-font focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="contacto@serviml.cl"
                    />
                    <p v-else class="servi-grey-font font-medium text-sm servi-blue rounded-lg px-3 py-2.5">
                      {{ em.valor || '—' }}
                    </p>
                  </div>
                  <span v-if="!editandoEmpresa && em.prioritario" class="text-xs font-semibold servi-yellow servi-grey-font px-2 py-0.5 rounded-full whitespace-nowrap">Principal</span>
                  <button v-if="editandoEmpresa && empresa.emails.length > 1" @click="eliminarEmail(index)" class="flex-shrink-0 p-1.5 servi-grey-font hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Botones de acción -->
            <div v-if="editandoEmpresa" class="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
              <button @click="cancelarEdicionEmpresa" class="px-5 py-2.5 servi-adapt-bg servi-grey-font rounded-lg text-sm font-semibold hover:opacity-80 transition cursor-pointer">
                Cancelar
              </button>
              <button @click="guardarEmpresa" class="px-5 py-2.5 servi-blue text-white rounded-lg text-sm font-semibold hover:opacity-90 transition cursor-pointer">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════ TAB: TALLERES ═══════════════════ -->
      <div v-if="tabActiva === 'talleres'">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-lg font-bold servi-grey-font">Talleres Registrados</h2>
            <p class="text-sm servi-grey-font">Gestiona los talleres y su capacidad</p>
          </div>
          <button @click="abrirModalTaller()" class="px-4 py-2.5 servi-yellow servi-grey-font rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90 transition flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Agregar
          </button>
        </div>

        <div class="space-y-4">
          <div v-for="taller in talleres" :key="taller.id"
            class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div class="p-5">
              <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                  <div class="p-2.5 rounded-full" :class="taller.activo ? 'bg-green-100 text-green-600' : 'servi-adapt-bg servi-grey-font'">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-bold servi-grey-font">{{ taller.nombre }}</h3>
                    <p class="text-sm servi-grey-font">{{ taller.direccion || 'Sin dirección' }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button @click="abrirModalTaller(taller)" class="p-2 servi-grey-font hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button @click="eliminarTaller(taller.id)" class="p-2 servi-grey-font hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <!-- Capacidad -->
              <div class="mt-4 flex items-center gap-4">
                <div class="flex-1">
                  <div class="flex justify-between mb-1">
                    <span class="text-xs servi-grey-font font-medium">Capacidad Máxima</span>
                    <span class="text-xs font-bold servi-grey-font">{{ taller.capacidad_maxima }} vehículos</span>
                  </div>
                  <div class="w-full servi-adapt-bg rounded-full h-2">
                    <div class="bg-green-500 h-2 rounded-full" :style="`width: ${(taller.porcentaje || 0).toFixed(1)}%`"></div>
                  </div>
                </div>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  :class="taller.activo ? 'bg-green-100 text-green-700' : 'servi-adapt-bg servi-grey-font'"
                >
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="taller.activo ? 'bg-green-400' : 'servi-grey-font'"></span>
                  {{ taller.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Taller vacío -->
        <div v-if="talleres.length === 0" class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto servi-grey-font mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
          </svg>
          <p class="servi-grey-font font-medium">No hay talleres registrados</p>
          <p class="text-sm servi-grey-font mt-1">Agrega tu primer taller para comenzar.</p>
        </div>
      </div>

      <!-- ═══════════════════ TAB: SERVICIOS ═══════════════════ -->
      <div v-if="tabActiva === 'servicios'">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-lg font-bold servi-grey-font">Catálogo de Servicios</h2>
            <p class="text-sm servi-grey-font">Define los servicios que ofrece tu taller</p>
          </div>
          <button @click="abrirModalServicio()" class="px-4 py-2.5 servi-yellow servi-grey-font rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90 transition flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Agregar
          </button>
        </div>

        <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-800">
              <thead class="servi-blue servi-yellow-font">
                <tr>
                  <th class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">Servicio</th>
                  <th class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">Precio</th>
                  <th class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">Estado</th>
                  <th class="px-6 py-3 text-right text-sm font-medium uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="servi-adapt-bg divide-y divide-gray-800">
                <tr v-for="servicio in servicios" :key="servicio.id" class="hover:opacity-80 transition-colors">
                  <td class="px-6 py-4 max-w-[200px]">
                    <div class="flex items-center gap-3">
                      <div class="p-2 bg-blue-100 text-blue-600 rounded-full shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span class="text-sm font-medium servi-grey-font truncate">{{ servicio.nombre }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold servi-grey-font">
                    {{ formatoMoneda(servicio.precio) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="servicio.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    >
                      <span class="w-1.5 h-1.5 mr-1.5 rounded-full" :class="servicio.activo ? 'bg-green-400' : 'bg-red-400'"></span>
                      {{ servicio.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="flex justify-end gap-1">
                      <button @click="abrirModalServicio(servicio)" class="p-2 servi-grey-font hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button @click="eliminarServicio(servicio.id)" class="p-2 servi-grey-font hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="servicios.length === 0" class="p-10 text-center">
            <p class="servi-grey-font font-medium">No hay servicios registrados</p>
          </div>
        </div>
      </div>

      <!-- ═══════════════════ TAB: CUENTAS BANCARIAS ═══════════════════ -->
      <div v-if="tabActiva === 'cuentas'">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-lg font-bold servi-grey-font">Cuentas Bancarias</h2>
            <p class="text-sm servi-grey-font">Administra las cuentas de la empresa</p>
          </div>
          <button @click="abrirModalCuenta()" class="px-4 py-2.5 servi-yellow servi-grey-font rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90 transition flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Agregar
          </button>
        </div>

        <div class="servi-adapt-bg rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-800 text-sm">
              <thead class="servi-blue servi-yellow-font">
                <tr>
                  <th class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">Banco</th>
                  <th class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">Tipo</th>
                  <th class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">N° Cuenta</th>
                  <th class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">Titular</th>
                  <th class="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">RUT</th>
                  <th class="px-6 py-3 text-right text-sm font-medium uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="servi-adapt-bg divide-y divide-gray-800">
                <tr v-for="cuenta in cuentas" :key="cuenta.id" class="hover:opacity-80 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                      <div class="p-2 bg-green-100 text-green-600 rounded-full shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
                        </svg>
                      </div>
                      <span class="font-medium servi-grey-font">{{ cuenta.banco }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap servi-grey-font">{{ cuenta.tipo_cuenta }}</td>
                  <td class="px-6 py-4 whitespace-nowrap font-mono servi-grey-font">{{ cuenta.numero_cuenta }}</td>
                  <td class="px-6 py-4 whitespace-nowrap servi-grey-font max-w-[150px] truncate">{{ cuenta.titular }}</td>
                  <td class="px-6 py-4 whitespace-nowrap servi-grey-font">{{ cuenta.rut_titular }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="flex justify-end gap-1">
                      <button @click="abrirModalCuenta(cuenta)" class="p-2 servi-grey-font hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button @click="eliminarCuenta(cuenta.id)" class="p-2 servi-grey-font hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="cuentas.length === 0" class="p-10 text-center">
            <p class="servi-grey-font font-medium">No hay cuentas bancarias registradas</p>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- ═══════════════════ MODAL TALLER ═══════════════════ -->
  <Teleport to="body">
    <div v-if="mostrarModalTaller" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarModalTaller"></div>
      <div class="relative servi-adapt-bg rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="servi-blue p-5">
          <h3 class="text-lg font-bold text-white">{{ tallerEditando ? 'Editar Taller' : 'Nuevo Taller' }}</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="text-xs servi-grey-font uppercase font-bold">Nombre del Taller</label>
            <input v-model="nuevoTaller.nombre" type="text" class="mt-1 block w-full rounded-lg border border-gray-100 px-3 servi-blue servi-grey-font py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: Taller Central" />
          </div>
          <div>
            <label class="text-xs servi-grey-font uppercase font-bold">Dirección</label>
            <input v-model="nuevoTaller.direccion" type="text" class="mt-1 block w-full rounded-lg border border-gray-100 px-3 servi-blue servi-grey-font py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Dirección del taller" />
          </div>
          <div>
            <label class="text-xs servi-grey-font uppercase font-bold">Capacidad Máxima (vehículos)</label>
            <input v-model.number="nuevoTaller.capacidad_maxima" type="number" min="1" class="mt-1 block w-full rounded-lg border servi-grey-font border-gray-100 px-3 servi-blue servi-grey-font py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div class="flex items-center gap-2">
            <input v-model="nuevoTaller.activo" type="checkbox" id="tallerActivo" class="rounded" />
            <label for="tallerActivo" class="text-sm servi-grey-font font-medium">Taller activo</label>
          </div>
        </div>
        <div class="px-6 pb-6 flex justify-end gap-3">
          <button @click="cerrarModalTaller" class="px-4 py-2.5 servi-adapt-bg servi-grey-font rounded-lg text-sm font-semibold hover:opacity-80 transition cursor-pointer">Cancelar</button>
          <button @click="guardarTaller" class="px-4 py-2.5 servi-yellow text-white rounded-lg text-sm font-semibold hover:opacity-90 transition cursor-pointer">Guardar</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══════════════════ MODAL SERVICIO ═══════════════════ -->
  <Teleport to="body">
    <div v-if="mostrarModalServicio" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarModalServicio"></div>
      <div class="relative servi-adapt-bg rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="servi-blue p-5">
          <h3 class="text-lg font-bold text-white">{{ servicioEditando ? 'Editar Servicio' : 'Nuevo Servicio' }}</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="text-xs servi-grey-font uppercase font-bold">Nombre del Servicio</label>
            <input v-model="nuevoServicio.nombre" type="text" class="mt-1 block w-full servi-blue servi-grey-font rounded-lg border border-gray-100 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: Cambio de Aceite" />
          </div>
          <div>
            <label class="text-xs servi-grey-font uppercase font-bold">Precio (CLP)</label>
            <input v-model.number="nuevoServicio.precio" type="number" min="0" class="mt-1 block w-full servi-blue servi-grey-font rounded-lg border border-gray-100 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div class="flex items-center gap-2">
            <input v-model="nuevoServicio.activo" type="checkbox" id="servicioActivo" class="rounded" />
            <label for="servicioActivo" class="text-sm servi-grey-font font-medium">Servicio activo</label>
          </div>
        </div>
        <div class="px-6 pb-6 flex justify-end gap-3">
          <button @click="cerrarModalServicio" class="px-4 py-2.5 servi-adapt-bg servi-grey-font rounded-lg text-sm font-semibold hover:opacity-80 transition cursor-pointer">Cancelar</button>
          <button @click="guardarServicio" class="px-4 py-2.5 servi-yellow text-white rounded-lg text-sm font-semibold hover:opacity-90 transition cursor-pointer">Guardar</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══════════════════ MODAL CUENTA BANCARIA ═══════════════════ -->
  <Teleport to="body">
    <div v-if="mostrarModalCuenta" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarModalCuenta"></div>
      <div class="relative servi-adapt-bg rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="servi-blue p-5">
          <h3 class="text-lg font-bold text-white">{{ cuentaEditando ? 'Editar Cuenta' : 'Nueva Cuenta Bancaria' }}</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="text-xs servi-grey-font uppercase font-bold">Banco</label>
            <select v-model="nuevaCuenta.banco" class="mt-1 block w-full rounded-lg servi-blue servi-grey-font border border-gray-100 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option v-for="banco in bancos" :key="banco.codigo" :value="banco.nombre">{{ banco.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs servi-grey-font uppercase font-bold">Tipo de Cuenta</label>
            <select v-model="nuevaCuenta.tipo_cuenta" class="mt-1 block w-full rounded-lg servi-blue servi-grey-font border border-gray-100 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="Cuenta Corriente">Cuenta Corriente</option>
              <option value="Cuenta Vista">Cuenta Vista</option>
              <option value="Cuenta de Ahorro">Cuenta de Ahorro</option>
              <option value="Cuenta RUT">Cuenta RUT</option>
            </select>
          </div>
          <div>
            <label class="text-xs servi-grey-font uppercase font-bold">Número de Cuenta</label>
            <input v-model="nuevaCuenta.numero_cuenta" type="text" class="mt-1 block w-full rounded-lg servi-blue servi-grey-font border border-gray-100 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: 12345678" />
          </div>
          <div>
            <label class="text-xs servi-grey-font uppercase font-bold">Titular</label>
            <input v-model="nuevaCuenta.titular" type="text" class="mt-1 block w-full rounded-lg servi-blue servi-grey-font border border-gray-100 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nombre del titular" />
          </div>
          <div>
            <label class="text-xs servi-grey-font uppercase font-bold">RUT Titular</label>
            <input v-model="nuevaCuenta.rut_titular" type="text" class="mt-1 block w-full rounded-lg servi-blue servi-grey-font border border-gray-100 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="12.345.678-9" />
          </div>
        </div>
        <div class="px-6 pb-6 flex justify-end gap-3">
          <button @click="cerrarModalCuenta" class="px-4 py-2.5 servi-adapt-bg servi-grey-font rounded-lg text-sm font-semibold hover:opacity-80 transition cursor-pointer">Cancelar</button>
          <button @click="guardarCuenta" class="px-4 py-2.5 servi-yellow text-white rounded-lg text-sm font-semibold hover:opacity-90 transition cursor-pointer">Guardar</button>
        </div>
      </div>
    </div>
  </Teleport>
  </div>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 40;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>