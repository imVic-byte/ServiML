import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return new Response("Invalid Token", { status: 401 });

  const { bucketKey } = await request.json();

  const { data: archivo, error: dbError } = await supabase
    .from('archivos')
    .select('bucket_key')
    .eq('bucket_key', bucketKey)
    .single();

  if (dbError || !archivo) {
    return new Response(JSON.stringify({ error: "Access Denied or File Not Found" }), { status: 403 });
  }
  const S3 = new S3Client({
    region: "auto",
    endpoint: env.VITE_STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: env.VITE_STORAGE_ACCESS_KEY,
      secretAccessKey: env.VITE_STORAGE_SECRET_KEY,
    },
  });

  const command = new GetObjectCommand({
    Bucket: env.VITE_STORAGE_BUCKET,
    Key: bucketKey,
  });

  const url = await getSignedUrl(S3, command, { expiresIn: 900 });

  return new Response(JSON.stringify({ downloadUrl: url }), {
    headers: { "Content-Type": "application/json" },
  });
}