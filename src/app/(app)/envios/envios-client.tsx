"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CloudUpload, Loader2, PlugZap, Sun, WifiOff } from "lucide-react";
import { usePendingUploads } from "@/lib/use-pending-uploads";
import { pendingCaptures } from "@/app/(app)/bens/[id]/capturas/actions";
import { useUploader } from "@/app/(app)/bens/[id]/capturas/[cid]/use-uploader";
import { fmtBytes } from "@/lib/format";

type Info = { captureId: string; siteId: string; siteName: string; city: string | null; date: string };

/** Envia uma captura (o hook já tenta sozinho, 2 quadros por vez, e mantém a tela acesa). */
function Sender({ info, orgId }: { info: Info; orgId: string }) {
  const up = useUploader({ siteId: info.siteId, orgId, captureId: info.captureId });
  const pct = Object.values(up.progress);
  return (
    <div className="grid gap-1.5 text-[13px]">
      <div className="flex items-center gap-2">
        {up.online ? <Loader2 className="size-4 animate-spin" /> : <WifiOff className="size-4" />}
        <span>{up.online ? `Enviando… faltam ${up.pending} quadros (${fmtBytes(up.pendingBytes)})` : "Sem conexão. Continua sozinho quando o sinal voltar."}</span>
      </div>
      {pct.length > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-foreground transition-[width]" style={{ width: `${Math.round(pct.reduce((a, b) => a + b, 0) / pct.length)}%` }} />
        </div>
      )}
      {up.error && (
        <p className="text-destructive">
          {up.error}{" "}
          <button className="underline underline-offset-2" onClick={up.retry}>
            Tentar de novo
          </button>
        </p>
      )}
    </div>
  );
}

/**
 * Fila de envio do aparelho: todas as capturas gravadas e ainda não enviadas, de todos os projetos.
 * Envia uma de cada vez, na ordem da lista. Pensada para o escritório: Wi-Fi, carregador e tela acesa.
 */
export function EnviosClient() {
  const { summary, total, bytes } = usePendingUploads(3000);
  const ids = useMemo(() => Object.keys(summary).sort(), [summary]);
  const key = ids.join(",");
  const [data, setData] = useState<{ orgId: string; items: Info[] } | null>(null);

  useEffect(() => {
    if (!key) return;
    let alive = true;
    pendingCaptures(key.split(","))
      .then((r) => alive && setData(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [key]);

  const items = (data?.items ?? []).filter((i) => summary[i.captureId]?.count);
  const unknown = ids.filter((id) => data && !data.items.some((i) => i.captureId === id));
  const current = items[0];

  if (total === 0) {
    return (
      <div className="grid justify-items-center gap-3 rounded-xl border bg-card p-10 text-center">
        <CheckCircle2 className="size-8 text-emerald-600" />
        <p className="text-[16px] font-medium">Nada para enviar neste aparelho.</p>
        <p className="max-w-md text-[14px] text-muted-foreground">Tudo o que foi gravado aqui já está no ArchRay. Gravações novas aparecem nesta tela até terminarem de subir.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-xl border bg-card p-5 sm:grid-cols-3">
        <p className="flex items-start gap-2.5 text-[13.5px]">
          <PlugZap className="mt-0.5 size-4 shrink-0" />
          <span>
            Deixe o celular no <b className="font-medium">carregador</b>, com <b className="font-medium">Wi-Fi</b>.
          </span>
        </p>
        <p className="flex items-start gap-2.5 text-[13.5px]">
          <Sun className="mt-0.5 size-4 shrink-0" />
          <span>
            A tela fica <b className="font-medium">acesa sozinha</b> enquanto envia. Não precisa tocar nela.
          </span>
        </p>
        <p className="flex items-start gap-2.5 text-[13.5px]">
          <CloudUpload className="mt-0.5 size-4 shrink-0" />
          <span>Pode sair e voltar depois: o que faltar continua guardado no celular.</span>
        </p>
      </div>

      <p className="text-[14px] text-muted-foreground">
        {total} quadros guardados neste aparelho · {fmtBytes(bytes)}
      </p>

      <ul className="grid gap-2">
        {items.map((i, n) => (
          <li key={i.captureId} className="grid gap-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 leading-tight">
                <Link href={`/bens/${i.siteId}/capturas/${i.captureId}`} className="truncate text-[15px] font-medium hover:underline">
                  {i.siteName}
                </Link>
                <p className="text-[12.5px] text-muted-foreground">
                  {[i.city, new Date(`${i.date}T12:00:00`).toLocaleDateString("pt-BR")].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="shrink-0 text-[12.5px] text-muted-foreground tabular-nums">
                {summary[i.captureId]!.count} quadros · {fmtBytes(summary[i.captureId]!.bytes)}
              </span>
            </div>
            {n === 0 && current && data ? <Sender key={current.captureId} info={current} orgId={data.orgId} /> : <p className="text-[13px] text-muted-foreground">Na fila</p>}
          </li>
        ))}
      </ul>

      {unknown.length > 0 && (
        <p className="text-[12.5px] text-muted-foreground">
          {unknown.length === 1 ? "Uma captura guardada aqui é" : `${unknown.length} capturas guardadas aqui são`} de outra conta ou foi apagada; entre com a conta certa para enviá-la.
        </p>
      )}
    </div>
  );
}
