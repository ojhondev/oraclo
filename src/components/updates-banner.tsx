"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";

const KEY = "archray:atualizacao-vista";

/**
 * Faixa discreta com a novidade mais recente da plataforma. Some ao fechar (lembrado neste
 * aparelho, por post) e não aparece no editor de danos, que precisa da tela livre.
 */
export function UpdatesBanner({ slug, text }: { slug: string; text: string }) {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    let seen: string | null = null;
    try {
      seen = localStorage.getItem(KEY);
    } catch {
      // armazenamento bloqueado: mostra mesmo assim
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o navegador só depois de montar
    setShow(seen !== slug);
  }, [slug]);

  if (!show || /\/ortofotos\/(?!nova)[^/]+$/.test(pathname)) return null;

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(KEY, slug);
    } catch {
      // sem armazenamento: volta a aparecer na próxima visita
    }
  }

  return (
    <div className="flex items-center gap-3 border-b bg-muted/60 px-4 py-2 text-[13.5px] sm:px-6">
      <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[11.5px] font-medium text-background">Atualizações</span>
      <Link href={`/index/${slug}`} onClick={dismiss} className="group flex min-w-0 items-center gap-1.5 hover:underline hover:underline-offset-4">
        <span className="truncate">{text}</span>
        <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <button onClick={dismiss} aria-label="Fechar aviso de atualizações" className="ml-auto grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  );
}
