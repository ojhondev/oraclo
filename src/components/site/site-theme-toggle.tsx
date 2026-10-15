"use client";

import { Moon, Sun } from "lucide-react";

import { SITE_THEME_COOKIE } from "@/lib/site/theme";

/** Alterna o site entre escuro (padrão) e claro; guarda a escolha num cookie de 1 ano. */
export function SiteThemeToggle({ rootId }: { rootId: string }) {
  function toggle() {
    const root = document.getElementById(rootId);
    if (!root) return;
    const light = root.classList.toggle("site-light");
    document.cookie = `${SITE_THEME_COOKIE}=${light ? "claro" : "escuro"}; path=/; max-age=31536000; samesite=lax`;
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      title="Alternar tema"
      className="grid size-9 place-items-center rounded-full text-foreground/75 hover:bg-muted hover:text-foreground"
    >
      <Moon className="size-[17px] [.site-light_&]:hidden" />
      <Sun className="hidden size-[17px] [.site-light_&]:block" />
    </button>
  );
}
