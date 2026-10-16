"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** Sumário fixo à esquerda; destaca a seção que está na tela. */
export function Toc({ items, label = "Nesta página" }: { items: { id: string; title: string }[]; label?: string }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav aria-label={label} className="hidden lg:block">
      <ul className="sticky top-24 grid gap-2.5 text-[14px] leading-5">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className={cn("block transition-colors hover:text-foreground", active === i.id ? "text-foreground" : "text-muted-foreground")}
            >
              {i.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ShareButton({ title, lang = "pt" }: { title: string; lang?: "pt" | "en" }) {
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(lang === "en" ? "Link copied." : "Link copiado.");
      }
    } catch {
      // compartilhamento cancelado
    }
  }
  return (
    <button onClick={share} className="inline-flex items-center gap-1.5 hover:opacity-70">
      <Link2 className="size-4" /> {lang === "en" ? "Share" : "Compartilhar"}
    </button>
  );
}
