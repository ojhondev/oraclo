// Copia o runtime do ONNX Runtime Web para public/ort (servido como estático, fora do bundler).
// Usado pelo "Contorno IA" (src/lib/sam). Roda antes do dev e do build.
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

const src = join("node_modules", "onnxruntime-web", "dist");
const dst = join("public", "ort");
const files = [
  "ort.webgpu.min.mjs",
  "ort-wasm-simd-threaded.asyncify.mjs",
  "ort-wasm-simd-threaded.asyncify.wasm",
  "ort.wasm.min.mjs",
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.wasm",
];
mkdirSync(dst, { recursive: true });
for (const f of files) {
  const from = join(src, f);
  const to = join(dst, f);
  try {
    if (statSync(to).size === statSync(from).size) continue;
  } catch {
    // ainda não copiado
  }
  copyFileSync(from, to);
}
console.log(`onnxruntime-web → ${dst} (${files.length} arquivos)`);
