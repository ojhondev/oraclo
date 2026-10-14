"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, FileVideo, Loader2, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { extractFrames, type ExtractStats, type VideoFrame } from "@/lib/video-frames";

/** Método de gravação (PRD — captura por vídeo). */
const METHOD = [
  "Grave em 4K, de preferência a 60 quadros por segundo (Ajustes → Câmera → Gravar Vídeo).",
  "Trave foco e exposição: segure o dedo na tela até aparecer “Bloqueio AE/AF”.",
  "Desligue a estabilização cinematográfica / “Ação”: ela deforma a imagem. A estabilização normal pode ficar.",
  "Use uma lente só (1×), sem zoom, do começo ao fim.",
  "Ande devagar (meio passo por segundo), mantendo a distância da parede. Desloque-se — não gire parado.",
  "Duas passadas: uma de longe (conjunto) e outra de perto (detalhes). Termine onde começou.",
  "Trechos de até 2–3 minutos; fachadas grandes viram vários vídeos.",
];

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Captura por vídeo: grava com a câmera do aparelho (ou escolhe um vídeo pronto) e o
 * próprio navegador escolhe os quadros nítidos e diferentes entre si, que entram na
 * mesma fila de envio das fotos. O vídeo em si não é enviado.
 */
export function VideoCapture({ onFrame, compact = false }: { onFrame: (f: VideoFrame, name: string) => Promise<void>; compact?: boolean }) {
  const recordRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [open, setOpen] = useState(!compact);
  const [job, setJob] = useState<{ name: string; stats: ExtractStats | null } | null>(null);

  async function run(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm)$/i.test(file.name)) return void toast.error("Escolha um arquivo de vídeo.");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setJob({ name: file.name, stats: null });
    let wake: { release: () => Promise<void> } | null = null;
    try {
      wake = (await (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<typeof wake> } }).wakeLock?.request("screen").catch(() => null)) ?? null;
      const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-").slice(0, 30) || "video";
      let n = 0;
      const stats = await extractFrames(file, {
        signal: ctrl.signal,
        onFrame: async (f) => {
          n++;
          await onFrame(f, `${base}-q${String(n).padStart(4, "0")}-${f.time.toFixed(2)}s.jpg`);
        },
        onProgress: (s) => setJob((j) => (j ? { ...j, stats: s } : j)),
      });
      toast.success(`${stats.kept} quadros escolhidos de ${fmtTime(stats.duration)} de vídeo (${stats.blurry} tremidos e ${stats.duplicate} repetidos descartados).`);
      if (stats.width < 3000) toast.warning(`O vídeo está em ${stats.width}×${stats.height}. Para mais detalhe, grave em 4K.`);
    } catch (e) {
      if ((e as DOMException).name === "AbortError") toast.info("Extração cancelada — os quadros já escolhidos continuam na fila.");
      else toast.error((e as Error).message);
    } finally {
      void wake?.release().catch(() => {});
      setJob(null);
      abortRef.current = null;
    }
  }

  const s = job?.stats;

  return (
    <div className="grid gap-3">
      {!job && (
        <div className={cn("grid gap-2", !compact && "sm:grid-cols-2")}>
          {!compact && (
            <Button size="lg" className="h-12" onClick={() => recordRef.current?.click()}>
              <Video /> Gravar vídeo
            </Button>
          )}
          <Button size={compact ? "default" : "lg"} variant="outline" className={cn(!compact && "h-12")} onClick={() => pickRef.current?.click()}>
            <FileVideo /> {compact ? "Tem um vídeo? Escolher vídeo" : "Escolher vídeo"}
          </Button>
        </div>
      )}

      {job && (
        <div className="grid gap-2 rounded-xl border p-3 text-[13.5px]">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="min-w-0 flex-1 truncate">Escolhendo os melhores quadros de {job.name}…</span>
            <button onClick={() => abortRef.current?.abort()} aria-label="Cancelar" className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-foreground transition-[width]" style={{ width: `${Math.round((s?.progress ?? 0) * 100)}%` }} />
          </div>
          <p className="text-[12.5px] text-muted-foreground tabular-nums">
            {s ? `${Math.round(s.progress * 100)}% de ${fmtTime(s.duration)} · ${s.kept} quadros na fila · ${s.blurry} tremidos · ${s.duplicate} repetidos` : "Abrindo o vídeo…"}
          </p>
          <p className="text-[12px] text-muted-foreground">Mantenha esta tela aberta. O vídeo não é enviado — só os quadros escolhidos.</p>
        </div>
      )}

      <div className="rounded-xl bg-muted/60">
        <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-3 py-2 text-[13px] font-medium">
          Como gravar para o 3D sair bom
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <ol className="grid gap-1.5 px-3 pb-3 text-[13px] text-muted-foreground">
            {METHOD.map((m, i) => (
              <li key={i} className="flex gap-2">
                <span className="tabular-nums">{i + 1}.</span>
                <span>{m}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <input ref={recordRef} type="file" accept="video/*" capture="environment" className="sr-only" onChange={(e) => { void run(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={pickRef} type="file" accept="video/*" className="sr-only" onChange={(e) => { void run(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}
