"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type TechCard = { id: string; status: string; name: string; summary: string; illo: React.ReactNode; detail: React.ReactNode };

const AUTO_MS = 3800;

/**
 * Cartões que passam sozinhos na horizontal. Ao passar o mouse ou tocar, o cartão se expande com a
 * explicação técnica; o clique mantém aberto. Links como /tecnologia#deteccao abrem o cartão certo.
 */
export function TechCarousel({ cards, moreLabel, closeLabel }: { cards: TechCard[]; moreLabel: string; closeLabel: string }) {
  const rail = useRef<HTMLUListElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const open = pinned ?? hovered;

  const step = useCallback((dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector("li");
    const delta = (card?.clientWidth ?? 320) + 16;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: delta * dir, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (paused || open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => step(1), AUTO_MS);
    return () => clearInterval(id);
  }, [open, paused, step]);

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (!cards.some((c) => c.id === id)) return;
      setPinned(id);
      requestAnimationFrame(() => {
        rail.current?.closest("section")?.scrollIntoView();
        const li = document.getElementById(id);
        if (li && rail.current) rail.current.scrollTo({ left: li.offsetLeft - rail.current.offsetLeft });
      });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [cards]);

  return (
    <div onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onFocus={() => setPaused(true)}>
      <div className="mb-4 flex justify-end gap-2">
        {([[-1, ArrowLeft], [1, ArrowRight]] as const).map(([dir, Icon]) => (
          <button key={dir} onClick={() => step(dir)} aria-label={dir === 1 ? "Próximo" : "Anterior"} className="a-pill grid size-10 place-items-center !p-0">
            <Icon className="size-4" />
          </button>
        ))}
      </div>
      <ul ref={rail} className="no-scrollbar relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8">
        {cards.map((c, i) => {
          const isOpen = open === c.id;
          return (
            <li
              key={c.id}
              id={c.id}
              onMouseEnter={() => setHovered(c.id)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "a-card flex h-[580px] shrink-0 snap-start scroll-mt-24 flex-col overflow-hidden transition-[width] duration-300",
                isOpen ? "w-[min(88vw,680px)]" : "w-[min(78vw,320px)]",
              )}
            >
              <button
                onClick={() => setPinned(pinned === c.id ? null : c.id)}
                aria-expanded={isOpen}
                className="flex w-full shrink-0 flex-col text-left"
              >
                {!isOpen && <div className="aspect-square w-full overflow-hidden">{c.illo}</div>}
                <div className="p-5">
                  <p className="a-label">
                    0{i + 1} · {c.status}
                  </p>
                  <h3 className="a-title mt-2 text-[21px] leading-snug">{c.name}</h3>
                </div>
              </button>
              {isOpen ? (
                <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
                  <p className="text-[15px] leading-6">{c.summary}</p>
                  {c.detail}
                  {pinned === c.id && (
                    <button onClick={() => setPinned(null)} className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-medium hover:underline">
                      <X className="size-4" /> {closeLabel}
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-auto flex items-end gap-3 px-5 pb-5">
                  <p className="min-w-0 flex-1 text-[14px] leading-6 text-muted-foreground">{c.summary}</p>
                  <span className="sr-only">{moreLabel}</span>
                  <Plus className="mb-1 size-5 shrink-0" />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
