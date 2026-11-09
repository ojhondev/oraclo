"use client";

/**
 * Envio de arquivos do navegador direto ao armazenamento. Pede ao servidor um endereço assinado
 * da Cloudflare R2; se a R2 ainda não estiver configurada, usa o Vercel Blob. Mesma assinatura
 * de `upload` do @vercel/blob/client, para trocar sem mexer nas telas.
 */
import { upload as blobUpload } from "@vercel/blob/client";

type Options = {
  access?: "public";
  handleUploadUrl?: string;
  clientPayload?: string;
  contentType?: string;
  multipart?: boolean;
  onUploadProgress?: (p: { loaded: number; total: number; percentage: number }) => void;
};

function put(url: string, body: Blob, contentType: string, onProgress?: Options["onUploadProgress"]) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress({ loaded: e.loaded, total: e.total, percentage: Math.round((e.loaded / e.total) * 100) });
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Falha no envio (${xhr.status}).`)));
    xhr.onerror = () => reject(new Error("Falha de conexão no envio. Tente de novo."));
    xhr.send(body);
  });
}

export async function upload(pathname: string, body: Blob, opts: Options = {}): Promise<{ url: string; pathname: string }> {
  const contentType = opts.contentType || body.type || "application/octet-stream";
  const res = await fetch(opts.handleUploadUrl ?? "/api/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ r2: true, pathname, clientPayload: opts.clientPayload, contentType, size: body.size }),
  });
  const data = (await res.json().catch(() => ({}))) as { r2?: boolean; uploadUrl?: string; url?: string; pathname?: string; error?: string };
  if (!res.ok) throw new Error(data.error || "Não foi possível autorizar o envio.");
  if (data.r2 && data.uploadUrl && data.url && data.pathname) {
    await put(data.uploadUrl, body, contentType, opts.onUploadProgress);
    return { url: data.url, pathname: data.pathname };
  }
  const b = await blobUpload(pathname, body, { access: "public", handleUploadUrl: opts.handleUploadUrl ?? "/api/upload", clientPayload: opts.clientPayload, contentType, multipart: opts.multipart, onUploadProgress: opts.onUploadProgress });
  return { url: b.url, pathname: b.pathname };
}
