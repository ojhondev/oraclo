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

/** Invólucro do site público: tema próprio (claro por padrão), cabeçalho, rodapé e movimento. */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  // claro (marfim) por padrão; escuro só se a pessoa escolheu
  const dark = (await cookies()).get(SITE_THEME_COOKIE)?.value === "escuro";
  const lang = await getLang();
  return (
    <div id={ROOT_ID} lang={lang === "en" ? "en" : "pt-BR"} className={cn("site-theme flex min-h-svh flex-col", eng.variable, engMono.variable, dark && "site-dark")}>
      <SiteHeader rootId={ROOT_ID} lang={lang} />
      <main className="flex-1">{children}</main>
      <SiteFooter lang={lang} />
      <SiteMotion rootId={ROOT_ID} />
      <SmoothScroll />
    </div>
  );
}
