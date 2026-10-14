"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { BadgeCheck, Box, CircleAlert, Download, FileUp, Loader2, Rocket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fmtBytes } from "@/lib/format";
import { ACCEPTED_EXTENSIONS, formatOf, MODEL_FORMATS, type OutputMeta } from "@/lib/model-formats";
import type { schema } from "@/lib/db";
import { deleteOutput, publishResult, registerOutput, saveQualityReport } from "../actions";

type Output = typeof schema.outputs.$inferSelect;
type Report = typeof schema.qualityReports.$inferSelect;
type Distance = typeof schema.controlDistances.$inferSelect;

const mm = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v).toLocaleString("pt-BR")} mm`);

export function CaptureResults({
  siteId,
  orgId,
  captureId,
  status,
  results,
  report,
  distances,
  canEdit,
}: {
  siteId: string;
  orgId: string;
  captureId: string;
  status: string;
  results: Output[];
  report: Report | null;
  distances: Distance[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ name: string; pct: number } | null>(null);
  const [busy, start] = useTransition();

  async function sendFiles(list: FileList | null) {
    if (!list?.length) return;
    for (const file of Array.from(list)) {
      if (!formatOf(file.name)) {
        toast.error(`${file.name}: formato não aceito.`);
        continue;
      }
      setUploading({ name: file.name, pct: 0 });
      try {
        const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
        const blob = await upload(`orgs/${orgId}/sites/${siteId}/capturas/${captureId}/resultado/${safe}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          clientPayload: JSON.stringify({ siteId, captureId, kind: "resultado" }),
          contentType: file.type || "application/octet-stream",
          multipart: file.size > 20 * 1024 * 1024,
          onUploadProgress: (p) => setUploading({ name: file.name, pct: p.percentage }),
        });
        await registerOutput(siteId, captureId, { url: blob.url, pathname: blob.pathname, name: file.name, bytes: file.size });
        toast.success(`${file.name} enviado.`);
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message}`);
      }
    }
    setUploading(null);
    router.refresh();
  }

  function saveReport(form: FormData) {
    const num = (k: string) => {
      const v = String(form.get(k) ?? "").replace(",", ".").trim();
      return v === "" ? null : Number(v);
    };
    start(async () => {
      try {
        await saveQualityReport(siteId, captureId, {
          photosUsed: num("photosUsed") ?? 0,
          photosDiscarded: num("photosDiscarded") ?? 0,
          reprojectionErrorPx: num("reproj"),
          distances: distances.map((d) => {
            const m = num(`d-${d.id}`);
            return { id: d.id, modelMm: m == null ? null : Math.round(m * 1000) };
          }),
        });
        toast.success("Relatório de qualidade salvo.");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  if (!results.length && !canEdit) return null;

  return (
    <section className="grid gap-5 rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[16px] font-medium">Resultado do processamento</h2>
        {report && (
          <Badge variant={report.approved ? "default" : "outline"} className="gap-1">
            {report.approved ? <BadgeCheck className="size-3.5" /> : <CircleAlert className="size-3.5" />}
            {report.approved ? "Apto para levantamento cadastral" : "Não apto (erro acima de 30 mm ou medidas insuficientes)"}
          </Badge>
        )}
      </div>

      {/* arquivos */}
      <div className="grid gap-2">
        {results.length === 0 ? (
          <p className="text-[13.5px] text-muted-foreground">
            Nenhum arquivo ainda. Depois de processar as fotos (RealityScan, COLMAP…), envie aqui a nuvem de pontos e a malha.
            Para ver no navegador, inclua uma versão em <b className="font-medium text-foreground">PLY, LAS, XYZ ou GLB</b>; E57, LAZ e OBJ ficam para download.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {results.map((o) => {
              const meta = (o.meta ?? {}) as OutputMeta;
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-[14px]">
                  <Box className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{o.name}</span>
                  <span className="text-[12.5px] text-muted-foreground">
                    {MODEL_FORMATS[o.format]?.label ?? o.format.toUpperCase()} · {fmtBytes(o.bytes)}
                  </span>
                  <span className="flex items-center gap-1">
                    {meta.viewable && (
                      <Button size="sm" asChild>
                        <Link href={`/bens/${siteId}/modelos/${o.id}`}>Ver em 3D</Link>
                      </Button>
                    )}
                    {o.url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`${o.url}?download=1`}>
                          <Download /> Baixar
                        </a>
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Excluir arquivo"
                        onClick={() => start(async () => {
                          await deleteOutput(siteId, captureId, o.id);
                          router.refresh();
                        })}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={!!uploading}>
              {uploading ? <Loader2 className="animate-spin" /> : <FileUp />}
              {uploading ? `Enviando ${uploading.name} · ${Math.round(uploading.pct)}%` : "Enviar arquivos de resultado"}
            </Button>
            <span className="text-[12.5px] text-muted-foreground">E57, LAS, LAZ, PLY, XYZ, PTS, GLB, OBJ, FBX, ZIP ou PDF · até 5 GB cada</span>
            <input ref={inputRef} type="file" multiple accept={ACCEPTED_EXTENSIONS} className="sr-only" onChange={(e) => { void sendFiles(e.target.files); e.target.value = ""; }} />
          </div>
        )}
      </div>

      {/* relatório de qualidade */}
      {(report || canEdit) && (
        <div className="grid gap-3">
          <h3 className="text-[14px] font-medium">Relatório de qualidade</h3>
          {report && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-4">
              <div><dt className="text-muted-foreground">Fotos usadas</dt><dd>{report.photosUsed} <span className="text-muted-foreground">(+{report.photosDiscarded} descartadas)</span></dd></div>
              <div><dt className="text-muted-foreground">Erro de reprojeção</dt><dd>{report.reprojectionErrorPx == null ? "—" : `${report.reprojectionErrorPx.toLocaleString("pt-BR")} px`}</dd></div>
              <div><dt className="text-muted-foreground">Erro médio (RMS)</dt><dd>{mm(report.rmsResidualMm)}</dd></div>
              <div><dt className="text-muted-foreground">Maior erro</dt><dd>{mm(report.maxResidualMm)}</dd></div>
            </dl>
          )}
          {distances.length > 0 && (
            <form action={saveReport} className="grid gap-3">
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-[13.5px]">
                  <thead className="bg-muted/60 text-left text-[12.5px] text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-normal">Medida</th>
                      <th className="px-3 py-2 font-normal">Trena</th>
                      <th className="px-3 py-2 font-normal">No modelo</th>
                      <th className="px-3 py-2 font-normal">Erro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {distances.map((d) => (
                      <tr key={d.id}>
                        <td className="px-3 py-1.5">{d.targetA} ↔ {d.targetB}</td>
                        <td className="px-3 py-1.5 tabular-nums">{(d.measuredMm / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 3 })} m</td>
                        <td className="px-3 py-1.5">
                          {canEdit ? (
                            <Input
                              name={`d-${d.id}`}
                              inputMode="decimal"
                              placeholder="m"
                              defaultValue={d.modelMm == null ? "" : (d.modelMm / 1000).toFixed(3).replace(".", ",")}
                              className="h-8 w-28"
                            />
                          ) : (
                            d.modelMm == null ? "—" : `${(d.modelMm / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 3 })} m`
                          )}
                        </td>
                        <td className="px-3 py-1.5 tabular-nums">{d.residualMm == null ? "—" : `${d.residualMm > 0 ? "+" : ""}${d.residualMm} mm`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {canEdit && (
                <div className="flex flex-wrap items-end gap-2">
                  <label className="grid gap-1 text-[12.5px] text-muted-foreground">
                    Fotos usadas
                    <Input name="photosUsed" inputMode="numeric" defaultValue={report?.photosUsed ?? ""} className="h-8 w-24" />
                  </label>
                  <label className="grid gap-1 text-[12.5px] text-muted-foreground">
                    Descartadas
                    <Input name="photosDiscarded" inputMode="numeric" defaultValue={report?.photosDiscarded ?? ""} className="h-8 w-24" />
                  </label>
                  <label className="grid gap-1 text-[12.5px] text-muted-foreground">
                    Reprojeção (px)
                    <Input name="reproj" inputMode="decimal" defaultValue={report?.reprojectionErrorPx ?? ""} className="h-8 w-24" />
                  </label>
                  <Button type="submit" size="sm" variant="secondary" disabled={busy}>
                    {busy && <Loader2 className="animate-spin" />} Salvar relatório
                  </Button>
                </div>
              )}
            </form>
          )}
          {distances.length === 0 && (
            <p className="text-[13px] text-muted-foreground">Esta captura não tem medidas de controle — o modelo fica sem verificação de escala.</p>
          )}
        </div>
      )}

      {canEdit && status !== "concluida" && results.length > 0 && (
        <Button
          size="lg"
          onClick={() => start(async () => {
            try {
              await publishResult(siteId, captureId);
              toast.success("Resultado publicado.");
              router.refresh();
            } catch (e) {
              toast.error((e as Error).message);
            }
          })}
          disabled={busy}
        >
          <Rocket /> Publicar resultado (marcar captura como concluída)
        </Button>
      )}
    </section>
  );
}
