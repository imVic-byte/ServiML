import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";

export async function onRequestPost(context) {
  const { request, env } = context;
  
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Auth Header" }), { status: 401 });
  }

  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const token = authHeader.replace("Bearer ", "");
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return new Response(JSON.stringify({ error: "Invalid Token" }), { status: 401 });
  }

  const body = await request.json();
  const { filename, fileType, ordenId } = body;

  if (!filename || !fileType || !ordenId) {
    return new Response(JSON.stringify({ error: "Missing file data" }), { status: 400 });
  }

  const key = `${ordenId}/${Date.now()}_${filename}`;

  const S3 = new S3Client({
    region: "auto",
    endpoint: env.VITE_STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: env.VITE_STORAGE_ACCESS_KEY,
      secretAccessKey: env.VITE_STORAGE_SECRET_KEY,
    },
  });

  const command = new PutObjectCommand({
    Bucket: env.VITE_STORAGE_BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const url = await getSignedUrl(S3, command, { expiresIn: 600 });

  return new Response(JSON.stringify({ uploadUrl: url, key: key }), {
    headers: { "Content-Type": "application/json" },
  });
}