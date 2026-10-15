import { cookies } from "next/headers";
import { cn } from "@/lib/utils";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SiteMotion } from "./site-motion";
import { SITE_THEME_COOKIE } from "@/lib/site/theme";
import "./site.css";

const ROOT_ID = "archray-site";

/** Invólucro do site público: tema próprio (escuro por padrão), cabeçalho, rodapé e movimento. */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const light = (await cookies()).get(SITE_THEME_COOKIE)?.value === "claro";
  return (
    <div id={ROOT_ID} className={cn("site-theme flex min-h-svh flex-col", light && "site-light")}>
      <SiteHeader rootId={ROOT_ID} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <SiteMotion rootId={ROOT_ID} />
    </div>
  );
}
