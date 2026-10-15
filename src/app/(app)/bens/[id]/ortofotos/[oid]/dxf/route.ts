import { zipSync, strToU8 } from "fflate";
import { loadExportData, fetchImage, slug } from "@/lib/exports/common";
import { buildDxf } from "@/lib/exports/dxf";

/** ZIP com o DXF + a imagem da ortofoto (o DXF referencia a imagem pelo caminho relativo). */
export async function GET(_: Request, ctx: RouteContext<"/bens/[id]/ortofotos/[oid]/dxf">) {
  const { id, oid } = await ctx.params;
  const data = await loadExportData(id, oid);
  if (!data) return new Response("Não autorizado", { status: 401 });

  const ext = data.ortho.contentType === "image/png" ? "png" : "jpg";
  const base = slug(`${data.site.name}-${data.ortho.name}`) || "mapa-de-danos";
  const imageFile = `${base}-ortofoto.${ext}`;
  const dxf = buildDxf(data, imageFile);
  const image = await fetchImage(data.ortho.url);

  const readme = [
    "ArchRay - mapa de danos em DXF",
    "",
    `Projeto: ${data.site.name}`,
    `Ortofoto: ${data.ortho.name}`,
    data.ortho.mmPerPixel
      ? `Escala: ${data.ortho.mmPerPixel.toFixed(3)} mm/pixel - desenho em METROS, origem no canto inferior esquerdo da ortofoto.`
      : "ATENÇÃO: ortofoto sem escala - o desenho está em PIXELS. Calibre no ArchRay e exporte de novo.",
    "",
    "Como abrir:",
    "1. Extraia o ZIP mantendo os dois arquivos na MESMA pasta.",
    "2. Abra o .dxf no AutoCAD, BricsCAD, ZWCAD, DraftSight, QCAD ou LibreCAD.",
    "3. Se a imagem não aparecer, use o Gerenciador de Referências Externas (XREF) e aponte para o arquivo da ortofoto.",
    "",
    "Camadas:",
    "  ORTOFOTO, LIMITE-ORTOFOTO, ROTULOS-DANOS, LEGENDA",
    "  DANO-<CÓDIGO>-<NOME> - uma por tipo de dano (polilinhas + hachuras)",
  ].join("\r\n");

  const zip = zipSync({
    [`${base}.dxf`]: strToU8(dxf),
    [imageFile]: [image, { level: 0 }],
    "LEIA-ME.txt": strToU8(readme),
  });

  return new Response(Buffer.from(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${base}-dxf.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
