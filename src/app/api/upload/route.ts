import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { and, eq } from "drizzle-orm";
import { editors, getUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";

/**
 * Emite o token para o navegador enviar a ortofoto direto ao Vercel Blob
 * (sem passar pelo limite de corpo das funções). Confere sessão, papel e se o
 * bem pertence à organização do usuário.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getUser();
        if (!user || !editors.includes(user.role)) throw new Error("Sem permissão para enviar arquivos.");
        const { siteId } = JSON.parse(clientPayload || "{}") as { siteId?: string };
        if (!siteId || !/^[0-9a-f-]{36}$/i.test(siteId)) throw new Error("Bem inválido.");
        const [site] = await db
          .select({ id: schema.sites.id })
          .from(schema.sites)
          .where(and(eq(schema.sites.id, siteId), eq(schema.sites.orgId, user.orgId)))
          .limit(1);
        if (!site) throw new Error("Bem não encontrado.");
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
