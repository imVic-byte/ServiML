import { supabase } from "../lib/supabaseClient";

export const generarFichaTrabajo = async (form) => {
    const { data, error } = await supabase
    .from('ficha_de_trabajo')
    .insert(form.data.ficha_de_trabajo)
    .select()
    .single();

    if (error) {
        console.error('Error al generar ficha de trabajo:', error);
        return { exito: false, mensaje: 'Error al generar ficha de trabajo' };
    }
    const 

    return { exito: true, mensaje: 'Ficha de trabajo generada exitosamente' };
}