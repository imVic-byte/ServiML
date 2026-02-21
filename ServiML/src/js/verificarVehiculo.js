import { supabase } from "../lib/supabaseClient";

export const verificarVehiculo = async (form) => {
    const { data, error } = await supabase
    .from('vehiculo')
    .select()
    .eq('patente', form.patente)
    .eq('marca', form.marca)
    .eq('modelo', form.modelo)
    .eq('id_cliente', form.id_cliente)
    .single();
    if (error || !data) {
        const {data:vehiculo, error2} = await supabase
        .from('vehiculo')
        .insert(form)
        .select()
        .single();
        if (error2) {
            return { exito: false, mensaje: 'Error al verificar vehiculo' };
        }
        return { exito: true, vehiculo: vehiculo };
    }
    return { exito: true, vehiculo: data }
}
