import { supabase } from "../lib/supabaseClient";

export const creacionOT = async (ficha_id, trabajador_id, vehiculo_id) => {
    const { data: OTData, error } = await supabase
    .from('orden_trabajo')
    .insert({
        id_ficha: ficha_id,
        id_empleado: trabajador_id,
        vehiculo_id: vehiculo_id,
        estado_actual_id: 1,
    })
    .select()
    .single()
    if (error) {
        console.error('Error al crear OT:', error)
        return false
    }
    if (!OTData) {
        console.error('OT no creada')
        return false
    }
    const {data:bitacora, error:errorBitacora} = await supabase.from('OT_bitacora')
    .insert({
        ot_id: OTData.id,
        nuevo_estado_id: 10,
        tipo_evento:'Creacion de OT',
    })
    .select()
    .single()
    if (errorBitacora) {
        console.error('Error al crear bitacora:', errorBitacora)
        return false
    }
    const {data:trabajador, error:errorTrabajador} = await supabase.from('trabajadores').select('*').eq('id', trabajador_id).single()
    if (errorTrabajador) {
        console.error('Error al obtener trabajador:', errorTrabajador)
        return false
    }
    if (!trabajador) {
        console.error('Trabajador no encontrado')
        return false
    }
    const {data:Bitacora2, error:errorBitacora2} = await supabase.from('OT_bitacora').insert({
        ot_id:OTData.id,
        tipo_evento:'Asignado a ' + trabajador.nombre + ' ' + trabajador.apellido,
    })
    if (errorBitacora2) {
        console.error('Error al crear bitacora:', errorBitacora2)
        return false
    }
    return OTData
}
