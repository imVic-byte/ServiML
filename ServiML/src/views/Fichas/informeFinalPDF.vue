<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useRoute } from 'vue-router';
import { useInterfaz } from '@/stores/interfaz';
import Navbar from '@/components/componentes/navbar.vue';
import html2pdf from 'html2pdf.js';
import Volver from '@/components/componentes/volver.vue';
const route = useRoute()
const router = useRouter()
const interfaz = useInterfaz()


const formatoPesos = (valor) => {
  if (valor === undefined || valor === null) return '$0';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
};

const formatoFechaYHora = (fecha) => {
  if (!fecha) return '---';
  return new Date(fecha).toLocaleString('es-CL');
};

const formatoFecha = (fecha) => {
  if (!fecha) return '---';
  return new Date(fecha).toLocaleDateString('es-CL');
};

const TotalItem = (item) => {
  return formatoPesos(Number(item.monto) * Number(item.cantidad))
};

const datosEmpresa = ref({})

const traerDatosEmpresa = async () => {
  const {data, error} = await supabase.from('serviml').select('*').eq('id', 1).single()
  if (data) {
    datosEmpresa.value = data
  }
  if (error) {
    console.error('Error al traer datos de la empresa:', error)
  }
}

const traerEmail = async () => {
  const {data, error} = await supabase.from('serviml_email').select('*').eq('id_serviml', 1).eq('prioritario',true).single()
  if (data) {
    datosEmpresa.value.email = data.email
  }
  if (error) {
    console.error('Error al traer datos de la empresa:', error)
  }
}

const traerTelefono = async () => {
  const {data,error} = await supabase.from('serviml_telefono').select('*').eq('id_serviml', 1).eq('prioritario',true).maybeSingle()
  if (data) {
    datosEmpresa.value.telefono = data.telefono || ''
  }
  if (error) {
    datosEmpresa.value.telefono = ''
  }
}

const cuentaSeleccionada = computed(() => {
  return cotizacion.value?.serviml_cuenta || null
})

const generarInformeFinal = async () => {
  const yaExiste = await handleVerificarInformeFinal()
  if (yaExiste) {
    return
  }
  if (!ficha.value || !cotizacion.value) {
    console.error('Falta ficha o cotización aprobada para generar el informe final')
    return
  }
  const {data, error} = await supabase
    .from('informe_final')
    .insert({
      cliente_nombre: ficha.value.cliente.nombre,
      cliente_apellido: ficha.value.cliente.apellido,
      cliente_telefono: ficha.value.cliente.telefono,
      cliente_email: ficha.value.cliente.email,
      total_final: cotizacion.value.total_final,
      cliente_codigo_pais: ficha.value.cliente.codigo_pais,
      id_ficha: ficha.value.id,
    })
    .select()
    .single()
  if (error) {
    console.error('Error al generar informe final:', error)
  }
  const {error:errorInformeFinal} = await supabase.from('ficha_de_trabajo').update({informe_final:true}).eq('id',ficha.value.id)
  if (errorInformeFinal) {
    console.error('Error al generar informe final:', errorInformeFinal)
  }
  await cargarDatos()
}

const informeFinal = ref(null)
const ficha = ref(null)
const cotizacion = ref(null)

const cargarDatos = async () => {
    const {data, error} = await supabase
    .from('ficha_de_trabajo')
    .select(`*, informe_final(*),presupuesto_ficha(*), cliente (*),orden_trabajo (*, trabajadores(*),vehiculo(*,cliente(*))),cotizaciones_ficha(*,detalle_cotizaciones_ficha(*),serviml_cuenta(*))`) 
    .eq('id', route.params.id)
    .single()

    if (data) {
      ficha.value = data
      informeFinal.value = data.informe_final[0]
      cotizacion.value = data.cotizaciones_ficha?.find(c => c.estado === 2) || null
    }

    if (error) {
      console.error('Error al traer datos de la ficha:', error)
    }
}

const handleVerificarInformeFinal = async () => {
  const {data, error} = await supabase.from('informe_final').select('*').eq('id_ficha', route.params.id)
  if (error) {
    console.error('Error al verificar informe final:', error)
    return false
  }
  return data && data.length > 0
}

const generarPDF = () => {
  const elemento = document.getElementById('elemento-a-imprimir');
  const opciones = {
    margin:       0,
    filename:     `InformeFinal_${informeFinal.value.numero_folio}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opciones).from(elemento).save();
}


onMounted(async () => {
  interfaz.showLoading()
  await traerDatosEmpresa()
  await traerEmail()
  await traerTelefono()
  await cargarDatos()
  if (route.query.generar === 'true') {
    generarInformeFinal()
  }
  console.log(ficha.value)
  interfaz.hideLoading()
})
</script>
