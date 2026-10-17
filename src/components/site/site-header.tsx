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

/** Cabeçalho do site público (home, empresas, histórias e Index). */
export async function SiteHeader({ rootId, lang }: { rootId: string; lang: Lang }) {
  const user = await getUser();
  const en = lang === "en";
  const SITE_NAV = siteNav(lang);
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-[60px] items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label={en ? "ArchRay — home" : "ArchRay — início"} className="flex shrink-0 items-center gap-2">
          <BrandMark className="h-[18px]" />
          <BrandLogo className="site-logo h-[17px]" />
        </Link>
        <nav className="hidden items-center gap-6 text-[13.5px] font-medium md:flex">
          {SITE_NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-foreground/75 transition-colors hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <SiteLangToggle lang={lang} className="hidden sm:flex" />
          <SiteThemeToggle rootId={rootId} />
          {user ? (
            <Link href="/" className="inline-flex h-9 items-center gap-1 rounded-full bg-foreground px-4 text-[13.5px] font-medium whitespace-nowrap text-background hover:opacity-85">
              {en ? "Open ArchRay" : "Abrir o ArchRay"} <ArrowUpRight className="size-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden h-9 items-center rounded-full bg-secondary px-4 text-[13.5px] font-medium hover:bg-accent sm:inline-flex">
                {en ? "Client area" : "Área do cliente"}
              </Link>
              <Link href="/contato" className="inline-flex h-9 items-center gap-1 rounded-full bg-foreground px-4 text-[13.5px] font-medium whitespace-nowrap text-background hover:opacity-85">
                <span className="sm:hidden">{en ? "Request" : "Solicitar"}</span>
                <span className="hidden sm:inline">{en ? "Request a diagnosis" : "Solicitar diagnóstico"}</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </>
          )}
          <details className="relative md:hidden">
            <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-full hover:bg-muted [&::-webkit-details-marker]:hidden" aria-label="Menu">
              <Menu className="size-5" />
            </summary>
            <nav className="absolute top-11 right-0 grid w-56 gap-0.5 rounded-2xl border bg-popover p-2 text-[15px] shadow-2xl">
              {SITE_NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-xl px-3 py-2 hover:bg-muted">
                  {n.label}
                </Link>
              ))}
              {!user && (
                <Link href="/login" className="rounded-xl px-3 py-2 hover:bg-muted">
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
