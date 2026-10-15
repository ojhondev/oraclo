"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, CloudOff, CloudUpload, ImagePlus, Images, Loader2, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmButton } from "@/components/confirm-button";
import { fmtBytes } from "@/lib/format";
import { isBlurry, measureSharpness } from "@/lib/capture-queue";
import type { schema } from "@/lib/db";
import { deleteCapture, deleteFile, saveNotes } from "../actions";
import { GuidedCamera, type Shot } from "./camera";
import { useUploader } from "./use-uploader";

type Capture = typeof schema.captures.$inferSelect;
type FileRow = Pick<typeof schema.captureFiles.$inferSelect, "id" | "url" | "sharpness" | "pass" | "width" | "height" | "bytes">;

/**
 * Fotos de campo de uma vistoria: câmera do celular (com aviso de foto tremida), foto em
 * alta resolução ou galeria. As fotos ficam no aparelho e sobem em segundo plano.
 */
export function CaptureWorkspace({
  siteId,
  orgId,
  capture,
  files,
  canCapture,
  canEdit,
}: {
  siteId: string;
  orgId: string;
  capture: Capture;
  files: FileRow[];
  canCapture: boolean;
  canEdit: boolean;
}) {
  const up = useUploader({ siteId, orgId, captureId: capture.id });
  const [camera, setCamera] = useState(false);
  const [session, setSession] = useState<number[]>([]);
  const [, start] = useTransition();
  const router = useRouter();
  // total enviado = contagem do servidor + o que subiu desde a última atualização da página
  const [mark, setMark] = useState({ fileCount: capture.fileCount, sent: 0 });
  if (mark.fileCount !== capture.fileCount) setMark({ fileCount: capture.fileCount, sent: up.uploaded });
  const uploaded = capture.fileCount + (up.uploaded - mark.sent);
  // atualiza a grade de fotos alguns segundos depois de cada envio
  useEffect(() => {
    if (!up.uploaded) return;
    const t = setTimeout(() => router.refresh(), 2500);
    return () => clearTimeout(t);
  }, [up.uploaded, router]);
  const hiResRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const total = uploaded + up.pending;
  const recent = useMemo(
    () => [...files.map((f) => f.sharpness).filter((s): s is number => s != null), ...session].slice(-20),
    [files, session],
  );

  async function addShot(s: Shot) {
    await up.add({ blob: s.blob, name: s.name, type: s.type, width: s.width, height: s.height, sharpness: s.sharpness, pass: 1, takenAt: new Date().toISOString() });
    if (s.sharpness != null) setSession((x) => [...x, s.sharpness!].slice(-20));
  }

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    let blurry = 0;
    for (const file of Array.from(list)) {
      let width: number | null = null;
      let height: number | null = null;
      let sharpness: number | null = null;
      try {
        const bmp = await createImageBitmap(file);
        width = bmp.width;
        height = bmp.height;
        sharpness = measureSharpness(bmp, bmp.width, bmp.height);
        bmp.close();
      } catch {
        // formato que o navegador não decodifica (ex.: HEIC fora do Safari) — envia mesmo assim
      }
      if (isBlurry(sharpness, recent)) blurry++;
      await up.add({ blob: file, name: file.name, type: file.type || "image/jpeg", width, height, sharpness, pass: 1, takenAt: new Date(file.lastModified || Date.now()).toISOString() });
      if (sharpness != null) setSession((x) => [...x, sharpness!].slice(-20));
    }
    toast.success(`${list.length} foto${list.length > 1 ? "s" : ""} adicionada${list.length > 1 ? "s" : ""} à fila de envio.`);
    if (blurry) toast.warning(`${blurry} parece${blurry > 1 ? "m" : ""} tremida${blurry > 1 ? "s" : ""}. Se puder, refaça.`);
  }

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      {/* status do envio — sempre visível */}
      <div className="sticky top-14 z-20 -mx-1 rounded-2xl border bg-card/95 px-4 py-3 backdrop-blur lg:top-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px]">
          <span className="font-medium tabular-nums">{total} fotos</span>
          <span className="text-muted-foreground tabular-nums">{uploaded} enviadas</span>
          {up.pending > 0 && (
            <span className="flex items-center gap-1.5 tabular-nums">
              {up.online ? <Loader2 className="size-3.5 animate-spin" /> : <CloudOff className="size-3.5" />}
              {up.pending} no aparelho ({fmtBytes(up.pendingBytes)})
            </span>
          )}
        </div>
        {up.pending > 0 && (
          <p className="mt-1 text-[12px] text-muted-foreground">
            {up.online
              ? "Enviando — mantenha esta página aberta e a tela ligada."
              : "Sem conexão — as fotos estão guardadas no aparelho e o envio continua quando o sinal voltar."}
          </p>
        )}
        {up.error && (
          <p className="mt-1 flex items-center gap-2 text-[12.5px]">
            <span className="font-medium">Erro no envio:</span> {up.error}
            <button onClick={up.retry} className="ml-auto inline-flex items-center gap-1 underline">
              <RotateCw className="size-3" /> tentar de novo
            </button>
          </p>
        )}
      </div>

      {canCapture && (
        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="text-[16px] font-medium">Fotos de campo</h2>
          <p className="mb-3 text-[13px] text-muted-foreground">
            Detalhes dos danos e fotos de frente das paredes. As fotos de frente podem virar vistas retificadas no projeto.
          </p>
          <div
            className="grid gap-2 sm:grid-cols-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void addFiles(e.dataTransfer.files);
            }}
          >
            <Button size="lg" className="h-12" onClick={() => setCamera(true)}>
              <Camera /> Câmera
            </Button>
            <Button size="lg" variant="outline" className="h-12" onClick={() => hiResRef.current?.click()}>
              <ImagePlus /> Foto em alta
            </Button>
            <Button size="lg" variant="outline" className="h-12" onClick={() => galleryRef.current?.click()}>
              <Images /> Da galeria
            </Button>
          </div>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            <b className="font-medium text-foreground">Câmera</b>: rápida, avisa se a foto ficou tremida.{" "}
            <b className="font-medium text-foreground">Foto em alta</b>: câmera do celular na resolução máxima.{" "}
            <b className="font-medium text-foreground">Da galeria</b>: fotos já tiradas — no computador, arraste para cá.
          </p>
          <input ref={hiResRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
          <input ref={galleryRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
          <Textarea
            className="mt-3"
            rows={2}
            placeholder="Observações da visita (opcional)"
            defaultValue={capture.notes ?? ""}
            readOnly={!canEdit && !canCapture}
            onBlur={(e) => start(() => saveNotes(siteId, capture.id, e.target.value))}
          />
        </section>
      )}

      {files.length > 0 && (
        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="mb-3 text-[16px] font-medium">Fotos enviadas ({files.length})</h2>
          <ul className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {files.map((f) => {
              const blurry = isBlurry(f.sharpness, recent);
              return (
                <li key={f.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                  {f.url && (
                    <a href={f.url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt="" loading="lazy" className="size-full object-cover" />
                    </a>
                  )}
                  {blurry && <span className="absolute inset-x-0 bottom-0 bg-foreground text-center text-[10px] text-background">tremida</span>}
                  {canEdit && (
                    <button
                      aria-label="Excluir foto"
                      onClick={() => start(() => deleteFile(siteId, capture.id, f.id))}
                      className="absolute top-1 right-1 hidden size-6 place-items-center rounded-full bg-background/90 group-hover:grid"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {canEdit && (
        <div className="flex justify-end">
          <ConfirmButton
            action={() => deleteCapture(siteId, capture.id)}
            title="Excluir estas fotos de campo?"
            description="Todas as fotos deste grupo serão apagadas, inclusive do armazenamento."
            label="Excluir fotos"
          />
        </div>
      )}

      {camera && <GuidedCamera total={total} pending={up.pending} recent={recent} onShot={addShot} onClose={() => setCamera(false)} />}
      {!camera && up.pending > 0 && !up.online && (
        <p className="flex items-center justify-center gap-2 text-[12.5px] text-muted-foreground">
          <CloudUpload className="size-3.5" /> As fotos não enviadas continuam salvas neste aparelho.
        </p>
      )}
    </div>
  );
}
