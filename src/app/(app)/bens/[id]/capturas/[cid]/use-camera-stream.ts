"use client";

import { useEffect, useRef, useState } from "react";

/** Abre a câmera traseira na maior resolução oferecida e mantém a tela ligada enquanto a tela está aberta. */
export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [res, setRes] = useState("");

  useEffect(() => {
    let cancelled = false;
    let wake: { release: () => Promise<void> } | null = null;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador não dá acesso à câmera. Use a opção "Da galeria".');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 4096 }, height: { ideal: 3072 } },
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        setRes(`${v.videoWidth}×${v.videoHeight}`);
        setReady(true);
        try {
          wake = (await (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<typeof wake> } }).wakeLock?.request("screen")) ?? null;
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

  return { videoRef, streamRef, ready, res, error, setError };
}
