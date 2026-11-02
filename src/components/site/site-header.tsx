import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { BrandLogo, BrandMark } from "@/components/brand";
import { getUser } from "@/lib/auth";
import { SiteThemeToggle } from "./site-theme-toggle";
import { SiteLangToggle } from "./site-lang-toggle";
import type { Lang } from "@/lib/site/lang";

export const siteNav = (lang: Lang) => [
  { href: "/#produto", label: lang === "en" ? "Service" : "Serviço" },
  { href: "/#como-funciona", label: lang === "en" ? "How it works" : "Como funciona" },
  { href: "/empresas", label: lang === "en" ? "Sectors" : "Setores" },
  { href: "/historias", label: lang === "en" ? "Cases" : "Casos" },
  { href: "/index", label: "Index" },
  { href: "/docs", label: lang === "en" ? "Docs" : "Documentação" },
];

/** Cabeçalho do site público: pílulas à esquerda, marca ao centro e ações à direita (como a Anthropic). */
export async function SiteHeader({ rootId, lang }: { rootId: string; lang: Lang }) {
  const user = await getUser();
  const en = lang === "en";
  const SITE_NAV = siteNav(lang);
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl">
      <div className="grid h-[68px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <nav className="hidden min-w-0 items-center gap-1.5 lg:flex" aria-label={en ? "Main" : "Principal"}>
          {SITE_NAV.map((n) => (
            <Link key={n.href} href={n.href} className="a-pill">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/" aria-label={en ? "ArchRay — home" : "ArchRay — início"} className="col-start-1 row-start-1 flex shrink-0 items-center gap-2 justify-self-start lg:col-start-2 lg:justify-self-center">
          <BrandMark className="h-[19px] shrink-0" />
          <BrandLogo className="site-logo h-[18px]" />
        </Link>
        <div className="col-start-3 row-start-1 flex items-center justify-end gap-1.5">
          <SiteLangToggle lang={lang} className="hidden sm:flex" />
          <SiteThemeToggle rootId={rootId} />
          {user ? (
            <Link href="/" className="a-btn a-btn-sm">
              {en ? "Open ArchRay" : "Abrir o ArchRay"} <ArrowUpRight className="size-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="a-pill hidden sm:inline-flex">
                {en ? "Client area" : "Área do cliente"}
              </Link>
              <Link href="/contato" className="a-btn a-btn-sm">
                <span className="sm:hidden">{en ? "Request" : "Solicitar"}</span>
                <span className="hidden sm:inline">{en ? "Request a diagnosis" : "Solicitar diagnóstico"}</span>
              </Link>
            </>
          )}
          <details className="relative lg:hidden">
            <summary className="grid size-[30px] cursor-pointer list-none place-items-center rounded-full bg-[var(--site-pill)] hover:bg-[var(--site-pill-hover)] [&::-webkit-details-marker]:hidden" aria-label="Menu">
              <Menu className="size-4" />
            </summary>
            <nav className="absolute top-10 right-0 grid w-60 gap-0.5 rounded-2xl border bg-popover p-2 text-[15px] shadow-2xl">
              {SITE_NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 hover:bg-muted">
                  {n.label}
                </Link>
              ))}
              {!user && (
                <Link href="/login" className="rounded-lg px-3 py-2 hover:bg-muted">
                  {en ? "Client area" : "Área do cliente"}
                </Link>
              )}
              <div className="mt-1 flex items-center justify-between border-t px-3 pt-2.5 pb-1 text-[13px] text-muted-foreground">
                {en ? "Language" : "Idioma"}
                <SiteLangToggle lang={lang} />
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
