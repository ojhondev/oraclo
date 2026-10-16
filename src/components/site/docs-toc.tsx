"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Sumário fixo da Documentação: etapas numeradas, com a etapa visível destacada. */
export function DocsToc({ items }: { items: { id: string; title: string; n?: number }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav aria-label="Etapas" className="hidden lg:block">
      <ol className="sticky top-24 grid gap-0.5 text-[13.5px] leading-5">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className={cn(
                "grid grid-cols-[22px_1fr] rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary",
                active === i.id ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="tabular-nums">{i.n ?? ""}</span>
              <span>{i.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
