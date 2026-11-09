// Copia os arquivos do Vercel Blob para a Cloudflare R2 (mesmo caminho) e troca os endereços no banco.
// Não apaga nada do Blob: depois de conferir, a limpeza é um passo separado.
//   node scripts/migrar-r2.mjs           copia e atualiza o banco
//   MIGRAR_SO_LISTAR=1 node scripts/...  só mostra o que faria
import { list } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { AwsClient } from "aws4fetch";
import { loadEnv } from "./treino-comum.mjs";

const env = loadEnv();
for (const k of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL", "BLOB_READ_WRITE_TOKEN"]) {
  if (!env[k]) throw new Error(`Falta ${k} no .env.local`);
}
const DRY = process.env.MIGRAR_SO_LISTAR === "1";
const sql = neon(env.DATABASE_URL);
const c = new AwsClient({ accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" });
const base = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}`;
const pub = env.R2_PUBLIC_URL.replace(/\/+$/, "");
const enc = (k) => k.split("/").map(encodeURIComponent).join("/");

const blobs = [];
let cursor;
do {
  const page = await list({ token: env.BLOB_READ_WRITE_TOKEN, cursor, limit: 1000 });
  blobs.push(...page.blobs);
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);
const total = blobs.reduce((s, b) => s + b.size, 0);
console.log(`${blobs.length} arquivos, ${(total / 1e6).toFixed(0)} MB`);
if (DRY) process.exit(0);

let done = 0;
let bytes = 0;
for (let i = 0; i < blobs.length; i += 4) {
  await Promise.all(
    blobs.slice(i, i + 4).map(async (b) => {
      const head = await c.fetch(`${base}/${enc(b.pathname)}`, { method: "HEAD" });
      if (head.ok && Number(head.headers.get("content-length")) === b.size) return; // já copiado
      const res = await fetch(b.url);
      if (!res.ok) throw new Error(`Falha ao baixar ${b.pathname} (${res.status})`);
      const buf = Buffer.from(await res.arrayBuffer());
      const put = await c.fetch(`${base}/${enc(b.pathname)}`, { method: "PUT", body: buf, headers: { "content-type": res.headers.get("content-type") || "application/octet-stream" } });
      if (!put.ok) throw new Error(`Falha ao gravar ${b.pathname} (${put.status})`);
      bytes += b.size;
    }),
  );
  done = Math.min(blobs.length, i + 4);
  console.log(`copiados ${done}/${blobs.length} (${(bytes / 1e6).toFixed(0)} MB enviados)`);
}

// o endereço do Blob é https://<loja>.public.blob.vercel-storage.com/<caminho>; na R2 fica <pub>/<caminho>
const origins = [...new Set(blobs.map((b) => new URL(b.url).origin))];
for (const o of origins) {
  const a = await sql`update capture_files set url = replace(url, ${o}, ${pub}) where url like ${o + "%"}`;
  await sql`update orthophotos set url = replace(url, ${o}, ${pub}) where url like ${o + "%"}`;
  await sql`update orthophotos set source_url = replace(source_url, ${o}, ${pub}) where source_url like ${o + "%"}`;
  await sql`update outputs set url = replace(url, ${o}, ${pub}) where url like ${o + "%"}`;
  await sql`update outputs set meta = replace(meta::text, ${o}, ${pub})::jsonb where meta::text like ${"%" + o + "%"}`;
  void a;
}
const [left] = await sql`select
  (select count(*) from capture_files where url like '%blob.vercel-storage.com%')::int +
  (select count(*) from orthophotos where url like '%blob.vercel-storage.com%' or source_url like '%blob.vercel-storage.com%')::int +
  (select count(*) from outputs where url like '%blob.vercel-storage.com%' or meta::text like '%blob.vercel-storage.com%')::int as n`;
console.log(`banco atualizado; endereços antigos restantes: ${left.n}`);
