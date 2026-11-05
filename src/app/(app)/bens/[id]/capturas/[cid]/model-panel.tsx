"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Box, Download, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtBytes } from "@/lib/format";
import { MIN_FRAMES } from "@/lib/video-frames";
import type { OutputMeta } from "@/lib/model-formats";
import type { schema } from "@/lib/db";
import { modelStatus, requestModel } from "../actions";

type Output = typeof schema.outputs.$inferSelect;
type Job = typeof schema.processingJobs.$inferSelect;
type Report = typeof schema.qualityReports.$inferSelect;

const STAGES: Record<Job["stage"], string> = {
  triagem: "Preparando os quadros",
  alinhamento: "Alinhando os quadros",
  escala: "Calculando a escala",
  nuvem_densa: "Gerando a nuvem de pontos",
  malha: "Gerando o modelo 3D",
  splat: "Gerando o modelo 3D",
  otimizacao: "Enviando os resultados",
  concluido: "Concluído",
};

/** Do conjunto de quadros ao modelo: pede o processamento, acompanha o motor e entrega os resultados. */
export function ModelPanel({
  siteId,
  captureId,
  count,
  pending,
  job: initial,
  report,
  results,
  canCapture,
}: {
  siteId: string;
  captureId: string;
  count: number;
  pending: number;
  job: Job | null;
  report: Report | null;
  results: Output[];
  canCapture: boolean;
}) {
  const router = useRouter();
  const [job, setJob] = useState(initial);
  const [online, setOnline] = useState<boolean | null>(null);
  const [busy, start] = useTransition();
  if (initial && initial.id !== job?.id) setJob(initial);
  const active = job?.status === "na_fila" || job?.status === "rodando";

  useEffect(() => {
    if (!active) return;
    let stop = false;
    const tick = async () => {
      const s = await modelStatus(siteId, captureId).catch(() => null);
      if (stop || !s?.job) return;
      setJob(s.job);
      setOnline(s.motorOnline);
      if (s.job.status === "concluido" || s.job.status === "falhou") router.refresh();
    };
    void tick();
    const id = setInterval(tick, 15000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [active, captureId, router, siteId]);

  const send = () =>
    start(async () => {
      const r = await requestModel(siteId, captureId);
      if (r.error) toast.error(r.error);
      else router.refresh();
    });

  const missing = Math.max(0, MIN_FRAMES - count);
  const blocked = missing > 0 || pending > 0;

  return (
    <section className="grid gap-3 rounded-2xl border bg-card p-4 sm:p-5">
      <div>
        <h2 className="text-[16px] font-medium">Modelo 3D e nuvem de pontos</h2>
        <p className="text-[13px] text-muted-foreground">O motor do ArchRay transforma os quadros da captura em modelo 3D e nuvem de pontos.</p>
      </div>

      {active && job && (
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-[14px]">
            <Loader2 className="size-4 animate-spin" />
            {job.status === "na_fila" ? "Na fila do motor" : STAGES[job.stage]}
            <span className="ml-auto text-muted-foreground tabular-nums">{job.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-foreground transition-[width] duration-500" style={{ width: `${job.progress}%` }} />
          </div>
          <p className="text-[12.5px] text-muted-foreground">
            {online === false
              ? "O computador do motor está desligado ou com o programa fechado. O processamento começa quando ele voltar."
              : "Pode fechar esta página. Uma captura real leva horas, e o resultado aparece aqui."}
          </p>
        </div>
      )}

      {job?.status === "falhou" && (
        <p className="flex gap-2 rounded-xl bg-muted/60 p-3 text-[13px]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> <span className="min-w-0 break-words">Não foi possível gerar o modelo. {job.error}</span>
        </p>
      )}

      {report && report.photosUsed + report.photosDiscarded > 0 && (
        <p className="text-[13px] text-muted-foreground">
          {report.photosUsed} de {report.photosUsed + report.photosDiscarded} quadros aproveitados.
          {report.photosDiscarded > report.photosUsed && " Muitos ficaram de fora: se o modelo saiu incompleto, grave de novo mais devagar."}
        </p>
      )}

      {results.length > 0 && (
        <ul className="grid divide-y rounded-xl border">
          {results.map((o) => (
            <li key={o.id} className="flex items-center gap-3 px-3 py-2.5 text-[13.5px]">
              <Box className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">
                {o.name} <span className="text-muted-foreground">· {fmtBytes(o.bytes)}</span>
              </span>
              {(o.meta as OutputMeta | null)?.viewable && (
                <Button size="sm" variant="secondary" asChild>
                  <Link href={`/bens/${siteId}/modelos/${o.id}`}>Abrir</Link>
                </Button>
              )}
              {o.url && (
                <Button size="icon-sm" variant="ghost" aria-label={`Baixar ${o.name}`} asChild>
                  <a href={o.url} download>
                    <Download />
                  </a>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canCapture && !active && (
        <div className="grid gap-1.5">
          <Button size="lg" className="h-12" disabled={blocked || busy} onClick={send}>
            {busy ? <Loader2 className="animate-spin" /> : job ? <RotateCw /> : <Box />} {job ? "Gerar de novo" : "Gerar modelo 3D"}
          </Button>
          {blocked && (
            <p className="text-[12.5px] text-muted-foreground">
              {pending > 0 ? "Aguarde o envio terminar." : `Faltam ${missing} quadros: grave mais um trecho da fachada.`}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
