import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { SmoothScroll } from "@/components/eng/smooth-scroll";
import { cn } from "@/lib/utils";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SiteMotion } from "./site-motion";
import { SITE_THEME_COOKIE } from "@/lib/site/theme";
import { getLang } from "@/lib/site/get-lang";
import "./site.css";

const ROOT_ID = "archray-site";

// fontes livres no lugar da Aeonik do Scale: grotesca geométrica e mono técnico
const eng = Geist({ variable: "--font-eng", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const engMono = Geist_Mono({ variable: "--font-eng-mono", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

/** Invólucro do site público: tema próprio (escuro por padrão, claro como opção), cabeçalho, rodapé e movimento. */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  // escuro é o tema principal; claro só se a pessoa escolheu no botão
  const dark = (await cookies()).get(SITE_THEME_COOKIE)?.value !== "claro";
  const lang = await getLang();
  return (
    <div id={ROOT_ID} lang={lang === "en" ? "en" : "pt-BR"} className={cn("site-theme flex min-h-svh flex-col", eng.variable, engMono.variable, dark && "site-dark")}>
      {/* Satoshi (Fontshare, licença livre): a grotesca geométrica gratuita mais próxima da Aeonik do Scale */}
      <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
      <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" precedence="default" />
      <SiteHeader rootId={ROOT_ID} lang={lang} />
      <main className="flex-1">{children}</main>
      <SiteFooter lang={lang} />
      <SiteMotion rootId={ROOT_ID} />
      <SmoothScroll />
    </div>
  );
}
