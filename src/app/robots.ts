import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://archray.com.br";

/** O site público e o Index são indexados; a plataforma (área logada) e a API, não. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/academy", "/app-captura", "/bens", "/biblioteca", "/capturar", "/equipe", "/mapas", "/modelos", "/perfil", "/solicitacoes", "/convite", "/redefinir-senha", "/esqueci-senha"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
