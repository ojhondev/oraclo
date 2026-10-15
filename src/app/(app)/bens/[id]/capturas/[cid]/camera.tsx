"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudUpload, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isBlurry, measureSharpness } from "@/lib/capture-queue";

export type Shot = { blob: Blob; type: string; name: string; width: number; height: number; sharpness: number | null };

type ImageCaptureLike = { takePhoto: (o?: object) => Promise<Blob> };
type ImageCaptureCtor = new (track: MediaStreamTrack) => ImageCaptureLike;

const HINT = "Fotografe os danos de perto e a parede de frente, inteira no quadro — a foto de frente vira vista retificada.";

/**
 * Câmera guiada em tela cheia: usa a câmera traseira na maior resolução que o navegador
 * oferece (ImageCapture quando existe), mede a nitidez ao vivo e de cada foto.
 */
export function GuidedCamera({
  total,
  pending,
  recent,
  onShot,
  onClose,
}: {
  total: number;
  pending: number;
  recent: number[];
  onShot: (s: Shot) => Promise<void>;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capRef = useRef<ImageCaptureLike | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const [live, setLive] = useState<number | null>(null);
  const [last, setLast] = useState<{ url: string; blurry: boolean } | null>(null);
  const [res, setRes] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    let wake: { release: () => Promise<void> } | null = null;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Este navegador não dá acesso à câmera. Use o modo \"Foto em alta resolução\".");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 4096 }, height: { ideal: 3072 } },
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0]!;
        const IC = (window as unknown as { ImageCapture?: ImageCaptureCtor }).ImageCapture;
        if (IC) capRef.current = new IC(track);
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        setRes(`${v.videoWidth}×${v.videoHeight}`);
        setReady(true);
        try {
          wake = await (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<typeof wake> } }).wakeLock?.request("screen") ?? null;
        } catch {}
      } catch (e) {
        const err = e as DOMException;
        setError(
          err.name === "NotAllowedError"
            ? "Permissão da câmera negada. Libere a câmera para este site nas configurações do navegador."
            : err.message || "Não foi possível abrir a câmera.",
        );
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void wake?.release().catch(() => {});
    };
  }, []);

  // nitidez ao vivo da imagem da câmera (indicador antes de fotografar)
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      const v = videoRef.current;
      if (v && v.videoWidth) setLive(measureSharpness(v, v.videoWidth, v.videoHeight));
    }, 700);
    return () => clearInterval(id);
  }, [ready]);

  const shoot = useCallback(async () => {
    const v = videoRef.current;
    if (!v || busy) return;
    setBusy(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 120);
    try {
      let blob: Blob | null = null;
      if (capRef.current) {
        try {
          blob = await capRef.current.takePhoto();
        } catch {
          blob = null;
        }
      }
      if (!blob) {
        const c = document.createElement("canvas");
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        c.getContext("2d")!.drawImage(v, 0, 0);
        blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.92));
      }
      if (!blob) throw new Error("Não foi possível capturar a foto.");
      const bmp = await createImageBitmap(blob);
      const sharp = measureSharpness(bmp, bmp.width, bmp.height);
      const shot: Shot = {
        blob,
        type: blob.type || "image/jpeg",
        name: `foto-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`,
        width: bmp.width,
        height: bmp.height,
        sharpness: sharp,
      };
      bmp.close();
      await onShot(shot);
      setLast((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return { url: URL.createObjectURL(blob!), blurry: isBlurry(sharp, recent) };
      });
      navigator.vibrate?.(20);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [busy, onShot, recent]);

  const liveBlurry = isBlurry(live, recent);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />
      <div className={cn("pointer-events-none absolute inset-0 bg-white transition-opacity duration-100", flash ? "opacity-70" : "opacity-0")} />

      {/* topo */}
      <div className="relative z-10 flex items-start gap-3 bg-gradient-to-b from-black/75 to-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={onClose} aria-label="Fechar câmera" className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15">
          <X className="size-5" />
        </button>
        <div className="grid min-w-0 flex-1 gap-2">
          <p className="text-[12.5px] leading-snug text-white/85">{HINT}</p>
        </div>
      </div>

      {error && (
        <div className="relative z-10 mx-4 rounded-xl bg-white p-4 text-[14px] text-black">
          {error}
        </div>
      )}

      <div className="flex-1" />

      {/* indicador de nitidez */}
      {ready && (
        <div className="relative z-10 flex justify-center pb-3">
          <span className={cn("rounded-full px-3 py-1 text-[12.5px] font-medium", liveBlurry ? "bg-white text-black" : "bg-black/55 text-white")}>
            {liveBlurry ? "Imagem tremida ou desfocada — segure firme" : "Nítida"}
          </span>
        </div>
      )}

      {/* base */}
      <div className="relative z-10 flex items-center justify-between gap-4 bg-gradient-to-t from-black/80 to-transparent px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="relative size-14 overflow-hidden rounded-xl border border-white/40 bg-white/10">
          {last && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={last.url} alt="Última foto" className="size-full object-cover" />
          )}
          {last?.blurry && <span className="absolute inset-x-0 bottom-0 bg-white text-center text-[10px] font-semibold text-black">tremida</span>}
        </div>
        <button
          onClick={shoot}
          disabled={!ready || busy}
          aria-label="Fotografar"
          className="grid size-[76px] place-items-center rounded-full border-4 border-white transition-transform active:scale-95 disabled:opacity-40"
        >
          <span className="size-[60px] rounded-full bg-white" />
        </button>
        <div className="grid w-14 justify-items-center text-center leading-tight">
          <span className="text-[22px] font-medium tabular-nums">{total}</span>
          <span className="text-[11px] text-white/75">fotos</span>
          {pending > 0 && (
            <span className="mt-1 flex items-center gap-1 text-[10.5px] text-white/75">
              <CloudUpload className="size-3" /> {pending}
            </span>
          )}
        </div>
      </div>
      {busy && <Loader2 className="absolute top-1/2 left-1/2 z-10 size-8 -translate-1/2 animate-spin" />}
      {res && <span className="absolute right-3 bottom-1 z-10 text-[10px] text-white/50">{res}</span>}
    </div>
  );
}
