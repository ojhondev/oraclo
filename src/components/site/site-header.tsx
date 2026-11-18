import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { BrandLogo, BrandMark } from "@/components/brand";
import { SITE } from "@/lib/site/site-copy";
import { SiteThemeToggle } from "./site-theme-toggle";
import { WHATSAPP_LABEL, whatsappUrl } from "@/lib/site/whatsapp";
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
        <ul className="grid w-64 gap-0.5 rounded-[12px] border bg-popover p-2 text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.06),0_8px_24px_rgb(0_0_0/0.08)]">
          {menu.items.map((it) => (
            <li key={it.href + it.label}>
              <Link
                href={it.href}
                {...(external(it.href) ? { target: "_blank", rel: "noreferrer" } : {})}
                className="block rounded-[8px] px-3 py-2 text-[14px] hover:bg-muted"
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

/**
 * Cabeçalho do site público (v2, no padrão do Scale): marca à esquerda, menu em links simples,
 * login contornado e ação principal preta à direita. Sobre a primeira dobra escura da home fica
 * transparente com texto branco, e ganha fundo branco ao rolar (ver .site-header em site.css).
 */
export function SiteHeader({ rootId, lang }: { rootId: string; lang: Lang }) {
  const t = SITE[lang].nav;
  const menus = [...t.left, ...t.right.filter((m) => m.label !== "Acessar" && m.label !== "Access")];
  return (
    <header className="site-header sticky top-0 z-40 border-b border-transparent bg-background transition-[background-color,border-color,color] duration-300">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <Link href="/" aria-label={lang === "en" ? "ArchRay — home" : "ArchRay — início"} className="flex shrink-0 items-center gap-2">
          <BrandMark className="site-mark h-[28px]" />
          <BrandLogo className="site-logo h-[14px]" />
        </Link>
        <nav className="hidden min-w-0 items-center gap-1 lg:flex" aria-label={lang === "en" ? "Main" : "Principal"}>
          {menus.map((m) => (
            <NavPill key={m.label} menu={m} />
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <SiteThemeToggle rootId={rootId} />
          {/* sem consultar a sessão (página estática): quem já está logado é levado ao app pelo /login */}
          <>
              <Link href="/login" className="site-login hidden h-[38px] items-center rounded-[8px] px-4 text-[15px] text-(--eng-mute) shadow-[inset_0_0_0_1px_var(--eng-line2)] transition-colors hover:text-foreground sm:inline-flex">
                {lang === "en" ? "Log in" : "Entrar"}
              </Link>
              <a href={whatsappUrl(lang)} target="_blank" rel="noreferrer" className="a-btn a-btn-sm">
                <span className="sm:hidden">WhatsApp</span>
                <span className="hidden sm:inline">{WHATSAPP_LABEL[lang]}</span>
              </a>
          </>
          <details className="relative lg:hidden">
            <summary className="grid size-[38px] cursor-pointer list-none place-items-center rounded-[8px] shadow-[inset_0_0_0_1px_var(--eng-line2)] [&::-webkit-details-marker]:hidden" aria-label={t.menu}>
              <Menu className="size-4" />
            </summary>
            <nav className="absolute top-12 right-0 grid max-h-[80svh] w-72 gap-3 overflow-y-auto rounded-[16px] border bg-popover p-3 text-[15px] text-foreground shadow-2xl">
              {[...t.left, ...t.right].map((m) =>
                m.items ? (
                  <div key={m.label}>
                    <p className="px-2 pb-1 font-mono text-[11px] tracking-[0.05em] text-muted-foreground uppercase">{m.label}</p>
                    {m.items.map((it) => (
                      <Link key={it.href + it.label} href={it.href} className="block rounded-[8px] px-2 py-1.5 hover:bg-muted">
                        {it.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link key={m.label} href={m.href!} className="rounded-[8px] px-2 py-1.5 hover:bg-muted">
                    {m.label}
                  </Link>
                ),
              )}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
