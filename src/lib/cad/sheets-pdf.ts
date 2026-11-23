/**
 * PDF vetorial das pranchas do ArchRay CAD (roda no navegador, com pdf-lib): uma página por
 * prancha, no tamanho real da folha, com traços na espessura de pena, textos, carimbo e, se
 * pedido, a foto clareada por baixo (recortada à janela de desenho).
 */
import { PDFDocument, StandardFonts, clip, degrees, endPath, popGraphicsState, pushGraphicsState, rectangle, rgb } from "pdf-lib";
import { sheetPaper, type Sheet } from "./sheets";
import type { CadDoc } from "./types";

const PT = 72 / 25.4; // pontos por mm
const INK = rgb(0.05, 0.05, 0.06);
const MUTED = rgb(0.42, 0.42, 0.44);
/** Fonte padrão do PDF só tem WinAnsi: tira o que não cabe (acentos do português ficam). */
const clean = (s: string) => s.replace(/[^ -ÿ–—•·]/g, "");

export async function sheetsToPdf(doc: CadDoc, sheets: Sheet[], fetchBytes: (url: string) => Promise<Uint8Array> = async (u) => new Uint8Array(await (await fetch(u)).arrayBuffer())) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(sheets.length === 1 ? sheets[0]!.name : `Pranchas (${sheets.length})`);
  pdf.setCreator("ArchRay");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const images = new Map<string, Awaited<ReturnType<PDFDocument["embedJpg"]>>>();

  for (const s of sheets) {
    const paper = sheetPaper(doc, s);
    const page = pdf.addPage([paper.layout.w * PT, paper.layout.h * PT]);
    if (paper.image) {
      try {
        let img = images.get(paper.image.url);
        if (!img) {
          const bytes = await fetchBytes(paper.image.url);
          const png = bytes[0] === 0x89 && bytes[1] === 0x50;
          img = png ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
          images.set(paper.image.url, img);
        }
        const c = paper.image.clip;
        page.pushOperators(pushGraphicsState(), rectangle(c.x0 * PT, c.y0 * PT, (c.x1 - c.x0) * PT, (c.y1 - c.y0) * PT), clip(), endPath());
        page.drawImage(img, { x: paper.image.p[0] * PT, y: paper.image.p[1] * PT, width: paper.image.w * PT, height: paper.image.h * PT, opacity: 0.35 });
        page.pushOperators(popGraphicsState());
      } catch {
        // foto indisponível: a prancha sai só com o desenho
      }
    }
    for (const g of paper.segs)
      page.drawLine({ start: { x: g.a[0] * PT, y: g.a[1] * PT }, end: { x: g.b[0] * PT, y: g.b[1] * PT }, thickness: g.w * PT, color: INK, lineCap: 1 });
    for (const t of paper.texts) {
      const f = t.bold ? bold : font;
      const size = t.size * PT;
      const s2 = clean(t.s);
      if (!s2 || size < 1) continue;
      const w = f.widthOfTextAtSize(s2, size);
      const shift = t.align === "center" ? w / 2 : t.align === "right" ? w : 0;
      const x = t.p[0] * PT - Math.cos(t.rot) * shift, y = t.p[1] * PT - Math.sin(t.rot) * shift;
      page.drawText(s2, { x, y, size, font: f, color: t.muted ? MUTED : INK, rotate: degrees((t.rot * 180) / Math.PI) });
    }
  }
  return pdf.save();
}
