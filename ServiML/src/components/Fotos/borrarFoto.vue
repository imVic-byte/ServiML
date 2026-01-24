<script setup>
import { supabase } from '../../lib/supabaseClient'
async function eliminarArchivo(bucketKey) {
  if (!confirm("¿Estás seguro de eliminar este archivo permanentemente?")) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/delete-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ bucketKey })
    });

    if (!response.ok) throw new Error("Error borrando de la nube");
    const { error } = await supabase
      .from('archivos')
      .delete()
      .eq('bucket_key', bucketKey);

    if (error) throw new Error("Error borrando de la base de datos");

    alert("Archivo eliminado correctamente");

  } catch (err) {
    console.error(err);
    alert("Hubo un error al eliminar");
  }
}
</script>