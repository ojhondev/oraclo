"use client";

import { Moon, Sun } from "lucide-react";

import { SITE_THEME_COOKIE } from "@/lib/site/theme";

/** Alterna o site entre claro (padrão) e escuro; guarda a escolha num cookie de 1 ano. */
export function SiteThemeToggle({ rootId }: { rootId: string }) {
  function toggle() {
    const root = document.getElementById(rootId);
    if (!root) return;
    const dark = root.classList.toggle("site-dark");
    document.cookie = `${SITE_THEME_COOKIE}=${dark ? "escuro" : "claro"}; path=/; max-age=31536000; samesite=lax`;
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      title="Alternar tema"
      className="grid size-[30px] place-items-center rounded-full bg-[var(--site-pill)] text-foreground/75 hover:bg-[var(--site-pill-hover)] hover:text-foreground"
    >
      <Moon className="size-[15px] [.site-dark_&]:hidden" />
      <Sun className="hidden size-[15px] [.site-dark_&]:block" />
    </button>
  );
}
