// Exporta as ilustrações do site (src/components/site/illo*.tsx) em PNG, para posts e materiais.
// Uso: node scripts/ilustracoes.mjs [pasta de saída] [tamanho em px]
// Padrão: "A:/Claude Code/ArchRay - Ilustracoes", 2048 px. Gera também 00-catalogo.png.
import { build } from "esbuild";
import { mkdirSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const OUT = process.argv[2] ?? "A:/Claude Code/ArchRay - Ilustracoes";
const SIZE = Number(process.argv[3] ?? 2048);
const TMP = ".cache/illo-render.mjs";

// empacota o componente React com o renderizador estático
await build({
  stdin: {
    contents: `
      import { createElement } from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { Illo, ILLO_NAMES } from "./src/components/site/illo";
      export const names = ILLO_NAMES;
      export const svg = (name) => renderToStaticMarkup(createElement(Illo, { name })).replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"');
    `,
    resolveDir: process.cwd(),
    loader: "tsx",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  jsx: "automatic",
  outfile: TMP,
  logLevel: "warning",
  external: ["react", "react-dom"],
});
const { names, svg } = await import(pathToFileURL(TMP).href + `?t=${Date.now()}`);

mkdirSync(OUT, { recursive: true });
const pngs = [];
for (const [i, name] of names.entries()) {
  const file = `${OUT}/${String(i + 1).padStart(2, "0")}-${name}.png`;
  const buf = await sharp(Buffer.from(svg(name)), { density: (72 * SIZE) / 200 }).resize(SIZE, SIZE).png().toBuffer();
  await sharp(buf).toFile(file);
  pngs.push({ name, buf });
}

// catálogo: grade com todas, numeradas
const cols = 8;
const cell = 240;
const pad = 16;
const label = 26;
const rows = Math.ceil(pngs.length / cols);
const W = cols * (cell + pad) + pad;
const H = rows * (cell + label + pad) + pad;
const tiles = await Promise.all(
  pngs.map(async ({ name, buf }, i) => {
    const x = pad + (i % cols) * (cell + pad);
    const y = pad + Math.floor(i / cols) * (cell + label + pad);
    const img = await sharp(buf).resize(cell, cell).png().toBuffer();
    const text = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="${label}"><text x="2" y="18" font-family="Arial" font-size="15" fill="#5e5d59">${String(i + 1).padStart(2, "0")} · ${name}</text></svg>`,
    );
    return [
      { input: img, left: x, top: y },
      { input: text, left: x, top: y + cell + 2 },
    ];
  }),
);
await sharp({ create: { width: W, height: H, channels: 4, background: "#faf9f5" } })
  .composite(tiles.flat())
  .png()
  .toFile(`${OUT}/00-catalogo.png`);

rmSync(TMP, { force: true });
console.log(`${pngs.length} ilustrações em ${OUT} (${SIZE}×${SIZE}) + 00-catalogo.png`);
