import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { fmtArea, fmtLength, fmtMmPerPixel } from "@/lib/geometry";
import { fmtDate } from "@/lib/format";
import { protectionLevels, purposes, severities, siteKinds, vistaKinds } from "@/lib/labels";
import { fmtBRL, unitLabels } from "@/lib/pricing";
import type { Diagnosis } from "@/lib/diagnosis";
import type { schema } from "@/lib/db";
import { col, drawDamages, fit, wrap } from "./pdf";
import { fmtPrecision } from "@/lib/rectify";
import { LOGO_PNG_BASE64 } from "./logo";

const A4: [number, number] = [595.28, 841.89];
const M = 48;
const INK = rgb(0.086, 0.094, 0.106);
const MUTED = rgb(0.42, 0.42, 0.42);
const LINE = rgb(0.82, 0.82, 0.82);
const SOFT = rgb(0.955, 0.955, 0.955);

type Site = typeof schema.sites.$inferSelect;

export type LaudoInput = {
  site: Site;
  dx: Diagnosis;
  author: { name: string; professionalId: string | null };
  orgName: string;
  /** Imagem de cada vista (id → bytes). Vistas sem imagem saem só com a tabela. */
  images: Map<string, Uint8Array>;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const qtyText = (geometry: string, d: { areaM2: number | null; lengthM: number | null }) =>
  geometry === "area" ? fmtArea(d.areaM2) : geometry === "linha" ? fmtLength(d.lengthM) : "1 un.";

/**
 * Laudo de estado de conservação (A4): capa, identificação, metodologia, resumo, vistas com
 * os danos desenhados, tabela de danos com prioridade GUT, orçamento estimado e assinatura.
 */
export async function buildLaudo({ site, dx, author, orgName, images }: LaudoInput) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Laudo de estado de conservação — ${site.name}`);
  pdf.setAuthor(author.name);
  pdf.setCreator("ArchRay");
  pdf.setProducer("ArchRay");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(Buffer.from(LOGO_PNG_BASE64, "base64"));
  const [PW, PH] = A4;
  const CW = PW - 2 * M;
  const typeById = new Map(dx.types.map((t) => [t.id, t]));
  const today = fmtDate(new Date());

  // imagens embutidas antes de montar as páginas
  const embedded = new Map<string, PDFImage>();
  for (const v of dx.vistas) {
    const bytes = images.get(v.id);
    if (!bytes) continue;
    try {
      embedded.set(v.id, v.contentType === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes));
    } catch {
      // imagem ilegível: a vista sai sem figura
    }
  }

  // ID do dano igual ao da prancha: código + ordem dentro da vista
  const idOf = new Map<string, string>();
  for (const v of dx.vistas) {
    dx.damages.filter((d) => d.orthophotoId === v.id).forEach((d, i) => idOf.set(d.id, `${d.type.code}-${i + 1}`));
  }

  let page!: PDFPage;
  let y = 0;
  const newPage = () => {
    page = pdf.addPage(A4);
    y = PH - M;
  };
  const ensure = (h: number) => {
    if (y - h < M + 24) newPage();
  };
  const text = (t: string, o: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb>; x?: number; w?: number } = {}) => {
    const size = o.size ?? 9.5;
    const f = o.f ?? font;
    page.drawText(fit(f, t, size, o.w ?? CW), { x: o.x ?? M, y, size, font: f, color: o.color ?? INK });
  };
  const para = (t: string, size = 9.5, lead = 13.5) => {
    for (const l of wrap(font, t, size, CW)) {
      ensure(lead);
      page.drawText(l, { x: M, y, size, font, color: INK });
      y -= lead;
    }
    y -= 5;
  };
  const heading = (n: string, t: string) => {
    ensure(60);
    y -= 6;
    page.drawText(n, { x: M, y, size: 10, font: bold, color: MUTED });
    page.drawText(t.toUpperCase(), { x: M + 20, y, size: 11, font: bold, color: INK });
    y -= 8;
    page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, color: INK, thickness: 0.8 });
    y -= 18;
  };

  /* ───────────── Capa ───────────── */
  newPage();
  const lh = 16;
  page.drawImage(logo, { x: M, y: PH - M - lh, width: (logo.width / logo.height) * lh, height: lh });
  y = PH - 250;
  page.drawText("LAUDO DE ESTADO DE CONSERVAÇÃO", { x: M, y, size: 11, font: bold, color: MUTED });
  y -= 36;
  for (const l of wrap(bold, site.name, 26, CW).slice(0, 3)) {
    page.drawText(l, { x: M, y, size: 26, font: bold, color: INK });
    y -= 32;
  }
  text([siteKinds[site.kind], [site.address, site.city, site.state].filter(Boolean).join(", ")].filter(Boolean).join(" · "), {
    color: MUTED,
    size: 11,
  });
  y -= 40;

  const kpis: [string, string][] = [
    ["Danos apontados", String(dx.kpis.damages)],
    ["Área afetada", fmtArea(dx.kpis.areaM2)],
    ["Fissuras e linhas", fmtLength(dx.kpis.cracksM)],
    ["Orçamento estimado", fmtBRL(dx.kpis.totalCents)],
  ];
  const bw = CW / 4;
  page.drawRectangle({ x: M, y: y - 52, width: CW, height: 64, color: SOFT });
  kpis.forEach(([k, v], i) => {
    page.drawText(k, { x: M + 12 + i * bw, y: y - 8, size: 8, font, color: MUTED });
    page.drawText(fit(bold, v, 15, bw - 16), { x: M + 12 + i * bw, y: y - 34, size: 15, font: bold, color: INK });
  });
  y -= 100;

  const coverRows: [string, string][] = [
    [
      "Vistoria",
      dx.campaign ? `${dx.campaign.name} · ${purposes[dx.campaign.purpose]} · ${fmtDate(dx.campaign.date)}` : "Todas as vistorias do projeto",
    ],
    ["Responsável técnico", `${author.name}${author.professionalId ? ` · ${author.professionalId}` : ""}`],
    ["Organização", orgName],
    ["Emitido em", today],
  ];
  for (const [k, v] of coverRows) {
    page.drawText(k.toUpperCase(), { x: M, y, size: 7, font: bold, color: MUTED });
    y -= 13;
    text(v, { size: 10.5 });
    y -= 22;
  }

  /* ───────────── 1. Identificação ───────────── */
  newPage();
  heading("1", "Identificação do imóvel");
  const facts: [string, string | null][] = [
    ["Projeto", site.name],
    ["Tipo", siteKinds[site.kind]],
    ["Endereço", [site.address, site.city, site.state].filter(Boolean).join(", ") || null],
    ["Ano / período", site.period],
    ...(site.protection !== "nenhuma"
      ? ([
          ["Proteção", `${protectionLevels[site.protection]}${site.protectionBody ? ` · ${site.protectionBody}` : ""}`],
          ["Processo / inscrição", site.processNumber],
        ] as [string, string | null][])
      : []),
  ];
  for (const [k, v] of facts) {
    ensure(16);
    page.drawText(k, { x: M, y, size: 9, font, color: MUTED });
    page.drawText(fit(font, v || "—", 9.5, CW - 130), { x: M + 130, y, size: 9.5, font, color: INK });
    y -= 16;
  }
  if (site.description) {
    y -= 6;
    para(site.description);
  }
  y -= 10;

  /* ───────────── 2. Metodologia ───────────── */
  heading("2", "Metodologia");
  para(
    "Inspeção visual do imóvel com registro fotográfico. As fachadas foram fotografadas e retificadas: correção de " +
      "perspectiva por homografia ajustada por mínimos quadrados a pontos de controle medidos em campo, com correção da " +
      "distorção radial da lente quando indicada, gerando imagens ortogonais em escala conhecida. A precisão de cada vista " +
      "é estimada com 95% de confiança e, quando há medidas de conferência, verificada contra distâncias medidas com trena. " +
      "Os danos foram apontados sobre essas vistas como pontos, linhas ou áreas e classificados segundo biblioteca " +
      "padronizada; áreas e extensões foram calculadas a partir da escala de cada vista.",
  );
  para(
    "A priorização usa a matriz GUT: Gravidade (baixa = 2, média = 3, alta = 4, crítica = 5) × Urgência (1 a 5) × " +
      "Tendência (1 a 5). Faixas: GUT a partir de 64, prioridade 1 (imediata); de 27 a 63, prioridade 2 (curto prazo); " +
      "de 12 a 26, prioridade 3 (médio prazo); abaixo de 12, prioridade 4 (monitorar).",
  );
  para(
    "O orçamento é estimativo: quantidade medida de cada dano × preço unitário de tratamento da tabela do escritório. " +
      "Não inclui andaimes, canteiro, BDI, impostos nem serviços não visíveis na inspeção.",
  );
  y -= 10;

  /* ───────────── 3. Resumo ───────────── */
  heading("3", "Resumo do diagnóstico");
  para(
    `Foram apontados ${plural(dx.kpis.damages, "dano", "danos")} em ${plural(dx.vistas.length, "vista", "vistas")}, somando ${fmtArea(dx.kpis.areaM2)} de ` +
      `área afetada e ${fmtLength(dx.kpis.cracksM)} de fissuras e elementos lineares. ` +
      (dx.kpis.urgent ? `${plural(dx.kpis.urgent, "dano exige", "danos exigem")} ação imediata (prioridade 1).` : "Nenhum dano exige ação imediata.") +
      ` O tratamento completo está estimado em ${fmtBRL(dx.kpis.totalCents)}` +
      (dx.kpis.missing ? `, sem contar ${dx.kpis.missing} dano(s) em vistas sem escala.` : "."),
  );
  const prioNames = ["1 — Imediata", "2 — Curto prazo", "3 — Médio prazo", "4 — Monitorar"];
  ensure(24 + 4 * 15);
  const pc = [M, M + 200, M + 290];
  page.drawText("PRIORIDADE", { x: pc[0]!, y, size: 7, font: bold, color: MUTED });
  page.drawText("DANOS", { x: pc[1]!, y, size: 7, font: bold, color: MUTED });
  page.drawText("CUSTO ESTIMADO", { x: pc[2]!, y, size: 7, font: bold, color: MUTED });
  y -= 6;
  page.drawLine({ start: { x: M, y }, end: { x: M + 400, y }, color: LINE, thickness: 0.5 });
  y -= 13;
  dx.byPriority.forEach((r, i) => {
    page.drawText(prioNames[i]!, { x: pc[0]!, y, size: 9, font, color: INK });
    page.drawText(String(r.count), { x: pc[1]!, y, size: 9, font, color: INK });
    page.drawText(fmtBRL(r.cents), { x: pc[2]!, y, size: 9, font, color: INK });
    y -= 15;
  });

  /* ───────────── 4. Vistas ───────────── */
  dx.vistas.forEach((v, vi) => {
    newPage();
    if (vi === 0) heading("4", "Vistas e mapa de danos");
    text(`4.${vi + 1}  ${v.name}`, { f: bold, size: 11 });
    y -= 14;
    text(
      [vistaKinds[v.kind], v.elementName, fmtMmPerPixel(v.mmPerPixel), plural(v.damageCount, "dano", "danos"), fmtBRL(v.costCents)].filter(Boolean).join(" · "),
      { color: MUTED, size: 8.5 },
    );
    y -= 14;
    const rt = v.rectification;
    if (rt?.precisionMm != null) {
      const checks = rt.checks?.length
        ? ` · ${rt.checks.length} conferência(s), erro médio ${Math.round(rt.checkRmsMm ?? 0)} mm`
        : " · sem medida de conferência";
      const pts = 4 + (rt.controls?.length ?? 0);
      text(`Retificação: precisão estimada ${fmtPrecision(rt.precisionMm)} (95%) · ${pts} pontos de controle${rt.lens ? " · lente corrigida" : ""}${checks}`, { color: MUTED, size: 8.5 });
      y -= 14;
    }
    const ds = dx.damages.filter((d) => d.orthophotoId === v.id);
    const img = embedded.get(v.id);
    if (img) {
      const W = v.widthPx;
      const H = v.heightPx;
      const k = Math.min(CW / W, 420 / H);
      const iw = W * k;
      const ih = H * k;
      const ix = M + (CW - iw) / 2;
      const iy = y - ih;
      page.drawImage(img, { x: ix, y: iy, width: iw, height: ih });
      page.drawRectangle({ x: ix, y: iy, width: iw, height: ih, borderColor: LINE, borderWidth: 0.5 });
      drawDamages(page, bold, ds, typeById, { ix, iy, k, ih, H });
      y = iy - 18;
    }
    // legenda da vista
    const seen = new Map<string, { name: string; color: string; geometry: string; n: number }>();
    for (const d of ds) {
      const r = seen.get(d.typeId) ?? { name: d.type.name, color: d.type.color, geometry: d.type.geometry, n: 0 };
      r.n++;
      seen.set(d.typeId, r);
    }
    let lx = M;
    for (const r of seen.values()) {
      const label = `${r.name} (${r.n})`;
      const w = 16 + font.widthOfTextAtSize(fit(font, label, 8, 200), 8) + 14;
      if (lx + w > PW - M) {
        lx = M;
        y -= 14;
        ensure(14);
      }
      const c = col(r.color);
      if (r.geometry === "linha") page.drawLine({ start: { x: lx, y: y + 3 }, end: { x: lx + 11, y: y + 3 }, color: c, thickness: 2 });
      else if (r.geometry === "ponto") page.drawCircle({ x: lx + 5, y: y + 3, size: 3, color: c });
      else page.drawRectangle({ x: lx, y: y - 1, width: 11, height: 8, color: c, opacity: 0.5, borderColor: c, borderWidth: 0.6 });
      page.drawText(fit(font, label, 8, 200), { x: lx + 16, y, size: 8, font, color: INK });
      lx += w;
    }
    if (!ds.length) text("Nenhum dano apontado nesta vista.", { color: MUTED, size: 9 });
  });

  /* ───────────── 5. Tabela de danos ───────────── */
  newPage();
  heading("5", "Danos por prioridade");
  const cols = [
    { h: "ID", x: M, w: 44 },
    { h: "DANO", x: M + 44, w: 150 },
    { h: "VISTA", x: M + 194, w: 92 },
    { h: "QTD.", x: M + 286, w: 58 },
    { h: "GRAV.", x: M + 344, w: 44 },
    { h: "GUT", x: M + 388, w: 30 },
    { h: "CUSTO", x: M + 418, w: CW - 418 },
  ];
  const tableHead = () => {
    for (const c of cols) {
      const x = c.h === "CUSTO" ? PW - M - bold.widthOfTextAtSize(c.h, 7) : c.x;
      page.drawText(c.h, { x, y, size: 7, font: bold, color: MUTED });
    }
    y -= 6;
    page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, color: LINE, thickness: 0.5 });
    y -= 12;
  };
  tableHead();
  if (!dx.priorities.length) para("Nenhum dano apontado.");
  for (const d of dx.priorities) {
    const rec = d.recommendation || dx.prices[d.typeId]?.treatment || "";
    const extra = [d.cause && `Causa: ${d.cause}`, rec && `Recomendação: ${rec}`].filter(Boolean).join("  ·  ");
    const extraLines = extra ? wrap(font, extra, 7.5, CW - 44).slice(0, 3) : [];
    const need = 14 + extraLines.length * 10;
    if (y - need < M + 24) {
      newPage();
      tableHead();
    }
    const cells = [
      idOf.get(d.id) ?? d.type.code,
      d.type.name,
      d.vistaName,
      qtyText(d.type.geometry, d),
      severities[d.severity],
      String(d.gut),
      d.costCents == null ? "—" : fmtBRL(d.costCents),
    ];
    cells.forEach((c, i) => {
      const cl = cols[i]!;
      const f = i === 0 || i === 5 ? bold : font;
      if (i === 6) {
        const t = fit(f, c, 8.5, cl.w);
        page.drawText(t, { x: PW - M - f.widthOfTextAtSize(t, 8.5), y, size: 8.5, font: f, color: INK });
      } else page.drawText(fit(f, c, 8.5, cl.w - 6), { x: cl.x, y, size: 8.5, font: f, color: INK });
    });
    page.drawCircle({ x: M - 7, y: y + 3, size: 2.5, color: col(d.type.color) });
    y -= 11;
    for (const l of extraLines) {
      page.drawText(l, { x: M + 44, y, size: 7.5, font, color: MUTED });
      y -= 10;
    }
    y -= 4;
  }

  /* ───────────── 6. Orçamento ───────────── */
  heading("6", "Orçamento estimado do tratamento");
  const oc = [
    { h: "TRATAMENTO", x: M, w: 250 },
    { h: "QTD.", x: M + 250, w: 70 },
    { h: "UNITÁRIO", x: M + 320, w: 90 },
    { h: "TOTAL", x: M + 410, w: CW - 410 },
  ];
  ensure(30);
  for (const c of oc) {
    const x = c.h === "TOTAL" ? PW - M - bold.widthOfTextAtSize(c.h, 7) : c.x;
    page.drawText(c.h, { x, y, size: 7, font: bold, color: MUTED });
  }
  y -= 6;
  page.drawLine({ start: { x: M, y }, end: { x: PW - M, y }, color: LINE, thickness: 0.5 });
  y -= 13;
  for (const r of dx.byType) {
    ensure(26);
    const qty = r.price.unit === "un" ? `${r.count} un.` : r.price.unit === "m2" ? fmtArea(r.qty) : fmtLength(r.qty);
    page.drawText(fit(bold, r.type.name, 8.5, oc[0]!.w - 8), { x: M, y, size: 8.5, font: bold, color: INK });
    page.drawText(qty, { x: oc[1]!.x, y, size: 8.5, font, color: INK });
    page.drawText(`${fmtBRL(r.price.priceCents)}/${unitLabels[r.price.unit]}`, { x: oc[2]!.x, y, size: 8.5, font, color: INK });
    const tt = fmtBRL(r.cents);
    page.drawText(tt, { x: PW - M - font.widthOfTextAtSize(tt, 8.5), y, size: 8.5, font, color: INK });
    y -= 10;
    if (r.price.treatment) {
      page.drawText(fit(font, r.price.treatment, 7.5, oc[0]!.w + 60), { x: M, y, size: 7.5, font, color: MUTED });
      y -= 10;
    }
    y -= 5;
  }
  ensure(30);
  page.drawLine({ start: { x: M, y: y + 4 }, end: { x: PW - M, y: y + 4 }, color: INK, thickness: 0.8 });
  y -= 10;
  page.drawText("TOTAL ESTIMADO", { x: M, y, size: 9.5, font: bold, color: INK });
  const tot = fmtBRL(dx.kpis.totalCents);
  page.drawText(tot, { x: PW - M - bold.widthOfTextAtSize(tot, 12), y, size: 12, font: bold, color: INK });
  y -= 22;
  para("Valores de referência da tabela do escritório, sujeitos a confirmação após levantamento detalhado e definição do projeto de intervenção.", 8);

  /* ───────────── Assinatura ───────────── */
  ensure(110);
  y -= 50;
  page.drawLine({ start: { x: M, y }, end: { x: M + 240, y }, color: INK, thickness: 0.6 });
  y -= 13;
  text(author.name, { f: bold, size: 9.5 });
  y -= 12;
  text([author.professionalId, orgName].filter(Boolean).join(" · "), { color: MUTED, size: 8.5 });
  y -= 12;
  text(`Responsável técnico · ${today}`, { color: MUTED, size: 8.5 });

  /* ── rodapé em todas as páginas (menos a capa) ── */
  const all = pdf.getPages();
  all.forEach((p, i) => {
    if (i === 0) return;
    const foot = fit(font, `${site.name} · Laudo de estado de conservação · ${today}`, 7.5, CW - 60);
    p.drawLine({ start: { x: M, y: M - 6 }, end: { x: PW - M, y: M - 6 }, color: LINE, thickness: 0.5 });
    p.drawText(foot, { x: M, y: M - 18, size: 7.5, font, color: MUTED });
    const pn = `${i + 1} / ${all.length}`;
    p.drawText(pn, { x: PW - M - font.widthOfTextAtSize(pn, 7.5), y: M - 18, size: 7.5, font, color: MUTED });
  });

  return pdf.save();
}
