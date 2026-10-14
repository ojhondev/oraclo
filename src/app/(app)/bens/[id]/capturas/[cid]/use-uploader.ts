"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { queue, newId, persistStorage, type QueuedPhoto } from "@/lib/capture-queue";
import { registerFile } from "../actions";

const CONCURRENCY = 2;

type Meta = Omit<QueuedPhoto, "id" | "captureId" | "attempts">;

/**
 * Envio em lote das fotos guardadas no aparelho: 2 de cada vez, com novas tentativas
 * (espera crescente), retomando sozinho quando a conexão volta ou a página reabre.
 */
export function useUploader({ siteId, orgId, captureId }: { siteId: string; orgId: string; captureId: string }) {
  const [pending, setPending] = useState<QueuedPhoto[]>([]);
  /** Fotos enviadas nesta sessão (o total vem do servidor). */
  const [uploaded, setUploaded] = useState(0);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const inflight = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopped = useRef(false);

  const reload = useCallback(async () => {
    const list = await queue.list(captureId);
    list.sort((a, b) => a.takenAt.localeCompare(b.takenAt));
    setPending(list);
    return list;
  }, [captureId]);

  const uploadOne = useCallback(
    async (p: QueuedPhoto) => {
      const ext = p.type === "image/png" ? "png" : p.type === "image/webp" ? "webp" : p.type.includes("hei") ? "heic" : "jpg";
      const blob = await upload(`orgs/${orgId}/sites/${siteId}/capturas/${captureId}/v${p.pass}-${p.id}.${ext}`, p.blob, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ siteId, captureId }),
        contentType: p.type,
        multipart: p.blob.size > 15 * 1024 * 1024,
        onUploadProgress: (e) => setProgress((m) => ({ ...m, [p.id]: e.percentage })),
      });
      await registerFile(siteId, captureId, {
        clientId: p.id,
        url: blob.url,
        pathname: blob.pathname,
        filename: p.name,
        contentType: p.type,
        bytes: p.blob.size,
        width: p.width,
        height: p.height,
        sharpness: p.sharpness,
        pass: p.pass,
        takenAt: p.takenAt,
      });
    },
    [captureId, orgId, siteId],
  );

  const pump = useCallback(async () => {
    if (stopped.current || !navigator.onLine) return;
    const list = await reload();
    for (const p of list) {
      if (inflight.current.size >= CONCURRENCY) break;
      if (inflight.current.has(p.id)) continue;
      inflight.current.add(p.id);
      setActive(inflight.current.size);
      uploadOne(p)
        .then(async () => {
          await queue.remove(p.id);
          setUploaded((n) => n + 1);
          setError(null);
        })
        .catch(async (e: Error) => {
          const msg = e?.message || "Falha no envio.";
          setError(msg);
          if (/Sessão expirada|Sem permissão|não encontrad/i.test(msg)) stopped.current = true;
          await queue.put({ ...p, attempts: p.attempts + 1 });
          const wait = Math.min(30_000, 1000 * 2 ** Math.min(p.attempts + 1, 5));
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => void pump(), wait);
        })
        .finally(() => {
          inflight.current.delete(p.id);
          setActive(inflight.current.size);
          setProgress((m) => {
            const { [p.id]: _, ...rest } = m;
            void _;
            return rest;
          });
          void pump();
        });
    }
  }, [reload, uploadOne]);

  useEffect(() => {
    void persistStorage();
    const on = () => {
      setOnline(true);
      void pump();
    };
    const off = () => setOnline(false);
    const vis = () => document.visibilityState === "visible" && void pump();
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    document.addEventListener("visibilitychange", vis);
    // estado inicial + retoma o que ficou no aparelho
    queueMicrotask(() => {
      setOnline(navigator.onLine);
      void pump();
    });
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      document.removeEventListener("visibilitychange", vis);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pump]);

  const add = useCallback(
    async (meta: Meta) => {
      const p: QueuedPhoto = { ...meta, id: newId(), captureId, attempts: 0 };
      await queue.add(p);
      stopped.current = false;
      await reload();
      void pump();
    },
    [captureId, pump, reload],
  );

  const pendingBytes = pending.reduce((a, p) => a + p.blob.size, 0);
  return { add, pending: pending.length, pendingBytes, uploaded, active, progress, error, online, retry: () => ((stopped.current = false), void pump()) };
}
