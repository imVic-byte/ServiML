import { supabase } from "../lib/supabaseClient";

export const verificarCliente = async (form) => {
    // 1. Normalización de datos (Limpieza)
    // Eliminamos espacios extra y pasamos a mayúsculas para evitar 'Vic' vs 'vic'
    const nombreLimpio = form.nombre.trim().toUpperCase();
    const apellidoLimpio = form.apellido.trim().toUpperCase();
    
    // Limpieza de teléfono: eliminamos espacios, guiones y el '+' si existiera
    // para comparar solo los dígitos numéricos.
    const telefonoLimpio = form.telefono.replace(/\D/g, '');

    try {
        // 2. Intento de coincidencia por Teléfono (Suele ser lo más único)
        // Buscamos clientes que contengan esos dígitos en su teléfono
        const { data: coincidencias, error } = await supabase
            .from('cliente')
            .select()
            .or(`telefono.ilike.%${telefonoLimpio}%, nombre.eq.${nombreLimpio}`)
            // Usamos ilike y % para ser más flexibles con el formato del teléfono

        if (error) throw error;

        // 3. Lógica de Decisión (Fuzzy Matching simple)
        let clienteEncontrado = null;

        if (coincidencias && coincidencias.length > 0) {
            // Buscamos entre los resultados el que mejor coincida
            clienteEncontrado = coincidencias.find(c => {
                const cTel = c.telefono.replace(/\D/g, '');
                const cNom = c.nombre.trim().toUpperCase();
                const cApe = c.apellido.trim().toUpperCase();

                // Criterio: Teléfono idéntico O (Nombre y Apellido idénticos)
                return (cNom === nombreLimpio && cApe === apellidoLimpio);
            });
        }

        // 4. Retorno o Creación
        if (clienteEncontrado) {
            return { exito: true, cliente: clienteEncontrado, mensaje: 'Cliente existente vinculado' };
        }

        // Si no se encontró nada sólido, procedemos a insertar
        const { data: clienteNuevo, error: errorInsert } = await supabase
            .from('cliente')
            .insert({
                nombre: nombreLimpio,
                apellido: apellidoLimpio,
                telefono: form.telefono, // Guardamos el formato original que puso el usuario
                email: form.email?.toLowerCase().trim(),
                codigo_pais: form.codigo_pais
            })
            .select()
            .single();

        if (errorInsert) throw errorInsert;

        return { exito: true, cliente: clienteNuevo, mensaje: 'Nuevo cliente registrado' };

    } catch (err) {
        console.error('Error en algoritmo de verificación:', err);
        return { exito: false, mensaje: 'No se pudo verificar el cliente' };
    }
}