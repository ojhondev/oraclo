import type { Metadata } from "next";
import Link from "next/link";
import { Box, Camera, FileDown, ImageUp, MapPin, Pencil, ShieldCheck } from "lucide-react";
import { capturers, editors, requireUser } from "@/lib/auth";
import { getSite, getSiteDetail } from "@/lib/sites";
import { listOrthophotos } from "@/lib/orthophotos";
import { listOrgOrders } from "@/lib/bim-orders";
import { BimOrderList } from "@/components/bim-order-list";
import { fmtMmPerPixel } from "@/lib/geometry";
import type { OutputMeta } from "@/lib/model-formats";
import {
  captureStatuses,
  elementKinds,
  protectionLevels,
  purposes,
  siteKinds,
} from "@/lib/labels";
import { fmtBytes, fmtDate, todayISO } from "@/lib/format";
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

/** Formatos que o Oraclo entrega para os softwares de arquitetura e engenharia (PRD §5.4). */
const DELIVERABLES = [
  { fmt: "E57", target: "Revit (via ReCap), Archicad, AutoCAD" },
  { fmt: "LAS / LAZ", target: "Civil 3D, QGIS, CloudCompare" },
  { fmt: "PLY", target: "CloudCompare, MeshLab, Blender" },
  { fmt: "OBJ / GLB", target: "SketchUp, Rhino, Blender" },
  { fmt: "DXF", target: "AutoCAD — ortofoto em escala + mapa de danos em camadas" },
  { fmt: "PDF", target: "Pranchas do mapa de danos e relatórios" },
];

function Section({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="grid content-start gap-4 rounded-2xl border bg-card p-5">
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

export default async function SitePage({ params }: PageProps<"/bens/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const [{ site, elements, campaigns, outputs }, orthos, bimOrders] = await Promise.all([getSiteDetail(user.orgId, id), listOrthophotos(id), listOrgOrders(user.orgId, id)]);
  const canEdit = editors.includes(user.role);
  const canCapture = capturers.includes(user.role);
  const elementName = Object.fromEntries(elements.map((e) => [e.id, e.name]));

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
              <span className="inline-flex items-center gap-1 text-brand">
                <ShieldCheck className="size-3.5" /> {site.protectionBody || protectionLevels[site.protection]}
              </span>
            )}
          </span>
        }
        actions={
          canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/bens/${site.id}/editar`}>
                <Pencil /> Editar ficha
              </Link>
            </Button>
          )
        }
      />
      <PageBody className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-5">
          <Section
            title="Ortofotos e mapas de danos"
            description="Imagens em escala de fachadas, paredes, pisos e forros. Desenhe os danos sobre elas e exporte a prancha (PDF) e o DXF."
            action={
              canEdit && (
                <Button size="sm" asChild>
                  <Link href={`/bens/${site.id}/ortofotos/nova`}>
                    <ImageUp /> Enviar ortofoto
                  </Link>
                </Button>
              )
            }
          >
            {orthos.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                Nenhuma ortofoto ainda. Envie um JPG ou PNG da fachada (de qualquer software de fotogrametria) para começar o mapa de danos.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {orthos.map((o) => (
                  <li key={o.id}>
                    <Link href={`/bens/${site.id}/ortofotos/${o.id}`} className="group block overflow-hidden rounded-lg border transition-colors hover:border-brand/40">
                      <div className="aspect-[4/3] bg-canvas">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={o.url} alt="" loading="lazy" className="size-full object-contain" />
                      </div>
                      <div className="grid gap-0.5 p-3">
                        <span className="truncate text-[13.5px] font-medium group-hover:text-brand">{o.name}</span>
                        <span className="text-[12px] text-muted-foreground">
                          {[o.elementName, `${o.damageCount} danos`, fmtMmPerPixel(o.mmPerPixel)].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="Modelo BIM"
            description="Peça o modelo em Revit, Archicad ou IFC a partir das capturas e nuvens deste projeto, e acompanhe orçamento, modelagem e entregas."
            action={
              canEdit && (
                <Button size="sm" asChild>
                  <Link href={`/bim/novo?projeto=${site.id}`}>Solicitar modelo BIM</Link>
                </Button>
              )
            }
          >
            {bimOrders.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Nenhum pedido ainda.</p>
            ) : (
              <BimOrderList rows={bimOrders} />
            )}
          </Section>

          <Section
            title="Campanhas de captura"
            description="Cada ida a campo (levantamento, monitoramento, etapa de obra) agrupa as capturas daquele dia."
          >
            {canEdit && <AddCampaignForm siteId={site.id} today={todayISO()} />}
            {campaigns.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Nenhuma campanha ainda.</p>
            ) : (
              <ul className="grid gap-3">
                {campaigns.map((c) => (
                  <li key={c.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      <Badge variant="secondary">{purposes[c.purpose]}</Badge>
                      <span className="text-[13px] text-muted-foreground">{fmtDate(c.date)}</span>
                      {canEdit && (
                        <span className="ml-auto">
                          <ConfirmButton
                            action={deleteCampaign.bind(null, site.id, c.id)}
                            title="Excluir esta campanha?"
                            description="As capturas e arquivos dela também serão apagados."
                            size="icon-sm"
                          />
                        </span>
                      )}
                    </div>
                    {c.captures.length > 0 && (
                      <ul className="mt-3 grid gap-1">
                        {c.captures.map((k) => (
                          <li key={k.id}>
                            <Link
                              href={`/bens/${site.id}/capturas/${k.id}`}
                              className="-mx-2 flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-muted"
                            >
                              <Camera className="size-3.5 text-muted-foreground" />
                              <span>{k.elementId ? elementName[k.elementId] : "Sem área definida"}</span>
                              <span className="text-muted-foreground">· {k.fileCount} fotos ({fmtBytes(k.totalBytes)})</span>
                              <Badge variant={k.status === "concluida" ? "default" : "secondary"} className="ml-auto">
                                {captureStatuses[k.status]}
                              </Badge>
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

          <Section
            title="Modelos e arquivos"
            description="Nuvens de pontos, malhas, ortofotos, pranchas e exportações deste projeto."
          >
            {outputs.length === 0 ? (
              <div className="grid gap-3">
                <p className="text-[13px] text-muted-foreground">
                  Quando a primeira captura for processada, os arquivos aparecem aqui, prontos para abrir nos
                  softwares de arquitetura e engenharia:
                </p>
                <ul className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
                  {DELIVERABLES.map((d) => (
                    <li key={d.fmt} className="flex items-start gap-3 bg-card px-3 py-2.5">
                      <FileDown className="mt-0.5 size-4 shrink-0 text-brand" />
                      <span className="grid leading-tight">
                        <span className="text-[13px] font-medium">{d.fmt}</span>
                        <span className="text-[12px] text-muted-foreground">{d.target}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="grid gap-1.5">
                {outputs.map((o) => {
                  const viewable = !!(o.meta as OutputMeta | null)?.viewable;
                  return (
                    <li key={o.id} className="flex flex-wrap items-center gap-2 text-[13px]">
                      <Box className="size-3.5 text-muted-foreground" />
                      <span className="min-w-0 truncate">{o.name}</span>
                      <Badge variant="outline">{o.format.toUpperCase()}</Badge>
                      <span className="ml-auto text-muted-foreground">{fmtBytes(o.bytes)}</span>
                      {viewable && (
                        <Button size="sm" asChild>
                          <Link href={`/bens/${site.id}/modelos/${o.id}`}>Ver em 3D</Link>
                        </Button>
                      )}
                      {o.url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`${o.url}?download=1`}>Baixar</a>
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>

        <div className="grid content-start gap-5">
          <Section title="Áreas" description="Fachadas, pavimentos, ambientes, cobertura, estrutura — cada captura e cada modelo fica ligado a uma área.">
            {canEdit && <AddElementForm siteId={site.id} empty={elements.length === 0} />}
            {elements.length > 0 && (
              <ul className="grid divide-y rounded-lg border">
                {elements.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 px-3 py-2 text-[13.5px]">
                    <span className="flex-1">{e.name}</span>
                    <span className="text-[12px] text-muted-foreground">{elementKinds[e.kind]}</span>
                    {canEdit && (
                      <ConfirmButton
                        action={deleteElement.bind(null, site.id, e.id)}
                        title={`Excluir "${e.name}"?`}
                        size="icon-sm"
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

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
      </PageBody>
    </>
  );
}
