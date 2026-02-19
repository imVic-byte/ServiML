import { supabase } from "../lib/supabaseClient";
import { verificarCliente } from "./verificarCliente";

export const generarFichaTrabajo = async (datosEntrada) => {
    // datosEntrada ya es el objeto { cliente: {...}, ficha_de_trabajo: {...} }
    
    // 1. Verificamos o creamos al cliente
    // Pasamos solo la parte del cliente
    const { exito: clienteOk, cliente } = await verificarCliente(datosEntrada.cliente);
    
    if (!clienteOk) {
        return { exito: false, mensaje: 'Error al verificar o crear el cliente' };
    }

    // 2. Preparamos el objeto para insertar en la tabla
    // Extraemos los datos y le inyectamos el ID del cliente que acabamos de obtener
    const payloadFicha = {
        ...datosEntrada.ficha_de_trabajo,
        id_cliente: cliente.id // Asumiendo que verificarCliente retorna el objeto cliente con su ID
    };

    // 3. Inserción en Supabase
    const { data, error } = await supabase
        .from('ficha_de_trabajo')
        .insert(payloadFicha)
        .select()
        .single();

    if (error) {
        console.error('Error al generar ficha de trabajo:', error);
        return { exito: false, mensaje: 'Error al generar ficha de trabajo' };
    }

    // 4. Actualizar el estado de la cotización (Si existe)
    // Esto es vital para que no quede como "pendiente"
    if (datosEntrada.id_cotizacion) {
        await supabase
            .from('cotizacion')
            .update({ estado: 2 , id_ficha:data.id})
            .eq('id', datosEntrada.id_cotizacion);
    }

    return { 
        exito: true, 
        ficha_de_trabajo: data, 
        mensaje: 'Ficha de trabajo generada exitosamente' 
    };
}