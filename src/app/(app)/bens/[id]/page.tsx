import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Box, Camera, FileText, ImagePlus, MapPin, Pencil, ShieldCheck } from "lucide-react";
import { capturers, editors, requireUser } from "@/lib/auth";
import { getSite, getSiteDetail } from "@/lib/sites";
import { loadDiagnosis } from "@/lib/diagnosis";
import { fmtArea, fmtLength, fmtMmPerPixel } from "@/lib/geometry";
import { fmtBRL } from "@/lib/pricing";
import { nextStep } from "@/lib/next-step";
import type { OutputMeta } from "@/lib/model-formats";
import { elementKinds, protectionLevels, purposes, severities, siteKinds, vistaKinds } from "@/lib/labels";
import { fmtBytes, fmtDate, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BetaBadge } from "@/components/beta-badge";
import { EmptyState, PageBody, PageHeader } from "@/components/page-header";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteCampaign, deleteElement } from "../actions";
import { AddCampaignForm, AddElementForm, NewCaptureForm } from "./panels";
import { ImportModelForm } from "./import-model";
import { Bar, Kpi, PriorityBar, Section, TabBar, parseTab, tabHref, type TabId } from "./project-ui";
import { startCapture } from "./capturas/actions";

export async function generateMetadata({ params }: PageProps<"/bens/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const site = await getSite(user.orgId, id);
  return { title: site.name };
}

export default async function SitePage({ params, searchParams }: PageProps<"/bens/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const vistoria = typeof sp.vistoria === "string" ? sp.vistoria : null;
  const tab = parseTab(sp.aba);
  const user = await requireUser();
  const [{ site, elements, campaigns, outputs }, dx] = await Promise.all([
    getSiteDetail(user.orgId, id),
    loadDiagnosis(user.orgId, id, vistoria),
  ]);
  const canEdit = editors.includes(user.role);
  const canCapture = capturers.includes(user.role);
  const elementName = Object.fromEntries(elements.map((e) => [e.id, e.name]));
  const qs = dx.campaign ? `?vistoria=${dx.campaign.id}` : "";
  const models = outputs.filter((o) => (o.meta as OutputMeta | null)?.viewable);
  const vistoriaId = dx.campaign?.id ?? null;
  const step = nextStep({ elements: elements.length, campaigns: campaigns.length, vistas: dx.vistas.length, damages: dx.kpis.damages });
  const link = (t: TabId) => tabHref(site.id, t, vistoriaId);

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
  const firstVista = dx.vistas[0];

  /** Ação do "próximo passo". */
  const stepAction: Record<typeof step.id, { label: string; href: string; hidden?: boolean }> = {
    areas: { label: "Cadastrar áreas", href: link("areas"), hidden: !canEdit },
    vistoria: { label: "Criar vistoria", href: link("vistorias"), hidden: !canEdit },
    vista: { label: "Criar vista", href: `/bens/${site.id}/ortofotos/nova${qs}`, hidden: !canEdit },
    danos: { label: "Abrir a vista", href: firstVista ? `/bens/${site.id}/ortofotos/${firstVista.id}` : link("vistas") },
    laudo: { label: "Gerar laudo", href: `/bens/${site.id}/laudo${qs}` },
  };

  const typeBars = dx.byType.map((r) => (
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
  ));

  const vistaCards = (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {dx.vistas.map((o) => (
        <li key={o.id} className="min-w-0">
          <Link
            href={`/bens/${site.id}/ortofotos/${o.id}`}
            className="group block overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/40"
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
                <span className="shrink-0 text-[12.5px] tabular-nums">{fmtBRL(o.costCents)}</span>
              </span>
              <span className="truncate text-[12px] text-muted-foreground">
                {[o.elementName, `${o.damageCount} ${o.damageCount === 1 ? "dano" : "danos"}`, o.mmPerPixel ? fmtMmPerPixel(o.mmPerPixel) : "sem escala"]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );

  const emptyVistas = (
    <EmptyState icon={ImagePlus} title={`Nenhuma vista ${dx.campaign ? "nesta vistoria" : "ainda"}`}>
      Tire uma foto da fachada com o celular, marque os 4 cantos e informe as medidas: o ArchRay corrige a perspectiva e você aponta os danos em escala.
      {canEdit && (
        <div className="mt-3">
          <Button size="sm" asChild>
            <Link href={`/bens/${site.id}/ortofotos/nova${qs}`}>Criar a primeira vista</Link>
          </Button>
        </div>
      )}
    </EmptyState>
  );

  const noDamages = (
    <EmptyState icon={FileText} title="Nenhum dano apontado ainda">
      Abra uma vista e marque os danos: o resumo, as prioridades e o orçamento aparecem aqui.
    </EmptyState>
  );

  return (
    <>
      <PageHeader
        className="pb-4"
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
                <Link href={`/bens/${site.id}/ortofotos/nova${qs}`} data-tour="nova-vista">
                  <ImagePlus /> Nova vista
                </Link>
              </Button>
            )}
            <Button asChild>
              <a href={`/bens/${site.id}/laudo${qs}`} target="_blank" rel="noreferrer" data-tour="gerar-laudo">
                <FileText /> Gerar laudo
              </a>
            </Button>
          </div>
        }
      />

      <TabBar
        siteId={site.id}
        active={tab}
        vistoria={vistoriaId}
        counts={{ vistas: dx.vistas.length, danos: dx.kpis.damages, vistorias: campaigns.length, areas: elements.length }}
      />

      <PageBody className="grid gap-5 pt-5">
        {/* filtro por vistoria: só faz sentido com mais de uma, e só nas abas que dependem dele */}
        {dx.campaigns.length > 1 && (tab === "resumo" || tab === "vistas" || tab === "danos") && (
          <nav className="flex flex-wrap items-center gap-1.5 text-[13px]" aria-label="Filtrar por vistoria">
            <span className="mr-1 text-muted-foreground">Vistoria:</span>
            {[{ id: null as string | null, name: "Todas" }, ...dx.campaigns].map((c) => {
              const active = (dx.campaign?.id ?? null) === c.id;
              return (
                <Link
                  key={c.id ?? "all"}
                  href={tabHref(site.id, tab, c.id)}
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

        {/* ───────── Resumo ───────── */}
        {tab === "resumo" && (
          <>
            {step.id !== "laudo" && (
              <section className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border bg-card p-5">
                <div className="min-w-0 flex-1 basis-72">
                  <p className="label mb-1">
                    Próximo passo · {step.done} de {step.total}
                  </p>
                  <h2 className="text-[16px] font-medium">{step.title}</h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">{step.body}</p>
                </div>
                {!stepAction[step.id].hidden && (
                  <Button asChild>
                    <Link href={stepAction[step.id].href}>
                      {stepAction[step.id].label} <ArrowRight />
                    </Link>
                  </Button>
                )}
              </section>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" data-tour="kpis">
              <Kpi label="Danos apontados" value={String(dx.kpis.damages)} hint={`em ${dx.vistas.length} vista${dx.vistas.length === 1 ? "" : "s"}`} />
              <Kpi label="Área afetada" value={fmtArea(dx.kpis.areaM2)} />
              <Kpi label="Fissuras e linhas" value={fmtLength(dx.kpis.cracksM)} />
              <Kpi
                label="Orçamento estimado"
                value={fmtBRL(dx.kpis.totalCents)}
                hint={dx.kpis.missing ? `${dx.kpis.missing} dano(s) sem escala, fora da soma` : "tratamento de todos os danos"}
              />
              <Kpi label="Prioridade imediata" value={String(dx.kpis.urgent)} hint="GUT ≥ 64" />
            </div>

            {dx.kpis.damages > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <Section
                  title="Prioridades"
                  action={
                    <Link href={link("danos")} className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
                      Ver todos <ArrowRight className="size-3.5" />
                    </Link>
                  }
                >
                  <PriorityBar rows={dx.byPriority} fmt={fmtBRL} />
                  <ul className="grid divide-y rounded-lg border">
                    {dx.priorities.slice(0, 5).map((d) => (
                      <li key={d.id} className="flex min-w-0 items-center gap-3 px-3 py-2 text-[13px]">
                        <span className="inline-flex min-w-9 shrink-0 justify-center rounded-full border px-2 py-0.5 text-[12px] font-medium tabular-nums">{d.gut}</span>
                        <Link href={`/bens/${site.id}/ortofotos/${d.orthophotoId}?dano=${d.id}`} className="flex min-w-0 flex-1 items-center gap-2 hover:underline">
                          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.type.color }} />
                          <span className="truncate">{d.type.name}</span>
                        </Link>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{d.costCents == null ? "—" : fmtBRL(d.costCents)}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
                <Section
                  title="Custo por tipo de dano"
                  action={
                    dx.byType.length > 6 ? (
                      <Link href={link("danos")} className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
                        Ver todos <ArrowRight className="size-3.5" />
                      </Link>
                    ) : undefined
                  }
                >
                  <ul className="grid gap-2.5">{typeBars.slice(0, 6)}</ul>
                </Section>
              </div>
            ) : null}
          </>
        )}

        {/* ───────── Vistas ───────── */}
        {tab === "vistas" &&
          (dx.vistas.length === 0 ? (
            emptyVistas
          ) : (
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
              {vistaCards}
            </Section>
          ))}

        {/* ───────── Danos ───────── */}
        {tab === "danos" &&
          (dx.kpis.damages === 0 ? (
            noDamages
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <Section title="Prioridade (matriz GUT)">
                  <PriorityBar rows={dx.byPriority} fmt={fmtBRL} />
                </Section>
                <Section title="Gravidade">
                  <ul className="grid gap-2.5">
                    {dx.bySeverity.map((r) => (
                      <Bar key={r.severity} label={severities[r.severity]} value={r.count} max={maxSev} right={String(r.count)} />
                    ))}
                  </ul>
                </Section>
                {dx.byElement.length > 1 && (
                  <Section title="Custo por área">
                    <ul className="grid gap-2.5">
                      {dx.byElement.map((r) => (
                        <Bar key={r.name} label={`${r.name} · ${r.count} ${r.count === 1 ? "dano" : "danos"}`} value={r.cents} max={maxEl} right={fmtBRL(r.cents)} />
                      ))}
                    </ul>
                  </Section>
                )}
              </div>

              <Section title="Custo por tipo de dano">
                <ul className="grid gap-x-8 gap-y-2.5 md:grid-cols-2">{typeBars}</ul>
              </Section>

              <Section title="Lista de prioridades" description="Danos ordenados pelo GUT (gravidade × urgência × tendência). Clique para abrir na vista.">
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
                      {dx.priorities.slice(0, 100).map((d) => (
                        <tr key={d.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 pr-3">
                            <span className="inline-flex min-w-9 justify-center rounded-full border px-2 py-0.5 text-[12px] font-medium tabular-nums">{d.gut}</span>
                          </td>
                          <td className="py-2 pr-3">
                            <Link href={`/bens/${site.id}/ortofotos/${d.orthophotoId}?dano=${d.id}`} className="inline-flex items-center gap-2 hover:underline">
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
                {dx.priorities.length > 100 && <p className="text-[12px] text-muted-foreground">Mostrando 100 de {dx.priorities.length}. O laudo traz a lista completa.</p>}
              </Section>
            </>
          ))}

        {/* ───────── Vistorias ───────── */}
        {tab === "vistorias" && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <Section
              title="Nova vistoria"
              description="Cada visita ao imóvel (vistoria inicial, monitoramento, obra) agrupa as vistas, os danos e as fotos de campo daquela data."
            >
              {canEdit ? <AddCampaignForm siteId={site.id} today={todayISO()} /> : <p className="text-[13px] text-muted-foreground">Somente técnicos e administradores criam vistorias.</p>}
            </Section>
            <div className="grid min-w-0 content-start gap-3">
              {campaigns.length === 0 ? (
                <EmptyState icon={Camera} title="Nenhuma vistoria ainda">
                  Crie a primeira para começar a registrar fotos de campo e vistas.
                </EmptyState>
              ) : (
                campaigns.map((c) => (
                  <section key={c.id} className="min-w-0 rounded-2xl border bg-card p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={tabHref(site.id, "resumo", c.id)} className="font-medium hover:underline">
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
                              {k.mode === "laser" ? <Box className="size-3.5 text-muted-foreground" /> : <Camera className="size-3.5 text-muted-foreground" />}
                              <span>{k.mode === "laser" ? "Modelo 3D" : k.elementId ? elementName[k.elementId] : "Fotos de campo"}</span>
                              <span className="text-muted-foreground">{k.mode === "laser" ? "" : `· ${k.fileCount} fotos (${fmtBytes(k.totalBytes)})`}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    {canCapture && (
                      <NewCaptureForm
                        action={startCapture.bind(null, site.id, c.id)}
                        elements={elements.map((e) => ({ value: e.id, label: e.name }))}
                        canImportModel={false}
                      />
                    )}
                  </section>
                ))
              )}
            </div>
          </div>
        )}

        {/* ───────── Áreas ───────── */}
        {tab === "areas" && (
          <Section title="Áreas" description="Partes do imóvel: fachadas, pavimentos, ambientes, cobertura. Cada vista e cada dano fica ligado a uma área.">
            {canEdit && <AddElementForm siteId={site.id} empty={elements.length === 0} />}
            {elements.length > 0 && (
              <ul className="grid divide-y rounded-lg border">
                {elements.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 px-3 py-2 text-[13.5px]">
                    <span className="min-w-0 flex-1 truncate">{e.name}</span>
                    <span className="text-[12px] text-muted-foreground">{elementKinds[e.kind]}</span>
                    {canEdit && <ConfirmButton action={deleteElement.bind(null, site.id, e.id)} title={`Excluir "${e.name}"?`} size="icon-sm" />}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* ───────── Modelo 3D (beta) ───────── */}
        {tab === "modelo3d" && (
          <>
            <Section
              title="Modelo 3D"
              description="Módulo em teste. Importe um modelo 3D pronto (GLB, nuvem de pontos), calibre a escala com uma medida real e gere vistas em escala das paredes para o mapa de danos."
              action={<BetaBadge />}
            >
              {models.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">Nenhum modelo importado neste projeto.</p>
              ) : (
                <ul className="grid divide-y rounded-lg border">
                  {models.map((o) => {
                    const scale = (o.meta as OutputMeta | null)?.scale;
                    return (
                      <li key={o.id} className="flex min-w-0 items-center gap-3 px-3 py-2.5 text-[13.5px]">
                        <Box className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{o.name}</span>
                          <span className="text-[12px] text-muted-foreground">
                            {o.format.toUpperCase()} · {fmtBytes(o.bytes)} · {scale ? "escala calibrada" : "sem calibração"}
                          </span>
                        </span>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/bens/${site.id}/modelos/${o.id}`}>Abrir</Link>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
            {canEdit && (
              <Section title="Importar modelo" description="Arquivos GLB, LAS, PLY, XYZ e PTS abrem no visualizador. Os demais formatos ficam só para download.">
                {campaigns.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">
                    Crie uma vistoria primeiro: o modelo fica guardado dentro dela.{" "}
                    <Link href={link("vistorias")} className="font-medium underline-offset-4 hover:underline">
                      Ir para Vistorias
                    </Link>
                  </p>
                ) : (
                  <ImportModelForm
                    action={startCapture.bind(null, site.id)}
                    campaigns={campaigns.map((c) => ({ value: c.id, label: `${c.name} · ${fmtDate(c.date)}` }))}
                    elements={elements.map((e) => ({ value: e.id, label: e.name }))}
                  />
                )}
              </Section>
            )}
          </>
        )}

        {/* ───────── Ficha ───────── */}
        {tab === "ficha" && (
          <Section
            title="Ficha do projeto"
            action={
              canEdit && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/bens/${site.id}/editar`}>
                    <Pencil /> Editar ficha
                  </Link>
                </Button>
              )
            }
          >
            <dl className="grid gap-3 text-[13.5px]">
              {facts.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[130px_1fr] gap-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="min-w-0">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            {site.description && <p className="border-t pt-3 text-[13.5px] whitespace-pre-line text-foreground/85">{site.description}</p>}
          </Section>
        )}
      </PageBody>
    </>
  );
}
