import Link from "next/link";
import { ArrowUpRight, ChevronDown, Menu } from "lucide-react";
import { BrandLogo, BrandMark } from "@/components/brand";
import { getUser } from "@/lib/auth";
import { SITE } from "@/lib/site/site-copy";
import { SiteThemeToggle } from "./site-theme-toggle";
import { SiteLangToggle } from "./site-lang-toggle";
import type { Lang } from "@/lib/site/lang";

type Item = { href: string; label: string; hint?: string };
type MenuDef = { label: string; href?: string; items?: Item[] };

const external = (href: string) => href.startsWith("http");

/** Pílula do menu; com itens, abre um painel ao passar o mouse ou focar (sem JS). */
function NavPill({ menu, align = "left" }: { menu: MenuDef; align?: "left" | "right" }) {
  if (!menu.items) {
    return (
      <Link href={menu.href!} className="a-pill">
        {menu.label}
      </Link>
    );
  }
  return (
    <div className="group/menu relative">
      <button type="button" className="a-pill" aria-haspopup="true">
        {menu.label} <ChevronDown className="size-3 opacity-60 transition-transform group-focus-within/menu:rotate-180 group-hover/menu:rotate-180" />
      </button>
      {/* ponte invisível entre a pílula e o painel, para o hover não cair no vão */}
      <div
        className={`invisible absolute top-full z-50 pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-focus-within/menu:visible group-focus-within/menu:opacity-100 group-hover/menu:visible group-hover/menu:opacity-100 ${align === "right" ? "right-0" : "left-0"}`}
      >
        <ul className="grid w-64 gap-0.5 rounded-2xl border bg-popover p-2 shadow-xl">
          {menu.items.map((it) => (
            <li key={it.href + it.label}>
              <Link
                href={it.href}
                {...(external(it.href) ? { target: "_blank", rel: "noreferrer" } : {})}
                className="block rounded-lg px-3 py-2 text-[14px] hover:bg-muted"
              >
                {it.label}
                {it.hint && <span className="block text-[12px] text-muted-foreground">{it.hint}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Cabeçalho do site público, na estrutura da Anthropic: pílulas à esquerda, marca ao centro, ações à direita. */
export async function SiteHeader({ rootId, lang }: { rootId: string; lang: Lang }) {
  const user = await getUser();
  const t = SITE[lang].nav;
  // logado: o menu "Acessar" dá lugar ao botão "Abrir o ArchRay"
  const right = user ? t.right.slice(0, -1) : t.right;
  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className="grid h-[68px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <nav className="hidden min-w-0 items-center gap-1.5 lg:flex" aria-label={lang === "en" ? "Main" : "Principal"}>
          {t.left.map((m) => (
            <NavPill key={m.label} menu={m} />
          ))}
        </nav>
        <Link href="/" aria-label={lang === "en" ? "ArchRay — home" : "ArchRay — início"} className="col-start-1 row-start-1 flex shrink-0 items-center gap-2 justify-self-start lg:col-start-2 lg:justify-self-center">
          <BrandMark className="site-mark h-[24px]" />
          {/* ao rolar, o nome recolhe para trás do polvo (ver .site-wordmark em site.css) */}
          <span className="site-wordmark">
            <BrandLogo className="site-logo h-[15px]" />
          </span>
        </Link>
        <div className="col-start-3 row-start-1 flex items-center justify-end gap-1.5">
          <div className="hidden items-center gap-1.5 lg:flex">
            {right.map((m) => (
              <NavPill key={m.label} menu={m} align="right" />
            ))}
          </div>
          <SiteLangToggle lang={lang} className="hidden sm:flex" />
          <SiteThemeToggle rootId={rootId} />
          {user ? (
            <Link href="/" className="a-btn a-btn-sm">
              {t.open} <ArrowUpRight className="size-3.5" />
            </Link>
          ) : (
            <Link href="/contato" className="a-btn a-btn-sm lg:hidden">
              {lang === "en" ? "Request" : "Solicitar"}
            </Link>
          )}
          <details className="relative lg:hidden">
            <summary className="grid size-[30px] cursor-pointer list-none place-items-center rounded-full bg-[var(--site-pill)] hover:bg-[var(--site-pill-hover)] [&::-webkit-details-marker]:hidden" aria-label={t.menu}>
              <Menu className="size-4" />
            </summary>
            <nav className="absolute top-10 right-0 grid max-h-[80svh] w-72 gap-3 overflow-y-auto rounded-2xl border bg-popover p-3 text-[15px] shadow-2xl">
              {[...t.left, ...t.right].map((m) =>
                m.items ? (
                  <div key={m.label}>
                    <p className="px-2 pb-1 text-[12px] text-muted-foreground">{m.label}</p>
                    {m.items.map((it) => (
                      <Link key={it.href + it.label} href={it.href} className="block rounded-lg px-2 py-1.5 hover:bg-muted">
                        {it.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link key={m.label} href={m.href!} className="rounded-lg px-2 py-1.5 font-medium hover:bg-muted">
                    {m.label}
                  </Link>
                ),
              )}
              <div className="flex items-center justify-between border-t px-2 pt-2.5 text-[13px] text-muted-foreground">
                {t.language}
                <SiteLangToggle lang={lang} />
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
