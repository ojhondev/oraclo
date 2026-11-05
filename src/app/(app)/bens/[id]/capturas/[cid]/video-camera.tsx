"use client";

import { useEffect, useRef, useState } from "react";
import { CloudUpload, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FRAME_WINDOW_MS, FrameSelector, MAX_FRAMES, tooFast, type Frame } from "@/lib/video-frames";
import { useCameraStream } from "./use-camera-stream";

const SAMPLE_MS = 200;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * Gravação em tela cheia: o profissional filma a fachada andando, e o ArchRay guarda o quadro mais
 * nítido de cada janela, avisando se estiver rápido demais. O vídeo inteiro não é salvo.
 */
export function VideoCamera({ total, pending, onFrame, onClose }: { total: number; pending: number; onFrame: (f: Frame) => Promise<void>; onClose: () => void }) {
  const { videoRef, ready, res, error, setError } = useCameraStream();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [kept, setKept] = useState(0);
  const [fast, setFast] = useState(false);
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!recording) return;
    const sel = new FrameSelector();
    const started = Date.now();
    let closing = false;
    const sample = setInterval(() => {
      const v = videoRef.current;
      if (v?.videoWidth) sel.offer(v, v.videoWidth, v.videoHeight);
    }, SAMPLE_MS);
    const windows = setInterval(() => {
      if (closing) return;
      closing = true;
      void (async () => {
        try {
          const frame = await sel.closeWindow();
          if (frame) await onFrameRef.current(frame);
          setKept(sel.kept);
          setFast(tooFast(sel.verdicts));
          if (sel.kept >= MAX_FRAMES) setRecording(false);
        } catch (e) {
          setError((e as Error).message);
          setRecording(false);
        } finally {
          closing = false;
        }
      })();
    }, FRAME_WINDOW_MS);
    const clock = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 500);
    return () => {
      clearInterval(sample);
      clearInterval(windows);
      clearInterval(clock);
    };
  }, [recording, setError, videoRef]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />

      <div className="relative z-10 flex items-start gap-3 bg-gradient-to-b from-black/75 to-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={onClose} disabled={recording} aria-label="Fechar câmera" className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 disabled:opacity-30">
          <X className="size-5" />
        </button>
        <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-white/85">
          Ande devagar de ponta a ponta, sem girar no lugar, com a fachada sempre no quadro. Se ela for alta, faça outra passada mirando a parte de cima.
        </p>
      </div>

      {error && <div className="relative z-10 mx-4 rounded-xl bg-white p-4 text-[14px] text-black">{error}</div>}
      <div className="flex-1" />

      {recording && (
        <div className="relative z-10 flex justify-center pb-3">
          <span className={cn("rounded-full px-3 py-1 text-[12.5px] font-medium", fast ? "bg-white text-black" : "bg-black/55 text-white")}>
            {fast ? "Mais devagar: a imagem está tremendo" : "Bom ritmo"}
          </span>
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between gap-4 bg-gradient-to-t from-black/80 to-transparent px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="grid w-16 text-[13px] leading-tight tabular-nums">
          <span className="font-medium">{mmss(seconds)}</span>
          <span className="text-[11px] text-white/75">{recording ? "gravando" : "pronto"}</span>
        </div>
        <button
          onClick={() => {
            if (!recording) {
              setSeconds(0);
              setKept(0);
              setFast(false);
            }
            setRecording((r) => !r);
          }}
          disabled={!ready}
          aria-label={recording ? "Parar gravação" : "Iniciar gravação"}
          className="grid size-[76px] place-items-center rounded-full border-4 border-white transition-transform active:scale-95 disabled:opacity-40"
        >
          {recording ? <Square className="size-8 fill-red-500 text-red-500" /> : <span className="size-[60px] rounded-full bg-red-500" />}
        </button>
        <div className="grid w-16 justify-items-center text-center leading-tight">
          <span className="text-[22px] font-medium tabular-nums">{recording ? kept : total}</span>
          <span className="text-[11px] text-white/75">quadros</span>
          {pending > 0 && (
            <span className="mt-1 flex items-center gap-1 text-[10.5px] text-white/75">
              <CloudUpload className="size-3" /> {pending}
            </span>
          )}
        </div>
      </div>
      {res && <span className="absolute right-3 bottom-1 z-10 text-[10px] text-white/50">{res}</span>}
    </div>
  );
}
