"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { optimizeCloud, optimizeStatus } from "./[oid]/actions";

type Status = Awaited<ReturnType<typeof optimizeStatus>>;

/**
 * Botão "Otimizar para o navegador": o motor converte a nuvem em níveis de detalhe e o
 * visualizador passa a baixar só o que aparece na tela. Acompanha a fila até terminar.
 */
export function OptimizeCloud({
  siteId,
  outputId,
  canEdit,
  queued = false,
  size = "sm",
  onReady,
}: {
  siteId: string;
  outputId: string;
  canEdit: boolean;
  /** Já existe pedido na fila (vindo do servidor). */
  queued?: boolean;
  size?: "sm" | "default";
  onReady?: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [watching, setWatching] = useState(queued);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (!watching) return;
    let alive = true;
    const tick = async () => {
      const s = await optimizeStatus(siteId, outputId).catch(() => null);
      if (!alive || !s) return;
      setStatus(s);
      if (s.ready) {
        setWatching(false);
        toast.success("Nuvem pronta para navegar.");
        if (onReady) onReady();
        else router.refresh();
      } else if (s.job?.status === "falhou") setWatching(false);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [watching, siteId, outputId, router, onReady]);

  const failed = status?.job?.status === "falhou";
  if (watching) {
    const running = status?.job?.status === "rodando";
    return (
      <div className="grid gap-1 text-[13px]">
        <span className="flex items-center gap-2 font-medium">
          <Loader2 className="size-4 animate-spin" />
          {running ? `Otimizando… ${status?.job?.progress ?? 0}%` : "Na fila do motor"}
        </span>
        {status && !status.motorOnline && (
          <span className="text-muted-foreground">O motor está desligado. Ligue no computador do Estúdio com <code>npm run motor</code>.</span>
        )}
      </div>
    );
  }
  if (!canEdit) return <span className="text-[13px] text-muted-foreground">Peça a um editor para otimizar esta nuvem.</span>;
  return (
    <div className="grid gap-1">
      <Button
        size={size}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await optimizeCloud(siteId, outputId);
            if (r.error) return void toast.error(r.error);
            setStatus(null);
            setWatching(true);
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <Zap />} {failed ? "Tentar de novo" : "Otimizar para o navegador"}
      </Button>
      {failed && status?.job?.error && <span className="text-[12.5px] text-destructive">{status.job.error}</span>}
    </div>
  );
}
