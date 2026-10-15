import Link from "next/link";
import { Menu } from "lucide-react";
import { BrandLogo, BrandMark } from "@/components/brand";
import { getUser } from "@/lib/auth";

export const SITE_NAV = [
  { href: "/#produto", label: "Produto" },
  { href: "/empresas", label: "Para empresas" },
  { href: "/historias", label: "Histórias" },
  { href: "/index", label: "Index" },
];

/** Cabeçalho do site público (home, empresas, histórias e Index). */
export async function SiteHeader() {
  const user = await getUser();
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-16 items-center gap-8 px-4 sm:px-8 lg:px-12">
        <Link href="/" aria-label="ArchRay — início" className="flex shrink-0 items-center gap-2">
          <BrandMark className="h-[19px]" />
          <BrandLogo className="h-[18px]" />
        </Link>
        <nav className="hidden items-center gap-7 text-[14.5px] md:flex">
          {SITE_NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-foreground/80 transition-colors hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <Link href="/" className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-[14px] font-medium text-background hover:opacity-85">
              Abrir o ArchRay
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden h-9 items-center rounded-full px-3 text-[14px] text-foreground/80 hover:text-foreground sm:inline-flex">
                Entrar
              </Link>
              <Link href="/cadastro" className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-[14px] font-medium text-background hover:opacity-85">
                Começar grátis
              </Link>
            </>
          )}
          <details className="group relative md:hidden">
            <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-full hover:bg-muted [&::-webkit-details-marker]:hidden" aria-label="Menu">
              <Menu className="size-5" />
            </summary>
            <nav className="absolute top-11 right-0 grid w-56 gap-0.5 rounded-2xl border bg-background p-2 text-[15px] shadow-lg">
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
