import { supabase } from "../lib/supabaseClient";

export const creacionOT = async (presupuesto) => {
    const { data: PresupuestoData, error } = await supabase
    .from('presupuesto')
    .select()
    .eq('id', presupuesto)
    .single()
    if (error) {
        console.error('Error al obtener presupuesto:', error)
        return false
    }
    if (!PresupuestoData) {
        console.error('Presupuesto no encontrado')
        return false
    }
    const { data: OTData, error2 } = await supabase
    .from('orden_trabajo')
    .insert({
        id_presupuesto: presupuesto,
        cliente_id: PresupuestoData.id_cliente,
        vehiculo_id: PresupuestoData.id_vehiculo,
        motivo_ingreso: PresupuestoData.diagnostico,
    })
    .select()
    if (error2) {
        console.error('Error al crear orden de trabajo:', error2)
        return false
    }
    if (!OTData) {
        console.error('Orden de trabajo no creada')
        return false
    }
    const { data: OTBitacoraData, error3 } = await supabase
    .from('OT_bitacora')
    .insert({
        ot_id: OTData[0].id,
        nuevo_estado_id:1,
        tipo_evento:'Creacion de OT'
    })
    .select()
    if (error3) {
        console.error('Error al crear bitacora:', error3)
        return false
    }
    if (!OTBitacoraData) {
        console.error('Bitacora no creada')
        return false
    }
    return true
}
