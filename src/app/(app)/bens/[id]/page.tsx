import type { Metadata } from "next";
import Link from "next/link";
import { Box, Camera, FileText, ImagePlus, MapPin, Pencil, ShieldCheck } from "lucide-react";
import { capturers, editors, requireUser } from "@/lib/auth";
import { getSite, getSiteDetail } from "@/lib/sites";
import { loadDiagnosis } from "@/lib/diagnosis";
import { fmtArea, fmtLength, fmtMmPerPixel } from "@/lib/geometry";
import { fmtBRL } from "@/lib/pricing";
import type { OutputMeta } from "@/lib/model-formats";
import { captureStatuses, elementKinds, protectionLevels, purposes, severities, siteKinds, vistaKinds } from "@/lib/labels";
import { fmtBytes, fmtDate, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageBody, PageHeader } from "@/components/page-header";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteCampaign, deleteElement } from "../actions";
import { AddCampaignForm, AddElementForm, NewCaptureForm } from "./panels";
import { startCapture } from "./capturas/actions";

export async function generateMetadata({ params }: PageProps<"/bens/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const site = await getSite(user.orgId, id);
  return { title: site.name };
}

function Section({
  title,
  description,
  children,
  action,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid content-start gap-4 rounded-2xl border bg-card p-5", className)}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-medium leading-tight">{title}</h2>
          {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card px-4 py-3.5">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-[24px] font-medium leading-none tabular-nums">{value}</div>
      {hint && <div className="mt-1.5 text-[11.5px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** Barra horizontal simples (sem biblioteca de gráficos). */
function Bar({ label, value, max, right, color }: { label: React.ReactNode; value: number; max: number; right: string; color?: string }) {
  return (
    <li className="grid gap-1">
      <div className="flex items-baseline gap-2 text-[12.5px]">
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="text-muted-foreground tabular-nums">{right}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground"
          style={{ width: `${max > 0 ? Math.max(2, (value / max) * 100) : 0}%`, ...(color && { background: color }) }}
        />
      </div>
    </li>
  );
}

const PRIORITY_SHADES = ["bg-foreground", "bg-foreground/70", "bg-foreground/45", "bg-foreground/20"];
const PRIORITY_NAMES = ["Imediata", "Curto prazo", "Médio prazo", "Monitorar"];

export default async function SitePage({ params, searchParams }: PageProps<"/bens/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const vistoria = typeof sp.vistoria === "string" ? sp.vistoria : null;
  const user = await requireUser();
  const [{ site, elements, campaigns, outputs }, dx] = await Promise.all([
    getSiteDetail(user.orgId, id),
    loadDiagnosis(user.orgId, id, vistoria),
  ]);
  const canEdit = editors.includes(user.role);
  const canCapture = capturers.includes(user.role);
  const elementName = Object.fromEntries(elements.map((e) => [e.id, e.name]));
  const qs = dx.campaign ? `?vistoria=${dx.campaign.id}` : "";
  const viewable = outputs.filter((o) => (o.meta as OutputMeta | null)?.viewable);

  const facts: [string, string | null][] = [
    ["Tipo", siteKinds[site.kind]],
    ["Ano / período", site.period],
    ...(site.protection !== "nenhuma" || site.protectionBody
      ? ([
          ["Proteção", protectionLevels[site.protection]],
          ["Órgão", site.protectionBody],
          ["Processo / inscrição", site.processNumber],
        ] as [string, string | null][])
      : []),
    ["Endereço", [site.address, site.city, site.state].filter(Boolean).join(", ") || null],
  ];

  const maxType = Math.max(0, ...dx.byType.map((r) => r.cents));
  const maxSev = Math.max(0, ...dx.bySeverity.map((r) => r.count));
  const maxEl = Math.max(0, ...dx.byElement.map((r) => r.cents));
  const totalPrio = dx.byPriority.reduce((s, r) => s + r.count, 0);

  return (
    <>
      <PageHeader
        eyebrow={siteKinds[site.kind]}
        title={site.name}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {(site.city || site.state) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {[site.city, site.state].filter(Boolean).join(" · ")}
              </span>
            )}
            {site.protection !== "nenhuma" && (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="size-3.5" /> {site.protectionBody || protectionLevels[site.protection]}
              </span>
            )}
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2" data-tour="project-actions">
            {canEdit && (
              <Button variant="outline" asChild>
                <Link href={`/bens/${site.id}/editar`}>
                  <Pencil /> Editar ficha
                </Link>
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" asChild>
                <Link href={`/bens/${site.id}/ortofotos/nova${qs}`}>
                  <ImagePlus /> Nova vista
                </Link>
              </Button>
            )}
            <Button asChild>
              <a href={`/bens/${site.id}/laudo${qs}`} target="_blank" rel="noreferrer">
                <FileText /> Gerar laudo
              </a>
            </Button>
          </div>
        }
      />
      <PageBody className="grid gap-5">
        {/* filtro por vistoria */}
        {dx.campaigns.length > 0 && (
          <nav className="-mb-1 flex flex-wrap items-center gap-1.5 text-[13px]" aria-label="Filtrar por vistoria">
            <span className="mr-1 text-muted-foreground">Vistoria:</span>
            {[{ id: null as string | null, name: "Todas" }, ...dx.campaigns].map((c) => {
              const active = (dx.campaign?.id ?? null) === c.id;
              return (
                <Link
                  key={c.id ?? "all"}
                  href={c.id ? `/bens/${site.id}?vistoria=${c.id}` : `/bens/${site.id}`}
                  className={cn(
                    "rounded-full border px-3 py-1 transition-colors",
                    active ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40",
                  )}
                >
                  {c.name}
                </Link>
              );
            })}
          </nav>
        )}

        {/* indicadores */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" data-tour="kpis">
          <Kpi label="Danos apontados" value={String(dx.kpis.damages)} hint={`em ${dx.vistas.length} vista${dx.vistas.length === 1 ? "" : "s"}`} />
          <Kpi label="Área afetada" value={fmtArea(dx.kpis.areaM2)} />
          <Kpi label="Fissuras e linhas" value={fmtLength(dx.kpis.cracksM)} />
          <Kpi
            label="Orçamento estimado"
            value={fmtBRL(dx.kpis.totalCents)}
            hint={dx.kpis.missing ? `${dx.kpis.missing} dano(s) sem escala, fora da soma` : "tratamento de todos os danos"}
          />
          <Kpi label="Prioridade 1 (imediata)" value={String(dx.kpis.urgent)} hint="GUT ≥ 64" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="grid content-start gap-5">
            <Section
              title="Vistas do imóvel"
              description="Fachadas retificadas, plantas e imagens em escala. Abra uma vista para apontar os danos."
              action={
                canEdit && (
                  <Button size="sm" asChild>
                    <Link href={`/bens/${site.id}/ortofotos/nova${qs}`}>
                      <ImagePlus /> Nova vista
                    </Link>
                  </Button>
                )
              }
            >
              {dx.vistas.length === 0 ? (
                <div className="grid gap-2 rounded-xl border border-dashed p-6 text-center">
                  <p className="text-[14px] font-medium">Nenhuma vista {dx.campaign ? "nesta vistoria" : "ainda"}</p>
                  <p className="text-[13px] text-muted-foreground">
                    Tire uma foto da fachada com o celular, marque os 4 cantos e informe as medidas: o Oraclo corrige a
                    perspectiva e você aponta os danos em escala.
                  </p>
                  {canEdit && (
                    <div>
                      <Button size="sm" asChild>
                        <Link href={`/bens/${site.id}/ortofotos/nova${qs}`}>Criar a primeira vista</Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                  {dx.vistas.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/bens/${site.id}/ortofotos/${o.id}`}
                        className="group block overflow-hidden rounded-xl border transition-colors hover:border-foreground/40"
                      >
                        <div className="relative aspect-[4/3] bg-canvas">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={o.url} alt="" loading="lazy" className="size-full object-contain" />
                          <Badge variant="secondary" className="absolute top-2 left-2">
                            {vistaKinds[o.kind]}
                          </Badge>
                        </div>
                        <div className="grid gap-0.5 p-3">
                          <span className="flex items-baseline gap-2">
                            <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{o.name}</span>
                            <span className="text-[12.5px] tabular-nums">{fmtBRL(o.costCents)}</span>
                          </span>
                          <span className="text-[12px] text-muted-foreground">
                            {[o.elementName, `${o.damageCount} ${o.damageCount === 1 ? "dano" : "danos"}`, o.mmPerPixel ? fmtMmPerPixel(o.mmPerPixel) : "sem escala"]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {dx.kpis.damages > 0 && (
              <div className="grid gap-5 lg:grid-cols-2">
                <Section title="Custo por tipo de dano">
                  <ul className="grid gap-2.5">
                    {dx.byType.map((r) => (
                      <Bar
                        key={r.typeId}
                        label={
                          <>
                            {r.type.name}{" "}
                            <span className="text-muted-foreground">
                              · {r.type.geometry === "area" ? fmtArea(r.qty) : r.type.geometry === "linha" ? fmtLength(r.qty) : `${r.count} un.`}
                            </span>
                          </>
                        }
                        value={r.cents}
                        max={maxType}
                        right={fmtBRL(r.cents)}
                        color={r.type.color}
                      />
                    ))}
                  </ul>
                </Section>
                <div className="grid content-start gap-5">
                  <Section title="Prioridade (matriz GUT)">
                    <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                      {dx.byPriority.map((r, i) =>
                        r.count ? <div key={r.level} className={PRIORITY_SHADES[i]} style={{ width: `${(r.count / totalPrio) * 100}%` }} /> : null,
                      )}
                    </div>
                    <ul className="grid gap-1 text-[12.5px]">
                      {dx.byPriority.map((r, i) => (
                        <li key={r.level} className="flex items-center gap-2">
                          <span className={cn("size-2.5 rounded-full", PRIORITY_SHADES[i])} />
                          <span className="flex-1">{PRIORITY_NAMES[i]}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {r.count} · {fmtBRL(r.cents)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                  <Section title="Gravidade">
                    <ul className="grid gap-2.5">
                      {dx.bySeverity.map((r) => (
                        <Bar key={r.severity} label={severities[r.severity]} value={r.count} max={maxSev} right={String(r.count)} />
                      ))}
                    </ul>
                  </Section>
                </div>
              </div>
            )}

            {dx.priorities.length > 0 && (
              <Section
                title="Lista de prioridades"
                description="Danos ordenados pelo GUT (gravidade × urgência × tendência). Clique para abrir na vista."
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="text-left text-[12px] text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-2 pr-3 font-normal">GUT</th>
                        <th className="py-2 pr-3 font-normal">Dano</th>
                        <th className="py-2 pr-3 font-normal">Vista</th>
                        <th className="py-2 pr-3 font-normal">Quantidade</th>
                        <th className="py-2 text-right font-normal">Custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dx.priorities.slice(0, 15).map((d) => (
                        <tr key={d.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 pr-3">
                            <span className="inline-flex min-w-9 justify-center rounded-full border px-2 py-0.5 text-[12px] font-medium tabular-nums">
                              {d.gut}
                            </span>
                          </td>
                          <td className="py-2 pr-3">
                            <Link
                              href={`/bens/${site.id}/ortofotos/${d.orthophotoId}?dano=${d.id}`}
                              className="inline-flex items-center gap-2 hover:underline"
                            >
                              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.type.color }} />
                              {d.type.name}
                            </Link>
                            <div className="text-[11.5px] text-muted-foreground">
                              {severities[d.severity]} · {d.priority.label.split(" — ")[1]}
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground">{d.vistaName}</td>
                          <td className="py-2 pr-3 tabular-nums text-muted-foreground">
                            {d.type.geometry === "area" ? fmtArea(d.areaM2) : d.type.geometry === "linha" ? fmtLength(d.lengthM) : "1 un."}
                          </td>
                          <td className="py-2 text-right tabular-nums">{d.costCents == null ? "—" : fmtBRL(d.costCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {dx.priorities.length > 15 && (
                  <p className="text-[12px] text-muted-foreground">Mostrando 15 de {dx.priorities.length}. O laudo traz a lista completa.</p>
                )}
              </Section>
            )}
          </div>

          <div className="grid content-start gap-5">
            {dx.byElement.length > 1 && (
              <Section title="Custo por área">
                <ul className="grid gap-2.5">
                  {dx.byElement.map((r) => (
                    <Bar key={r.name} label={`${r.name} · ${r.count} ${r.count === 1 ? "dano" : "danos"}`} value={r.cents} max={maxEl} right={fmtBRL(r.cents)} />
                  ))}
                </ul>
              </Section>
            )}

            <Section
              title="Vistorias"
              description="Cada visita ao imóvel (vistoria inicial, monitoramento, obra) agrupa as vistas, os danos e as fotos de campo daquela data."
            >
              {canEdit && <AddCampaignForm siteId={site.id} today={todayISO()} />}
              {campaigns.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">Nenhuma vistoria ainda.</p>
              ) : (
                <ul className="grid gap-3">
                  {campaigns.map((c) => (
                    <li key={c.id} className="rounded-xl border p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/bens/${site.id}?vistoria=${c.id}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                        <Badge variant="secondary">{purposes[c.purpose]}</Badge>
                        <span className="text-[12.5px] text-muted-foreground">{fmtDate(c.date)}</span>
                        {canEdit && (
                          <span className="ml-auto">
                            <ConfirmButton
                              action={deleteCampaign.bind(null, site.id, c.id)}
                              title="Excluir esta vistoria?"
                              description="As fotos de campo dela também serão apagadas. As vistas ficam no projeto, sem vistoria."
                              size="icon-sm"
                            />
                          </span>
                        )}
                      </div>
                      {c.captures.length > 0 && (
                        <ul className="mt-2 grid gap-0.5">
                          {c.captures.map((k) => (
                            <li key={k.id}>
                              <Link
                                href={`/bens/${site.id}/capturas/${k.id}`}
                                className="-mx-2 flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] hover:bg-muted"
                              >
                                <Camera className="size-3.5 text-muted-foreground" />
                                <span>{k.elementId ? elementName[k.elementId] : "Fotos de campo"}</span>
                                <span className="text-muted-foreground">
                                  · {k.fileCount} fotos ({fmtBytes(k.totalBytes)})
                                </span>
                                <span className="ml-auto text-[11.5px] text-muted-foreground">{captureStatuses[k.status]}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                      {canCapture && (
                        <NewCaptureForm
                          action={startCapture.bind(null, site.id, c.id)}
                          elements={elements.map((e) => ({ value: e.id, label: e.name }))}
                          canImportModel={canEdit}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Áreas" description="Partes do imóvel: fachadas, pavimentos, ambientes, cobertura. Cada vista e cada dano fica ligado a uma área.">
              {canEdit && <AddElementForm siteId={site.id} empty={elements.length === 0} />}
              {elements.length > 0 && (
                <ul className="grid divide-y rounded-lg border">
                  {elements.map((e) => (
                    <li key={e.id} className="flex items-center gap-2 px-3 py-2 text-[13.5px]">
                      <span className="flex-1">{e.name}</span>
                      <span className="text-[12px] text-muted-foreground">{elementKinds[e.kind]}</span>
                      {canEdit && <ConfirmButton action={deleteElement.bind(null, site.id, e.id)} title={`Excluir "${e.name}"?`} size="icon-sm" />}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {viewable.length > 0 && (
              <Section title="Modelos 3D" description="Opcional: gere vistas em escala das paredes a partir de um modelo 3D importado.">
                <ul className="grid gap-1.5">
                  {viewable.map((o) => (
                    <li key={o.id} className="flex items-center gap-2 text-[13px]">
                      <Box className="size-3.5 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{o.name}</span>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/bens/${site.id}/modelos/${o.id}`}>Abrir</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Ficha do projeto">
              <dl className="grid gap-3 text-[13.5px]">
                {facts.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[130px_1fr] gap-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd>{v || "—"}</dd>
                  </div>
                ))}
              </dl>
              {site.description && <p className="border-t pt-3 text-[13.5px] whitespace-pre-line text-foreground/85">{site.description}</p>}
            </Section>
          </div>
        </div>
      </PageBody>
    </>
  );
}
