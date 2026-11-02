import { cookies } from "next/headers";
import { cn } from "@/lib/utils";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SiteMotion } from "./site-motion";
import { SITE_THEME_COOKIE } from "@/lib/site/theme";
import { getLang } from "@/lib/site/get-lang";
import "./site.css";

const ROOT_ID = "archray-site";

/** Invólucro do site público: tema próprio (claro por padrão), cabeçalho, rodapé e movimento. */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  // claro (marfim) por padrão; escuro só se a pessoa escolheu
  const dark = (await cookies()).get(SITE_THEME_COOKIE)?.value === "escuro";
  const lang = await getLang();
  return (
    <div id={ROOT_ID} lang={lang === "en" ? "en" : "pt-BR"} className={cn("site-theme flex min-h-svh flex-col", dark && "site-dark")}>
      <SiteHeader rootId={ROOT_ID} lang={lang} />
      <main className="flex-1">{children}</main>
      <SiteFooter lang={lang} />
      <SiteMotion rootId={ROOT_ID} />
    </div>
  );
}
