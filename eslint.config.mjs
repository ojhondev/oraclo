import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // caches e scripts locais (fora do git)
    ".cache/**",
    ".tmp/**",
    // runtime do onnxruntime-web copiado por scripts/copy-ort.mjs
    "public/ort/**",
  ]),
]);

export default eslintConfig;
