"use client";

import { useEffect } from "react";

type Sentinel = { release: () => Promise<void>; addEventListener?: (t: "release", f: () => void) => void };
type WakeLockApi = { request: (t: "screen") => Promise<Sentinel> };

/**
 * Mantém a tela acesa enquanto `active` for verdadeiro (Screen Wake Lock: Chrome/Android e
 * Safari/iPhone 16.4+). O navegador solta a trava quando a página sai da frente; ela é pedida de
 * novo quando a página volta. Sem suporte, não faz nada.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const api = (navigator as unknown as { wakeLock?: WakeLockApi }).wakeLock;
    if (!api) return;
    let lock: Sentinel | null = null;
    let done = false;
    const take = async () => {
      if (done || document.visibilityState !== "visible" || lock) return;
      try {
        lock = await api.request("screen");
        lock.addEventListener?.("release", () => (lock = null));
        if (done) void lock.release().catch(() => {});
      } catch {
        // bateria fraca, aba em segundo plano ou permissão negada: segue sem a trava
      }
    };
    const onVis = () => void take();
    void take();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      done = true;
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release().catch(() => {});
      lock = null;
    };
  }, [active]);
}
