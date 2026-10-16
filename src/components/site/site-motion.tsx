"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Movimento do site sem bibliotecas: revela [data-reveal] ao entrar na tela (IntersectionObserver)
 * e aplica paralaxe em [data-parallax="velocidade"]. Com "reduzir movimento" do sistema, só fades (sem paralaxe).
 */
export function SiteMotion({ rootId }: { rootId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    // com "reduzir movimento" ainda há fades (o CSS tira deslocamentos e zoom); só a paralaxe é desligada
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const items = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    // o que já está visível na primeira pintura aparece logo, sem "piscar"
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    for (const el of items) {
      const d = el.dataset.revealDelay;
      if (d) el.style.setProperty("--reveal-delay", `${d}ms`);
      io.observe(el);
    }
    root.classList.add("motion-ready");
    // reforço do IntersectionObserver (que pode não disparar em abas ocultas ou sem pintura):
    // revela pela posição, após carregar e ao rolar
    const sweep = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (!vh) return;
      for (const el of items) {
        if (el.classList.contains("is-in")) continue;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.94 && r.bottom > 0) {
          el.classList.add("is-in");
          io.unobserve(el);
        }
      }
    };
    let sweepTimer = 0;
    const onSweep = () => {
      if (!sweepTimer) sweepTimer = window.setTimeout(() => ((sweepTimer = 0), sweep()), 120);
    };
    const firstSweep = window.setTimeout(sweep, 400);
    window.addEventListener("scroll", onSweep, { passive: true });
    window.addEventListener("resize", onSweep);

    const layers = reduce ? [] : [...root.querySelectorAll<HTMLElement>("[data-parallax]")];
    // zoom ligado à rolagem (como a Sana): a imagem cresce de "de" até "até" enquanto entra na tela.
    // Com "reduzir movimento", a amplitude cai para 40%.
    const zooms = [...root.querySelectorAll<HTMLElement>("[data-zoom]")].map((el) => {
      const [a, b] = (el.dataset.zoom || "0.85,1.05").split(",").map(Number) as [number, number];
      const k = reduce ? 0.4 : 1;
      return { el, from: 1 - (1 - a) * k, to: 1 - (1 - b) * k };
    });
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const z of zooms) {
        const r = z.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.9)));
        const e = 1 - (1 - p) ** 2; // desacelera no fim
        z.el.style.setProperty("--zoom", (z.from + (z.to - z.from) * e).toFixed(4));
      }
      for (const el of layers) {
        const r = (el.parentElement ?? el).getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) continue;
        const speed = Number(el.dataset.parallax) || 0.12;
        const offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.setProperty("--py", `${offset.toFixed(1)}px`);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    if (layers.length || zooms.length) {
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }
    return () => {
      io.disconnect();
      clearTimeout(firstSweep);
      clearTimeout(sweepTimer);
      window.removeEventListener("scroll", onSweep);
      window.removeEventListener("resize", onSweep);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname, rootId]);

  return null;
}
