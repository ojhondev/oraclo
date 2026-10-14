import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { fmtArea, fmtLength } from "@/lib/geometry";
import { fmtDate } from "@/lib/format";
import { protectionLevels, severities } from "@/lib/labels";
import { hexToRgb, pointsOf, type ExportData } from "./common";

const A3: [number, number] = [1190.55, 841.89]; // paisagem, em pontos
const M = 28; // margem
const SIDE = 270; // coluna da legenda/carimbo
const INK = rgb(0.086, 0.094, 0.106);
const MUTED = rgb(0.4, 0.38, 0.36);
const LINE = rgb(0.8, 0.78, 0.74);
const BRAND = rgb(0.055, 0.486, 0.482);

const col = (hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  return rgb(r / 255, g / 255, b / 255);
};

/** Corta o texto para caber na largura (fonte padrão WinAnsi). */
function fit(font: PDFFont, text: string, size: number, width: number) {
  const clean = text.replace(/[^\u0000-ÿ–—•·]/g, "");
  if (font.widthOfTextAtSize(clean, size) <= width) return clean;
  let t = clean;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, size) > width) t = t.slice(0, -1);
  return `${t}…`;
}

function wrap(font: PDFFont, text: string, size: number, width: number) {
  const words = text.replace(/[^\u0000-ÿ–—•·]/g, "").split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > width && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** 1:N com dois algarismos significativos (a ortofoto ocupa a área toda, não é escala padrão). */
function approxScale(n: number) {
  const p = 10 ** Math.max(0, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / p) * p;
}

/**
 * Prancha A3 do mapa de danos: ortofoto com os danos desenhados em vetor, legenda com
 * quantitativos, escala gráfica e carimbo com os dados do bem e do responsável técnico.
 */
export async function buildPdf(data: ExportData, image: Uint8Array) {
  const { ortho, damages, typeById, summary, site, element, user, author } = data;
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Mapa de danos — ${site.name} — ${ortho.name}`);
  pdf.setAuthor(author.name);
  pdf.setCreator("Oraclo");
  pdf.setProducer("Oraclo");
  const page = pdf.addPage(A3);
  const [PW, PH] = A3;
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // moldura
  page.drawRectangle({ x: M / 2, y: M / 2, width: PW - M, height: PH - M, borderColor: INK, borderWidth: 1 });

  /* ── área do desenho ── */
  const areaX = M;
  const areaY = M;
  const areaW = PW - 2 * M - SIDE - 16;
  const areaH = PH - 2 * M;
  const W = ortho.widthPx;
  const H = ortho.heightPx;
  const k = Math.min(areaW / W, areaH / H); // pontos por pixel
  const iw = W * k;
  const ih = H * k;
  const ix = areaX + (areaW - iw) / 2;
  const iy = areaY + (areaH - ih) / 2;

  const img = ortho.contentType === "image/png" ? await pdf.embedPng(image) : await pdf.embedJpg(image);
  page.drawImage(img, { x: ix, y: iy, width: iw, height: ih });
  page.drawRectangle({ x: ix, y: iy, width: iw, height: ih, borderColor: LINE, borderWidth: 0.5 });

  const PX = (x: number) => ix + x * k;
  const PY = (y: number) => iy + (H - y) * k;

  damages.forEach((d, i) => {
    const t = typeById.get(d.typeId)!;
    const p = pointsOf(d);
    if (!p.length) return;
    const c = col(t.color);
    if (t.geometry === "area" && p.length >= 3) {
      const path = `M ${p.map(([x, y]) => `${x * k} ${y * k}`).join(" L ")} Z`;
      page.drawSvgPath(path, { x: ix, y: iy + ih, color: c, opacity: 0.32, borderColor: c, borderWidth: 1, borderOpacity: 1 });
      const cx = p.reduce((a, q) => a + q[0], 0) / p.length;
      const cy = p.reduce((a, q) => a + q[1], 0) / p.length;
      label(page, bold, `${t.code}-${i + 1}`, PX(cx), PY(cy), c);
    } else if (t.geometry === "linha" && p.length >= 2) {
      const path = `M ${p.map(([x, y]) => `${x * k} ${y * k}`).join(" L ")}`;
      const w = t.pattern === "linha-grossa" ? 2.4 : t.pattern === "linha-dupla" ? 1.8 : 1.2;
      page.drawSvgPath(path, { x: ix, y: iy + ih, borderColor: rgb(1, 1, 1), borderWidth: w + 1.4, borderOpacity: 0.7 });
      page.drawSvgPath(path, { x: ix, y: iy + ih, borderColor: c, borderWidth: w });
      label(page, bold, `${t.code}-${i + 1}`, PX(p[0]![0]), PY(p[0]![1]) + 5, c);
    } else {
      page.drawCircle({ x: PX(p[0]![0]), y: PY(p[0]![1]), size: 3.5, color: c, borderColor: rgb(1, 1, 1), borderWidth: 0.8 });
      label(page, bold, `${t.code}-${i + 1}`, PX(p[0]![0]) + 9, PY(p[0]![1]), c);
    }
  });

  /* ── coluna lateral ── */
  const sx = PW - M - SIDE;
  const sw = SIDE;
  page.drawLine({ start: { x: sx - 8, y: M / 2 }, end: { x: sx - 8, y: PH - M / 2 }, color: INK, thickness: 1 });

  let y = PH - M - 8;
  page.drawText("MAPA DE DANOS", { x: sx, y, size: 15, font: bold, color: INK });
  y -= 16;
  page.drawText(fit(font, ortho.name, 9.5, sw), { x: sx, y, size: 9.5, font, color: MUTED });
  y -= 22;

  // legenda
  page.drawText("LEGENDA E QUANTITATIVOS", { x: sx, y, size: 7.5, font: bold, color: BRAND });
  y -= 13;
  if (!summary.length) {
    page.drawText("Nenhum dano registrado.", { x: sx, y, size: 8.5, font, color: MUTED });
    y -= 14;
  }
  for (const { type, count, areaM2, lengthM } of summary) {
    if (y < 290) break;
    const c = col(type.color);
    if (type.geometry === "linha") page.drawLine({ start: { x: sx, y: y + 3 }, end: { x: sx + 16, y: y + 3 }, color: c, thickness: 2 });
    else if (type.geometry === "ponto") page.drawCircle({ x: sx + 8, y: y + 3, size: 3.5, color: c });
    else page.drawRectangle({ x: sx, y: y - 1, width: 16, height: 9, color: c, opacity: 0.45, borderColor: c, borderWidth: 0.8 });
    const qty =
      type.geometry === "area"
        ? ortho.mmPerPixel ? fmtArea(areaM2) : `${count} un.`
        : type.geometry === "linha"
          ? ortho.mmPerPixel ? fmtLength(lengthM) : `${count} un.`
          : `${count} un.`;
    const qw = font.widthOfTextAtSize(qty, 8.5);
    page.drawText(fit(font, `${type.code} · ${type.name}`, 8.5, sw - 26 - qw - 6), { x: sx + 24, y, size: 8.5, font, color: INK });
    page.drawText(qty, { x: sx + sw - qw, y, size: 8.5, font, color: INK });
    y -= 14;
  }

  // danos graves/críticos
  const severe = damages.filter((d) => d.severity === "alta" || d.severity === "critica");
  if (severe.length && y > 330) {
    y -= 6;
    page.drawText("DANOS DE GRAVIDADE ALTA / CRÍTICA", { x: sx, y, size: 7.5, font: bold, color: BRAND });
    y -= 12;
    for (const d of severe) {
      if (y < 300) break;
      const t = typeById.get(d.typeId)!;
      const idx = damages.indexOf(d) + 1;
      const txt = `${t.code}-${idx} (${severities[d.severity]})${d.recommendation ? ` — ${d.recommendation}` : ""}`;
      for (const l of wrap(font, txt, 7.5, sw).slice(0, 2)) {
        page.drawText(l, { x: sx, y, size: 7.5, font, color: INK });
        y -= 10;
      }
    }
  }

  /* ── escala gráfica ── */
  let by = 262;
  page.drawText("ESCALA", { x: sx, y: by, size: 7.5, font: bold, color: BRAND });
  by -= 16;
  if (ortho.mmPerPixel) {
    const mPerPt = ortho.mmPerPixel / 1000 / k;
    const target = 150 * mPerPt; // metros que cabem em ~150 pt
    const candidates = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 500];
    const L = candidates.filter((c) => c <= target).pop() ?? candidates[0]!;
    const len = L / mPerPt;
    for (let i = 0; i < 4; i++) {
      page.drawRectangle({ x: sx + (len / 4) * i, y: by, width: len / 4, height: 5, color: i % 2 ? rgb(1, 1, 1) : INK, borderColor: INK, borderWidth: 0.6 });
    }
    page.drawText("0", { x: sx - 2, y: by - 10, size: 7, font, color: INK });
    const lt = `${String(L).replace(".", ",")} m`;
    page.drawText(lt, { x: sx + len - font.widthOfTextAtSize(lt, 7) / 2, y: by - 10, size: 7, font, color: INK });
    const n = approxScale(mPerPt / (0.352778 / 1000));
    page.drawText(`Aprox. 1:${Math.round(n).toLocaleString("pt-BR")} (impressão em A3)`, { x: sx, y: by - 24, size: 7.5, font, color: MUTED });
  } else {
    page.drawText("Ortofoto sem escala definida — medidas indisponíveis.", { x: sx, y: by, size: 7.5, font, color: rgb(0.7, 0.14, 0.09) });
  }

  /* ── carimbo ── */
  const cy0 = M;
  const ch = 170;
  page.drawRectangle({ x: sx, y: cy0, width: sw, height: ch, borderColor: INK, borderWidth: 0.8 });
  const rows: [string, string][] = [
    ["BEM", site.name],
    ["LOCAL", [site.address, site.city, site.state].filter(Boolean).join(", ") || "—"],
    ["PROTEÇÃO", site.protection === "nenhuma" ? protectionLevels.nenhuma : `${site.protectionBody ?? protectionLevels[site.protection]}${site.processNumber ? ` · ${site.processNumber}` : ""}`],
    ["PARTE", element?.name ?? "—"],
    ["RESPONSÁVEL", `${author.name}${author.professionalId ? ` · ${author.professionalId}` : ""}`],
    ["ORGANIZAÇÃO", user.orgName],
  ];
  let ry = cy0 + ch - 14;
  for (const [k2, v] of rows) {
    page.drawText(k2, { x: sx + 8, y: ry, size: 6.2, font: bold, color: MUTED });
    page.drawText(fit(font, v, 8.5, sw - 16), { x: sx + 8, y: ry - 10, size: 8.5, font, color: INK });
    ry -= 23;
  }
  page.drawLine({ start: { x: sx, y: cy0 + 24 }, end: { x: sx + sw, y: cy0 + 24 }, color: INK, thickness: 0.6 });
  page.drawText(`DATA ${fmtDate(new Date())}`, { x: sx + 8, y: cy0 + 9, size: 7.5, font: bold, color: INK });
  page.drawText("FOLHA 01/01", { x: sx + sw / 2 - 20, y: cy0 + 9, size: 7.5, font: bold, color: INK });
  const brand = "ORACLO";
  page.drawText(brand, { x: sx + sw - 8 - bold.widthOfTextAtSize(brand, 8), y: cy0 + 9, size: 8, font: bold, color: BRAND });

  return pdf.save();
}

function label(page: PDFPage, font: PDFFont, text: string, x: number, y: number, color: ReturnType<typeof rgb>) {
  const size = 6;
  const w = font.widthOfTextAtSize(text, size);
  page.drawRectangle({ x: x - w / 2 - 2, y: y - 2.5, width: w + 4, height: size + 3, color: rgb(1, 1, 1), opacity: 0.85 });
  page.drawText(text, { x: x - w / 2, y: y - 0.5, size, font, color });
}
