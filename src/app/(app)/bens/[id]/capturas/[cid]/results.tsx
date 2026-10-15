"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { Box, Download, FileUp, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtBytes } from "@/lib/format";
import { ACCEPTED_EXTENSIONS, formatOf, MODEL_FORMATS, type OutputMeta } from "@/lib/model-formats";
import type { schema } from "@/lib/db";
import { deleteOutput, registerOutput } from "../actions";

type Output = typeof schema.outputs.$inferSelect;

/** Modelo 3D importado (opcional): arquivos prontos de app de celular, drone ou laser. */
export function CaptureResults({
  siteId,
  orgId,
  captureId,
  results,
  canEdit,
}: {
  siteId: string;
  orgId: string;
  captureId: string;
  results: Output[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ name: string; pct: number } | null>(null);
  const [, start] = useTransition();

  async function sendFiles(list: FileList | null) {
    if (!list?.length) return;
    for (const file of Array.from(list)) {
      if (!formatOf(file.name)) {
        toast.error(`${file.name}: formato não aceito.`);
        continue;
      }
      setUploading({ name: file.name, pct: 0 });
      try {
        const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
        const blob = await upload(`orgs/${orgId}/sites/${siteId}/capturas/${captureId}/resultado/${safe}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          clientPayload: JSON.stringify({ siteId, captureId, kind: "resultado" }),
          contentType: file.type || "application/octet-stream",
          multipart: file.size > 20 * 1024 * 1024,
          onUploadProgress: (p) => setUploading({ name: file.name, pct: p.percentage }),
        });
        await registerOutput(siteId, captureId, { url: blob.url, pathname: blob.pathname, name: file.name, bytes: file.size });
        toast.success(`${file.name} enviado.`);
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message}`);
      }
    }
    setUploading(null);
    router.refresh();
  }

  if (!results.length && !canEdit) return null;

  return (
    <section className="grid gap-5 rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[16px] font-medium">Modelo 3D importado</h2>
      </div>

      {/* arquivos */}
      <div className="grid gap-2">
        {results.length === 0 ? (
          <p className="text-[13.5px] text-muted-foreground">
            Envie o modelo que você já tem — de um app gratuito de celular (ex.: Scaniverse), de drone ou de laser scanner. No
            visualizador dá para medir e gerar vistas em escala das paredes.
            Para ver no navegador, inclua uma versão em <b className="font-medium text-foreground">PLY, LAS, XYZ ou GLB</b>; E57, LAZ e OBJ ficam para download.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {results.map((o) => {
              const meta = (o.meta ?? {}) as OutputMeta;
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-[14px]">
                  <Box className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{o.name}</span>
                  <span className="text-[12.5px] text-muted-foreground">
                    {MODEL_FORMATS[o.format]?.label ?? o.format.toUpperCase()} · {fmtBytes(o.bytes)}
                  </span>
                  <span className="flex items-center gap-1">
                    {meta.viewable && (
                      <Button size="sm" asChild>
                        <Link href={`/bens/${siteId}/modelos/${o.id}`}>Ver em 3D</Link>
                      </Button>
                    )}
                    {o.url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`${o.url}?download=1`}>
                          <Download /> Baixar
                        </a>
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Excluir arquivo"
                        onClick={() => start(async () => {
                          await deleteOutput(siteId, captureId, o.id);
                          router.refresh();
                        })}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={!!uploading}>
              {uploading ? <Loader2 className="animate-spin" /> : <FileUp />}
              {uploading ? `Enviando ${uploading.name} · ${Math.round(uploading.pct)}%` : "Enviar modelo 3D"}
            </Button>
            <span className="text-[12.5px] text-muted-foreground">E57, LAS, LAZ, PLY, XYZ, PTS, GLB, OBJ, FBX, ZIP ou PDF · até 5 GB cada</span>
            <input ref={inputRef} type="file" multiple accept={ACCEPTED_EXTENSIONS} className="sr-only" onChange={(e) => { void sendFiles(e.target.files); e.target.value = ""; }} />
          </div>
        )}
      </div>

    </section>
  );
}
