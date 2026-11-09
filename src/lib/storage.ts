/**
 * Armazenamento de arquivos: Cloudflare R2 (padrão quando configurado) com o Vercel Blob como
 * reserva e para os arquivos antigos. Só no servidor.
 *
 * Variáveis: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET e R2_PUBLIC_URL
 * (endereço público do bucket, ex.: https://pub-xxxx.r2.dev ou https://arquivos.archray.com.br).
 */
import "server-only";
import { AwsClient } from "aws4fetch";
import { del as blobDel, list as blobList } from "@vercel/blob";

const env = () => ({
  account: process.env.R2_ACCOUNT_ID,
  key: process.env.R2_ACCESS_KEY_ID,
  secret: process.env.R2_SECRET_ACCESS_KEY,
  bucket: process.env.R2_BUCKET,
  publicUrl: process.env.R2_PUBLIC_URL?.replace(/\/+$/, ""),
});

/** A R2 só entra quando tudo está configurado, inclusive o endereço público. */
export function r2Enabled() {
  const e = env();
  return !!(e.account && e.key && e.secret && e.bucket && e.publicUrl);
}

let client: AwsClient | null = null;
function r2() {
  const e = env();
  client ??= new AwsClient({ accessKeyId: e.key!, secretAccessKey: e.secret!, service: "s3", region: "auto" });
  return { c: client, base: `https://${e.account}.r2.cloudflarestorage.com/${e.bucket}`, publicUrl: e.publicUrl! };
}

const encodeKey = (key: string) => key.split("/").map(encodeURIComponent).join("/");

/** Endereço público de um arquivo da R2. */
export function publicUrlOf(key: string) {
  return `${r2().publicUrl}/${encodeKey(key)}`;
}

/** Acrescenta um sufixo aleatório antes da extensão (evita sobrescrever e cache velho). */
export function withRandomSuffix(pathname: string) {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const slash = pathname.lastIndexOf("/");
  const dot = pathname.lastIndexOf(".");
  return dot > slash ? `${pathname.slice(0, dot)}-${rand}${pathname.slice(dot)}` : `${pathname}-${rand}`;
}

/** Endereço assinado para o navegador enviar o arquivo direto para a R2 (vale 1 hora). */
export async function presignPut(key: string, contentType: string) {
  const { c, base } = r2();
  const url = new URL(`${base}/${encodeKey(key)}`);
  url.searchParams.set("X-Amz-Expires", "3600");
  const signed = await c.sign(new Request(url, { method: "PUT", headers: { "content-type": contentType } }), { aws: { signQuery: true } });
  return signed.url;
}

/** Envia um arquivo pelo servidor (arquivos pequenos gerados no servidor). */
export async function putObject(key: string, body: BodyInit, contentType: string) {
  const { c, base } = r2();
  const res = await c.fetch(`${base}/${encodeKey(key)}`, { method: "PUT", body, headers: { "content-type": contentType } });
  if (!res.ok) throw new Error(`Falha ao gravar o arquivo (${res.status}).`);
  return { url: publicUrlOf(key), pathname: key };
}

/** O endereço é de um arquivo nosso (R2 ou Vercel Blob)? */
export function isStorageUrl(u: string | URL) {
  const url = typeof u === "string" ? new URL(u) : u;
  if (url.hostname.endsWith(".blob.vercel-storage.com")) return true;
  const pub = env().publicUrl;
  return !!pub && url.origin === new URL(pub).origin;
}

/** Caminho (chave) do arquivo a partir do endereço público. */
export function keyOfUrl(u: string) {
  return decodeURIComponent(new URL(u).pathname.slice(1));
}

async function r2Delete(keys: string[]) {
  const { c, base } = r2();
  for (let i = 0; i < keys.length; i += 8) {
    await Promise.all(keys.slice(i, i + 8).map((k) => c.fetch(`${base}/${encodeKey(k)}`, { method: "DELETE" }).catch(() => null)));
  }
}

/** Apaga arquivos pelos endereços, onde quer que estejam. */
export async function deleteUrls(urls: (string | null | undefined)[]) {
  const list = urls.filter((u): u is string => !!u);
  const pub = env().publicUrl;
  const inR2 = pub ? list.filter((u) => u.startsWith(pub + "/")) : [];
  const inBlob = list.filter((u) => u.includes(".blob.vercel-storage.com/"));
  if (inR2.length && r2Enabled()) await r2Delete(inR2.map(keyOfUrl));
  for (let i = 0; i < inBlob.length; i += 100) await blobDel(inBlob.slice(i, i + 100)).catch(() => {});
}

/** Apaga tudo o que começa com o prefixo, na R2 e no Vercel Blob. */
export async function deletePrefix(prefix: string) {
  if (r2Enabled()) {
    const { c, base } = r2();
    let token: string | undefined;
    do {
      const url = new URL(base);
      url.searchParams.set("list-type", "2");
      url.searchParams.set("prefix", prefix);
      if (token) url.searchParams.set("continuation-token", token);
      const xml = await (await c.fetch(url)).text();
      const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1]!.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
      await r2Delete(keys);
      token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? xml.match(/<NextContinuationToken>([^<]+)</)?.[1] : undefined;
    } while (token);
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    let cursor: string | undefined;
    do {
      const page = await blobList({ prefix, cursor, limit: 500 });
      if (page.blobs.length) await blobDel(page.blobs.map((b) => b.url));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  }
}
