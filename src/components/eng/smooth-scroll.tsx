"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Rolagem suave do site público (como no Scale). As animações ligadas à rolagem leem a posição
 * nativa da página, que o Lenis continua atualizando. Respeita "reduzir movimento".
 */
export function SmoothScroll() {
  // cabeçalho escuro sobre seções escuras: confere o que está logo abaixo dele
  useEffect(() => {
    const root = document.getElementById("archray-site");
    if (!root) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const header = root.querySelector<HTMLElement>(".site-header");
      header?.style.setProperty("pointer-events", "none");
      const el = document.elementFromPoint(window.innerWidth / 2, 74);
      header?.style.removeProperty("pointer-events");
      root.toggleAttribute("data-nav-dark", !!el?.closest(".eng-dark"));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // âncoras internas (#secao) rolam suavemente
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href^='#']") as HTMLAnchorElement | null;
      if (!a || a.getAttribute("href") === "#") return;
      const el = document.querySelector(a.getAttribute("href")!);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -72 });
    };
    document.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, []);
  return null;
}
