import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, FileBox, Lock } from "lucide-react";
import { editors, requireUser } from "@/lib/auth";
import { getOrderDetail, listModelers } from "@/lib/bim-orders";
import { BIM_STEPS, bimStatuses, DISCIPLINES, fmtMoney, FORMATS, LODS, type Discipline, type Format, type Lod } from "@/lib/bim";
import { fmtBytes, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AssignSelect,
  CancelRequest,
  CommentBox,
  DeliveryDecision,
  DeliveryUpload,
  QuoteDecision,
  QuoteForm,
  ReleaseButton,
  StatusButtons,
} from "./order-actions";

export const metadata: Metadata = { title: "Pedido de modelo BIM" };

function Card({ title, children, className, aside }: { title: string; children: React.ReactNode; className?: string; aside?: React.ReactNode }) {
  return (
    <section className={cn("grid content-start gap-3 rounded-2xl border bg-card p-5", className)}>
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-[16px] font-medium">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

const EVENT_LABEL: Record<string, string> = {
  status: "Status",
  comentario: "Comentário",
  orcamento: "Orçamento",
  atribuicao: "Atribuição",
  entrega: "Entrega",
  revisao: "Revisão pedida",
};

export default async function OrderPage({ params }: PageProps<"/bim/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const d = await getOrderDetail(user, id);
  const { order: o, access } = d;
  const ops = access === "operador" || access === "parceiro";
  const isOperator = access === "operador";
  const isClient = o.orgId === user.orgId && editors.includes(user.role);
  const modelers = isOperator ? await listModelers() : [];
  const stepIndex = o.status === "cancelado" ? -1 : BIM_STEPS.findIndex((s) => s.statuses.includes(o.status));
  const inProduction = ["aprovado", "em_modelagem", "em_revisao_interna", "revisao_solicitada", "entregue"].includes(o.status);

  return (
    <div className="px-5 pt-6 pb-16 sm:px-8 lg:px-10">
      <Link href={ops && !isClient ? "/operacao" : "/bim"} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> {ops && !isClient ? "Operação" : "Modelos BIM"}
      </Link>
      <header className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <p className="label">
            Pedido #{o.number}
            {ops && ` · ${d.orgName}`}
          </p>
          <h1 className="h-display text-[24px] sm:text-[28px]">{d.siteName}</h1>
          <p className="text-[13.5px] text-muted-foreground">
            {o.areaM2.toLocaleString("pt-BR")} m² · {LODS[o.lod as Lod].label} · pedido em {fmtDate(o.createdAt)}
            {d.requester && ` por ${d.requester.name}`}
          </p>
        </div>
        <Badge variant={o.status === "concluido" ? "default" : "secondary"} className="text-[13px]">
          {bimStatuses[o.status]}
        </Badge>
      </header>

      {/* progresso */}
      <ol className="mb-6 grid grid-cols-5 gap-1.5">
        {BIM_STEPS.map((s, i) => (
          <li key={s.label} className="grid gap-1.5">
            <span className={cn("h-1.5 rounded-full", o.status === "cancelado" ? "bg-muted" : i <= stepIndex ? "bg-foreground" : "bg-muted")} />
            <span className={cn("text-[12px]", i === stepIndex ? "font-medium" : "text-muted-foreground")}>{s.label}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-5">
          {/* orçamento (parceiro modelador não vê preços) */}
          {!(access === "parceiro" && !isClient) && (
          <Card title="Orçamento">
            {o.priceCents ? (
              <div className="grid gap-1">
                <p className="text-[28px] font-medium tracking-tight tabular-nums">{fmtMoney(o.priceCents)}</p>
                <p className="text-[13.5px] text-muted-foreground">
                  Entrega em {o.deliveryDays} dias úteis após a aprovação
                  {o.dueDate && ` · previsão: ${fmtDate(o.dueDate)}`}
                </p>
                {o.quoteNotes && <p className="mt-1 text-[14px] whitespace-pre-line">{o.quoteNotes}</p>}
              </div>
            ) : (
              <p className="text-[14px] text-muted-foreground">
                Estimativa automática: <b className="font-medium text-foreground">{fmtMoney(o.estimateCents)}</b>. A equipe está conferindo a base e envia o orçamento final em breve.
              </p>
            )}
            {isClient && o.status === "orcado" && <QuoteDecision orderId={o.id} />}
            {isClient && o.status === "solicitado" && (
              <div>
                <CancelRequest orderId={o.id} />
              </div>
            )}
          </Card>
          )}

          {/* entregas */}
          <Card title="Entregas">
            {isClient && o.status === "entregue" && <DeliveryDecision orderId={o.id} />}
            {d.deliveries.length === 0 ? (
              <p className="text-[14px] text-muted-foreground">
                {inProduction ? "O modelo está sendo produzido. As versões entregues aparecem aqui." : "As versões do modelo aparecem aqui depois da aprovação do orçamento."}
              </p>
            ) : (
              <ul className="grid gap-3">
                {d.deliveries.map((v) => (
                  <li key={v.id} className="rounded-xl border p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-[14.5px] font-medium">Versão {v.version}</span>
                      <span className="text-[12.5px] text-muted-foreground">{fmtDate(v.createdAt)}</span>
                      {!v.released && (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="size-3" /> em conferência
                        </Badge>
                      )}
                      {isOperator && !v.released && (
                        <span className="ml-auto">
                          <ReleaseButton orderId={o.id} deliveryId={v.id} />
                        </span>
                      )}
                    </div>
                    {v.notes && <p className="mb-2 text-[13.5px] whitespace-pre-line text-muted-foreground">{v.notes}</p>}
                    <ul className="grid gap-1">
                      {v.files.map((f) => (
                        <li key={f.id} className="flex items-center gap-2 text-[13.5px]">
                          <FileBox className="size-4 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{f.name}</span>
                          <span className="text-[12px] text-muted-foreground">{fmtBytes(f.bytes)}</span>
                          <Button size="sm" variant="outline" asChild>
                            <a href={`${f.url}?download=1`}>
                              <Download /> Baixar
                            </a>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* conversa */}
          <Card title="Histórico e mensagens">
            <ol className="grid gap-3">
              {d.events.map(({ e, userName }) => (
                <li key={e.id} className={cn("grid gap-0.5 border-l-2 pl-3", e.internal ? "border-dashed border-muted-foreground/40" : "border-foreground/20")}>
                  <span className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
                    <span className="font-medium text-foreground">{EVENT_LABEL[e.kind]}</span>
                    {userName && <span>{userName}</span>}
                    <span>{fmtDate(e.createdAt, "dd/MM/yyyy HH:mm")}</span>
                    {e.internal && (
                      <span className="inline-flex items-center gap-1">
                        <Lock className="size-3" /> interno
                      </span>
                    )}
                  </span>
                  {e.kind === "orcamento" && e.meta && (
                    <span className="text-[14px]">
                      {fmtMoney(e.meta.priceCents as number)} · {String(e.meta.days)} dias úteis
                    </span>
                  )}
                  {e.kind === "status" && e.meta?.to != null && !e.body && <span className="text-[14px]">{bimStatuses[e.meta.to as keyof typeof bimStatuses]}</span>}
                  {e.kind === "entrega" && e.meta?.version != null && <span className="text-[14px]">Versão {String(e.meta.version)}</span>}
                  {e.body && <span className="text-[14px] whitespace-pre-line">{e.body}</span>}
                </li>
              ))}
            </ol>
            {o.status !== "cancelado" && <CommentBox orderId={o.id} canInternal={ops} />}
          </Card>
        </div>

        <div className="grid content-start gap-5">
          {/* escopo */}
          <Card title="Escopo">
            <dl className="grid gap-2 text-[13.5px]">
              <div className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-muted-foreground">Projeto</dt><dd>{d.siteName}{d.siteCity && ` · ${d.siteCity}`}</dd></div>
              <div className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-muted-foreground">Área</dt><dd>{o.areaM2.toLocaleString("pt-BR")} m²</dd></div>
              <div className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-muted-foreground">Detalhe</dt><dd>{LODS[o.lod as Lod].label} — {LODS[o.lod as Lod].summary}</dd></div>
              <div className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-muted-foreground">Disciplinas</dt><dd>{o.disciplines.map((x) => DISCIPLINES[x as Discipline]?.label ?? x).join(", ")}</dd></div>
              <div className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-muted-foreground">Formatos</dt><dd>{o.formats.map((x) => FORMATS[x as Format]?.label ?? x).join(", ")}{o.softwareVersions && ` · ${o.softwareVersions}`}</dd></div>
              {o.desiredDate && <div className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-muted-foreground">Prazo desejado</dt><dd>{fmtDate(o.desiredDate)}</dd></div>}
              {o.notes && <div className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-muted-foreground">Observações</dt><dd className="whitespace-pre-line">{o.notes}</dd></div>}
            </dl>
          </Card>

          {/* base da modelagem */}
          <Card title="Base da modelagem">
            {d.capture ? (
              <p className="text-[13.5px] text-muted-foreground">
                {d.capture.mode === "laser" ? "Modelo/nuvem importado" : `Captura com ${d.capture.fileCount} imagens`}
                {ops && (
                  <>
                    {" · "}
                    <a href={`/bim/${o.id}/base`} className="underline underline-offset-4">lista de fotos e medidas</a>
                  </>
                )}
              </p>
            ) : (
              <p className="text-[13.5px] text-muted-foreground">Base a combinar com a equipe (use as mensagens para enviar links ou detalhes).</p>
            )}
            {d.baseFiles.length > 0 && (
              <ul className="grid gap-1">
                {d.baseFiles.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 text-[13.5px]">
                    <FileBox className="size-4 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <span className="text-[12px] text-muted-foreground">{fmtBytes(f.bytes)}</span>
                    {f.url && (
                      <a href={`${f.url}?download=1`} className="text-[13px] underline underline-offset-4">
                        Baixar
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* painel da operação */}
          {ops && (
            <Card title="Operação" className="border-dashed" aside={<Badge variant="outline">{isOperator ? "Operador" : "Parceiro"}</Badge>}>
              {isOperator && ["solicitado", "orcado"].includes(o.status) && (
                <div className="grid gap-2">
                  <p className="text-[13px] font-medium">Orçamento</p>
                  <QuoteForm orderId={o.id} estimateCents={o.estimateCents} priceCents={o.priceCents} days={o.deliveryDays} notes={o.quoteNotes} />
                </div>
              )}
              {isOperator && (
                <div className="grid gap-2">
                  <p className="text-[13px] font-medium">Responsável pela modelagem</p>
                  <AssignSelect orderId={o.id} assigneeId={o.assigneeId} people={modelers.map((m) => ({ value: m.id, label: `${m.name} · ${m.platformRole === "parceiro" ? "parceiro" : "equipe"}` }))} />
                </div>
              )}
              {!isOperator && <p className="text-[13px] text-muted-foreground">Pedido atribuído a você. Baixe a base, modele e envie a versão para conferência.</p>}
              {inProduction && o.status !== "entregue" && (
                <div className="grid gap-2">
                  <p className="text-[13px] font-medium">Status da produção</p>
                  <StatusButtons orderId={o.id} current={o.status} partner={!isOperator} />
                </div>
              )}
              {inProduction && (
                <div className="grid gap-2">
                  <p className="text-[13px] font-medium">Nova versão do modelo</p>
                  <DeliveryUpload orderId={o.id} orgId={o.orgId} partner={!isOperator} />
                </div>
              )}
              {isOperator && !["concluido", "cancelado"].includes(o.status) && !inProduction && (
                <p className="text-[12.5px] text-muted-foreground">Depois que o cliente aprovar o orçamento, a produção e as entregas aparecem aqui.</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
