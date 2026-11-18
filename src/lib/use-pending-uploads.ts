"use client";

import { useEffect, useState } from "react";
import { queue, type QueueSummary } from "@/lib/capture-queue";

/** Pendências de envio guardadas neste aparelho (atualiza ao voltar para a página e a cada 5 s). */
export function usePendingUploads(intervalMs = 5000) {
  const [summary, setSummary] = useState<QueueSummary>({});
  useEffect(() => {
    let alive = true;
    const read = () =>
      queue
        .summary()
        .then((s) => alive && setSummary(s))
        .catch(() => {});
    read();
    const id = setInterval(read, intervalMs);
    document.addEventListener("visibilitychange", read);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", read);
    };
  }, [intervalMs]);
  const total = Object.values(summary).reduce((a, r) => a + r.count, 0);
  const bytes = Object.values(summary).reduce((a, r) => a + r.bytes, 0);
  return { summary, total, bytes };
}
