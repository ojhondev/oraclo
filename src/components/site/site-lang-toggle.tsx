"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { LANGS, SITE_LANG_COOKIE, type Lang } from "@/lib/site/lang";

function saveLang(l: Lang) {
  document.cookie = `${SITE_LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
}

/** Seletor PT | EN do site; guarda a escolha num cookie de 1 ano e recarrega a página. */
export function SiteLangToggle({ lang, className }: { lang: Lang; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function set(l: Lang) {
    if (l === lang) return;
    saveLang(l);
    start(() => router.refresh());
  }
  return (
    <div role="group" aria-label={lang === "en" ? "Language" : "Idioma"} className={cn("flex items-center rounded-full bg-muted p-0.5 text-[12px] font-medium", pending && "opacity-60", className)}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          aria-pressed={l === lang}
          lang={l === "en" ? "en" : "pt-BR"}
          title={l === "en" ? "English" : "Português"}
          className={cn("rounded-full px-2.5 py-1 uppercase transition-colors", l === lang ? "bg-background text-foreground shadow-sm" : "text-foreground/60 hover:text-foreground")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
