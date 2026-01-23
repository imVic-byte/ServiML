import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return new Response("Invalid Token", { status: 401 });

  const { bucketKey } = await request.json();

  const { data: archivo } = await supabase
    .from('archivos')
    .select('id')
    .eq('bucket_key', bucketKey)
    .single();

  if (!archivo) {
    return new Response("Permission Denied", { status: 403 });
  }

  const S3 = new S3Client({
    region: "auto",
    endpoint: env.VITE_STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: env.VITE_STORAGE_ACCESS_KEY,
      secretAccessKey: env.VITE_STORAGE_SECRET_KEY,
    },
  });
  await S3.send(new DeleteObjectCommand({
    Bucket: env.VITE_STORAGE_BUCKET,
    Key: bucketKey,
  }));

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}