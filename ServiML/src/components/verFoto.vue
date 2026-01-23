<script setup>
import { supabase } from '../supabase'
async function getSignedUrlForFile(bucketKey) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch('/api/download-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ bucketKey })
  });

  if (!response.ok) return null;
  const { downloadUrl } = await response.json();
  return downloadUrl;
}

const verArchivo = async (archivo) => {
  const url = await getSignedUrlForFile(archivo.bucket_key);
  if (url) {
    window.open(url, '_blank');
  }
};
</script>
