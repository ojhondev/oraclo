import type { MetadataRoute } from "next";

/** Permite "Adicionar à tela inicial" no celular — abre o Oraclo como app, sem a barra do navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oraclo",
    short_name: "Oraclo",
    description: "Do scan ao BIM: captura pelo celular, nuvem de pontos e modelo BIM.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
