"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  Check,
  CloudOff,
  CloudUpload,
  Download,
  ImagePlus,
  Images,
  Loader2,
  Plus,
  RotateCw,
  Ruler,
  Send,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/confirm-button";
import { fmtBytes } from "@/lib/format";
import { captureStatuses } from "@/lib/labels";
import { isBlurry, measureSharpness } from "@/lib/capture-queue";
import type { schema } from "@/lib/db";
import {
  addDistance,
  deleteCapture,
  deleteDistance,
  deleteFile,
  saveChecklist,
  saveNotes,
  setCaptureStatus,
  submitCapture,
} from "../actions";
import { GuidedCamera, type Shot } from "./camera";
import { useUploader } from "./use-uploader";

type Capture = typeof schema.captures.$inferSelect;
type Distance = typeof schema.controlDistances.$inferSelect;
type FileRow = Pick<typeof schema.captureFiles.$inferSelect, "id" | "url" | "sharpness" | "pass" | "width" | "height" | "bytes">;

const MIN_PHOTOS = 20;

function Step({ n, title, done, children, hint }: { n: number; title: string; done?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-start gap-3">
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border text-[13px] font-medium", done && "border-foreground bg-foreground text-background")}>
          {done ? <Check className="size-3.5" /> : n}
        </span>
        <div className="min-w-0">
          <h2 className="text-[16px] font-medium">{title}</h2>
          {hint && <p className="text-[13px] text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function CaptureWorkspace({
  siteId,
  orgId,
  capture,
  checklistItems,
  distances: initialDistances,
  files,
  canCapture,
  canEdit,
  isAdmin,
}: {
  siteId: string;
  orgId: string;
  capture: Capture;
  checklistItems: readonly { key: string; label: string }[];
  distances: Distance[];
  files: FileRow[];
  canCapture: boolean;
  canEdit: boolean;
  isAdmin: boolean;
}) {
  const up = useUploader({ siteId, orgId, captureId: capture.id });
  const [checklist, setChecklist] = useState<Record<string, boolean>>(capture.checklist ?? {});
  const [distances, setDistances] = useState(initialDistances);
  const nextLetter = (t: string) => (/^[A-Y]$/.test(t) ? String.fromCharCode(t.charCodeAt(0) + 1) : "");
  const lastB = initialDistances.length ? initialDistances[initialDistances.length - 1]!.targetB : "A";
  const [pair, setPair] = useState({ a: lastB, b: nextLetter(lastB) || "B" });
  const [meters, setMeters] = useState("");
  const [pass, setPass] = useState<1 | 2>(1);
  const [camera, setCamera] = useState(false);
  const [session, setSession] = useState<number[]>([]);
  const [status, setStatus] = useState(capture.status);
  // acompanha mudanças de status vindas do servidor (ex.: rascunho → enviando)
  const [seenStatus, setSeenStatus] = useState(capture.status);
  if (seenStatus !== capture.status) {
    setSeenStatus(capture.status);
    setStatus(capture.status);
  }
  const [busy, start] = useTransition();
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

  const locked = status === "na_fila" || status === "processando" || status === "concluida";
  const total = uploaded + up.pending;
  const recent = useMemo(
    () => [...files.map((f) => f.sharpness).filter((s): s is number => s != null), ...session].slice(-20),
    [files, session],
  );

  async function addShot(s: Shot) {
    await up.add({ blob: s.blob, name: s.name, type: s.type, width: s.width, height: s.height, sharpness: s.sharpness, pass, takenAt: new Date().toISOString() });
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
      await up.add({ blob: file, name: file.name, type: file.type || "image/jpeg", width, height, sharpness, pass, takenAt: new Date(file.lastModified || Date.now()).toISOString() });
      if (sharpness != null) setSession((x) => [...x, sharpness!].slice(-20));
    }
    toast.success(`${list.length} foto${list.length > 1 ? "s" : ""} adicionada${list.length > 1 ? "s" : ""} à fila de envio.`);
    if (blurry) toast.warning(`${blurry} parece${blurry > 1 ? "m" : ""} tremida${blurry > 1 ? "s" : ""}. Se puder, refaça.`);
  }

  function toggle(key: string) {
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);
    start(async () => {
      await saveChecklist(siteId, capture.id, next).catch((e: Error) => toast.error(e.message));
    });
  }

  function addDist(form: FormData) {
    const m = Number(String(form.get("meters") || "").replace(",", "."));
    const targetA = String(form.get("a") || "").trim();
    const targetB = String(form.get("b") || "").trim();
    if (!(m > 0)) return void toast.error("Informe a distância em metros, ex.: 3,215");
    start(async () => {
      try {
        const d = await addDistance(siteId, capture.id, { targetA, targetB, measuredMm: Math.round(m * 1000) });
        setDistances((l) => [...l, d]);
        setPair({ a: d.targetB, b: nextLetter(d.targetB) });
        setMeters("");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function submit() {
    start(async () => {
      try {
        await submitCapture(siteId, capture.id);
        setStatus("na_fila");
        toast.success("Captura enviada para processamento.");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  const checklistDone = checklistItems.every((i) => checklist[i.key]);


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
          <Badge variant={status === "concluida" ? "default" : "secondary"} className="ml-auto">
            {captureStatuses[status]}
          </Badge>
        </div>
        {up.pending > 0 && (
          <p className="mt-1 text-[12px] text-muted-foreground">
            {up.online ? "Enviando — mantenha esta página aberta e a tela ligada." : "Sem conexão — as fotos estão guardadas no aparelho e o envio continua quando o sinal voltar."}
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

      {locked ? (
        <section className="rounded-2xl border bg-card p-5 text-[14px]">
          <p className="font-medium">
            {status === "concluida" ? "Processamento concluído." : status === "processando" ? "Processando o modelo 3D." : "Aguardando processamento."}
          </p>
          <p className="mt-1 text-muted-foreground">
            {status === "concluida"
              ? "A nuvem de pontos e os arquivos aparecem na página do bem, em Modelos e arquivos."
              : "A equipe Oraclo vai gerar a nuvem de pontos, a malha 3D e o relatório de qualidade. Você recebe o resultado na página do bem."}
          </p>
        </section>
      ) : (
        canCapture && (
          <>
            <Step n={1} title="Roteiro de campo" done={checklistDone} hint="Antes de fotografar, confira:">
              <ul className="grid gap-1">
                {checklistItems.map((i) => (
                  <li key={i.key}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-2 text-[14px] hover:bg-muted">
                      <input type="checkbox" checked={!!checklist[i.key]} onChange={() => toggle(i.key)} className="mt-0.5 size-4 accent-current" />
                      {i.label}
                    </label>
                  </li>
                ))}
              </ul>
            </Step>

            <Step
              n={2}
              title="Medidas de controle"
              done={distances.length >= 3}
              hint="Com trena a laser, meça 3 a 10 distâncias entre pares de alvos. É o que dá escala ao 3D e mede o erro."
            >
              {distances.length > 0 && (
                <ul className="mb-3 divide-y rounded-xl border">
                  {distances.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 px-3 py-2 text-[14px]">
                      <Ruler className="size-4 text-muted-foreground" />
                      <span className="flex-1">
                        {d.targetA} ↔ {d.targetB}
                      </span>
                      <span className="tabular-nums">{(d.measuredMm / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 3 })} m</span>
                      <button
                        aria-label="Remover medida"
                        onClick={() =>
                          start(async () => {
                            await deleteDistance(siteId, capture.id, d.id);
                            setDistances((l) => l.filter((x) => x.id !== d.id));
                          })
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <form action={addDist} className="grid grid-cols-[1fr_1fr_1.4fr_auto] gap-2">
                <Input name="a" value={pair.a} onChange={(e) => setPair((p) => ({ ...p, a: e.target.value }))} aria-label="Alvo A" required />
                <Input name="b" value={pair.b} onChange={(e) => setPair((p) => ({ ...p, b: e.target.value }))} aria-label="Alvo B" required />
                <Input name="meters" value={meters} onChange={(e) => setMeters(e.target.value)} inputMode="decimal" placeholder="metros" aria-label="Distância em metros" required />
                <Button type="submit" size="icon" variant="secondary" aria-label="Adicionar medida" disabled={busy}>
                  <Plus />
                </Button>
              </form>
            </Step>

            <Step n={3} title="Fotos" done={total >= MIN_PHOTOS} hint="Duas voltas: de longe (conjunto) e de perto (detalhes). Quanto mais fotos com sobreposição, melhor o 3D.">
              <div className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-[13px]">
                {([1, 2] as const).map((p) => (
                  <button key={p} onClick={() => setPass(p)} className={cn("h-8 rounded-full", pass === p ? "bg-card shadow-sm ring-1 ring-border" : "text-muted-foreground")}>
                    Volta {p} · {p === 1 ? "de longe" : "de perto"}
                  </button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button size="lg" className="h-12" onClick={() => setCamera(true)}>
                  <Camera /> Câmera guiada
                </Button>
                <Button size="lg" variant="outline" className="h-12" onClick={() => hiResRef.current?.click()}>
                  <ImagePlus /> Foto em alta
                </Button>
                <Button size="lg" variant="outline" className="h-12" onClick={() => galleryRef.current?.click()}>
                  <Images /> Da galeria
                </Button>
              </div>
              <p className="mt-2 text-[12.5px] text-muted-foreground">
                <b className="font-medium text-foreground">Câmera guiada</b>: rápida, avisa se a foto ficou tremida.{" "}
                <b className="font-medium text-foreground">Foto em alta</b>: abre a câmera do celular com resolução máxima, uma foto por vez.{" "}
                <b className="font-medium text-foreground">Da galeria</b>: fotos já tiradas (ou de outra câmera).
              </p>
              <input ref={hiResRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
              <input ref={galleryRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
            </Step>

            <Step n={4} title="Concluir" hint="Quando todas as fotos tiverem sido enviadas, mande para processamento.">
              <Button size="lg" className="h-12 w-full" onClick={submit} disabled={busy || up.pending > 0 || total < MIN_PHOTOS}>
                {busy ? <Loader2 className="animate-spin" /> : <Send />}
                {up.pending > 0
                  ? `Aguardando envio de ${up.pending} foto${up.pending > 1 ? "s" : ""}…`
                  : total < MIN_PHOTOS
                    ? `Faça pelo menos ${MIN_PHOTOS} fotos (${total} até agora)`
                    : "Concluir e enviar para processamento"}
              </Button>
              {distances.length < 3 && total >= MIN_PHOTOS && (
                <p className="mt-2 text-[12.5px] text-muted-foreground">Sem 3 medidas de controle o 3D sai sem escala confiável.</p>
              )}
              <Textarea
                className="mt-3"
                rows={2}
                placeholder="Observações para a equipe de processamento (opcional)"
                defaultValue={capture.notes ?? ""}
                onBlur={(e) => start(() => saveNotes(siteId, capture.id, e.target.value))}
              />
            </Step>
          </>
        )
      )}

      {/* revisão: fotos já enviadas */}
      {files.length > 0 && (
        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-[16px] font-medium">Fotos enviadas ({files.length})</h2>
            <span className="text-[13px] text-muted-foreground">
              volta 1: {files.filter((f) => f.pass === 1).length} · volta 2: {files.filter((f) => f.pass === 2).length}
            </span>
            {isAdmin && (
              <Button size="sm" variant="outline" className="ml-auto" asChild>
                <a href={`/bens/${siteId}/capturas/${capture.id}/lista`}>
                  <Download /> Lista de arquivos
                </a>
              </Button>
            )}
          </div>
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
                  {canEdit && !locked && (
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

      {/* painel da equipe (piloto: processamento manual) */}
      {(isAdmin || canEdit) && (
        <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed p-4 text-[13px]">
          {isAdmin && (
            <>
              <span className="text-muted-foreground">Status do processamento:</span>
              {(["na_fila", "processando", "concluida", "falhou", "enviando"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={status === s ? "default" : "outline"}
                  onClick={() =>
                    start(async () => {
                      await setCaptureStatus(siteId, capture.id, s);
                      setStatus(s);
                    })
                  }
                >
                  {s === "enviando" ? "Reabrir captura" : captureStatuses[s]}
                </Button>
              ))}
            </>
          )}
          {canEdit && (
            <span className="ml-auto">
              <ConfirmButton
                action={() => deleteCapture(siteId, capture.id)}
                title="Excluir esta captura?"
                description="Todas as fotos e medidas desta captura serão apagadas, inclusive do armazenamento."
                label="Excluir captura"
              />
            </span>
          )}
        </section>
      )}

      {camera && (
        <GuidedCamera
          pass={pass}
          onPass={setPass}
          total={total}
          pending={up.pending}
          recent={recent}
          onShot={addShot}
          onClose={() => setCamera(false)}
        />
      )}
      {!camera && up.pending > 0 && !up.online && (
        <p className="flex items-center justify-center gap-2 text-[12.5px] text-muted-foreground">
          <CloudUpload className="size-3.5" /> As fotos não enviadas continuam salvas neste aparelho.
        </p>
      )}
    </div>
  );
}
