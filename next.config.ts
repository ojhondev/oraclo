import type { NextConfig } from "next";

// App interno autenticado: tudo é dinâmico por natureza, então Cache Components
// fica desligado (opcional no Next 16) e as telas renderizam a cada request.
// Isolamento de origem (SharedArrayBuffer) para o "Contorno IA" usar várias threads no WASM.
// Vale para o app todo porque a navegação do Next não recarrega o documento ao abrir o editor.
// `credentialless` mantém as imagens do Blob carregando sem CORP.
const isolation = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: isolation },
      { source: "/ort/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
