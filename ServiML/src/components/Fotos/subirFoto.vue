<script setup>
import { supabase } from '../supabase'
async function subirArchivo(file, ordenId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Usuario no autenticado");

    const responseSign = await fetch('/api/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        filename: file.name,
        fileType: file.type,
        ordenId: ordenId
      })
    });

    if (!responseSign.ok) throw new Error("Error obteniendo firma de R2");
    
    const { uploadUrl, key } = await responseSign.json();

    const responseUpload = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });

    if (!responseUpload.ok) throw new Error("Error subiendo archivo a R2");

    const { data, error } = await supabase
      .from('archivos')
      .insert({
        orden_trabajo_id: ordenId,
        user_id: session.user.id,
        bucket_key: key,
        nombre_original: file.name,
        mime_type: file.type,
        size_bytes: file.size
      })
      .select()
      .single();

    if (error) throw new Error("Error guardando referencia en BD");

    return data;

  } catch (err) {
    console.error(err);
    throw err;
  }
}
</script>