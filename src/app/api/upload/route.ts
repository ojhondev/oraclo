import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { and, eq } from "drizzle-orm";
import { capturers, editors, getUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";

const isUuid = (s?: string) => !!s && /^[0-9a-f-]{36}$/i.test(s);

/**
 * Emite o token para o navegador enviar arquivos direto ao Vercel Blob (sem passar
 * pelo limite de corpo das funções). Confere sessão, papel e se o bem (e a captura)
 * pertencem à organização do usuário.
 *  - { siteId }             → ortofoto (JPG/PNG, até 200 MB, só editores)
 *  - { siteId, captureId }  → foto de captura (até 60 MB, inclusive equipe de campo)
 *  - { siteId, captureId, kind: "resultado" } → nuvem/malha/relatório processados (até 5 GB, editores)
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
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
            // resultado do processamento (nuvem, malha, relatório): só editores, arquivos grandes
            if (!editors.includes(user.role)) throw new Error("Sem permissão para enviar o resultado.");
            if (!pathname.startsWith(`orgs/${user.orgId}/sites/${siteId}/capturas/${captureId}/resultado/`)) throw new Error("Caminho inválido.");
            return { maximumSizeInBytes: 5 * 1024 * 1024 * 1024, addRandomSuffix: true };
          }
          if (!pathname.startsWith(`orgs/${user.orgId}/sites/${siteId}/capturas/${captureId}/`)) throw new Error("Caminho inválido.");
          return {
            allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
            maximumSizeInBytes: 60 * 1024 * 1024,
            addRandomSuffix: true,
          };
        }

        if (!editors.includes(user.role)) throw new Error("Sem permissão para enviar arquivos.");
        if (!pathname.startsWith(`orgs/${user.orgId}/sites/${siteId}/`)) throw new Error("Caminho inválido.");
        return {
          allowedContentTypes: ["image/jpeg", "image/png"],
          maximumSizeInBytes: 200 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
