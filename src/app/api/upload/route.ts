import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { and, eq } from "drizzle-orm";
import { capturers, editors, getUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { presignPut, publicUrlOf, r2Enabled, withRandomSuffix } from "@/lib/storage";

const isUuid = (s?: string) => !!s && /^[0-9a-f-]{36}$/i.test(s);

type Rules = { allowedContentTypes?: string[]; maximumSizeInBytes: number };

/**
 * Confere sessão, papel e se o bem (e a captura) pertencem à organização do usuário.
 *  - { siteId }             → vista (JPG/PNG, até 200 MB, só editores)
 *  - { siteId, captureId }  → foto de campo da vistoria (até 60 MB, inclusive equipe de campo)
 *  - { siteId, captureId, kind: "resultado" } → modelo 3D importado (até 5 GB, editores)
 */
async function authorize(pathname: string, clientPayload: string | null | undefined): Promise<Rules> {
  const user = await getUser();
  if (!user) throw new Error("Sessão expirada. Entre de novo.");
  const { siteId, captureId, kind } = JSON.parse(clientPayload || "{}") as { siteId?: string; captureId?: string; kind?: string };

  if (!isUuid(siteId)) throw new Error("Bem inválido.");
  const [site] = await db
    .select({ id: schema.sites.id })
    .from(schema.sites)
    .where(and(eq(schema.sites.id, siteId!), eq(schema.sites.orgId, user.orgId)))
    .limit(1);
  if (!site) throw new Error("Bem não encontrado.");

  if (captureId) {
    if (!capturers.includes(user.role)) throw new Error("Sem permissão para capturar.");
    if (!isUuid(captureId)) throw new Error("Captura inválida.");
    const [cap] = await db
      .select({ id: schema.captures.id })
      .from(schema.captures)
      .innerJoin(schema.campaigns, eq(schema.campaigns.id, schema.captures.campaignId))
      .where(and(eq(schema.captures.id, captureId), eq(schema.campaigns.siteId, siteId!)))
      .limit(1);
    if (!cap) throw new Error("Captura não encontrada.");
    if (kind === "resultado") {
      // modelo 3D importado (nuvem, malha): só editores, arquivos grandes
      if (!editors.includes(user.role)) throw new Error("Sem permissão para enviar o resultado.");
      if (!pathname.startsWith(`orgs/${user.orgId}/sites/${siteId}/capturas/${captureId}/resultado/`)) throw new Error("Caminho inválido.");
      return { maximumSizeInBytes: 5 * 1024 * 1024 * 1024 };
    }
    if (!pathname.startsWith(`orgs/${user.orgId}/sites/${siteId}/capturas/${captureId}/`)) throw new Error("Caminho inválido.");
    return { allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"], maximumSizeInBytes: 60 * 1024 * 1024 };
  }

  if (!editors.includes(user.role)) throw new Error("Sem permissão para enviar arquivos.");
  if (!pathname.startsWith(`orgs/${user.orgId}/sites/${siteId}/`)) throw new Error("Caminho inválido.");
  return { allowedContentTypes: ["image/jpeg", "image/png"], maximumSizeInBytes: 200 * 1024 * 1024 };
}

/**
 * Autoriza o navegador a enviar um arquivo direto ao armazenamento (sem passar pelo limite de
 * corpo das funções). Com a R2 configurada, devolve um endereço assinado; senão usa o Vercel Blob.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody | { r2: true; pathname: string; clientPayload?: string; contentType?: string; size?: number };
  try {
    if ("r2" in body) {
      if (!r2Enabled()) return NextResponse.json({ r2: false });
      const pathname = String(body.pathname || "");
      if (!pathname || pathname.includes("..")) throw new Error("Caminho inválido.");
      const rules = await authorize(pathname, body.clientPayload);
      const contentType = body.contentType || "application/octet-stream";
      if (rules.allowedContentTypes && !rules.allowedContentTypes.includes(contentType)) throw new Error("Tipo de arquivo não aceito.");
      if ((body.size ?? 0) > rules.maximumSizeInBytes) throw new Error("Arquivo grande demais.");
      const key = withRandomSuffix(pathname);
      return NextResponse.json({ r2: true, uploadUrl: await presignPut(key, contentType), url: publicUrlOf(key), pathname: key });
    }
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => ({ ...(await authorize(pathname, clientPayload)), addRandomSuffix: true }),
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
