import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { BrandLogo, BrandMark } from "@/components/brand";
import { getUser } from "@/lib/auth";
import { SiteThemeToggle } from "./site-theme-toggle";

export const SITE_NAV = [
  { href: "/#produto", label: "Produto" },
  { href: "/empresas", label: "Para empresas" },
  { href: "/historias", label: "Histórias" },
  { href: "/index", label: "Index" },
];

/** Cabeçalho do site público (home, empresas, histórias e Index). */
export async function SiteHeader({ rootId }: { rootId: string }) {
  const user = await getUser();
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-[60px] items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="ArchRay — início" className="flex shrink-0 items-center gap-2">
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
          <SiteThemeToggle rootId={rootId} />
          {user ? (
            <Link href="/" className="inline-flex h-9 items-center gap-1 rounded-full bg-foreground px-4 text-[13.5px] font-medium text-background hover:opacity-85">
              Abrir o ArchRay <ArrowUpRight className="size-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden h-9 items-center rounded-full bg-secondary px-4 text-[13.5px] font-medium hover:bg-accent sm:inline-flex">
                Entrar
              </Link>
              <Link href="/cadastro" className="inline-flex h-9 items-center gap-1 rounded-full bg-foreground px-4 text-[13.5px] font-medium whitespace-nowrap text-background hover:opacity-85">
                <span className="sm:hidden">Começar</span>
                <span className="hidden sm:inline">Começar grátis</span>
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
                  Entrar
                </Link>
              )}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
