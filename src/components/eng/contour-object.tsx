"use client";

import { useEffect, useMemo, useRef } from "react";
import { animate, useInView, useMotionValue, useMotionValueEvent, type MotionValue } from "motion/react";
import { objectHeight, objectSlices, ringPath, type ObjectName, type View } from "./contour";

type Props = {
  /** Objetos na ordem em que aparecem conforme o progresso avança. */
  names: ObjectName[];
  /** Progresso de 0 a 1 (rolagem). Sem ele, o objeto se desenha sozinho ao entrar na tela. */
  progress?: MotionValue<number>;
  className?: string;
  stroke?: string;
  /** Giro extra ao longo do progresso (radianos). */
  spin?: number;
  yaw?: number;
};

const W = 400;
const H = 400;

/**
 * Objeto em curvas de nível animado. Cada objeto ocupa uma faixa do progresso: entra traçando as
 * fatias de baixo para cima, gira de leve e sai apagando de cima para baixo. O desenho é atualizado
 * direto no SVG (sem re-render do React), para ficar fluido.
 */
export function ContourObject({ names, progress, className, stroke = "currentColor", spin = 0.7, yaw = 0.55 }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const own = useMotionValue(0);
  const inView = useInView(svg, { once: true, margin: "-15% 0px" });
  const value = progress ?? own;

  // desenho próprio quando não há progresso externo
  useEffect(() => {
    if (progress || !inView) return;
    const c = animate(own, 0.5, { duration: 2.6, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [progress, inView, own]);

  const objects = useMemo(
    () =>
      names.map((name) => {
        const h = objectHeight(name);
        const slices = objectSlices(name);
        const scale = 230 / Math.max(2.2, h);
        return { name, slices, h, view: { yaw, pitch: 0.42, scale, cx: W / 2, cy: H / 2 + (h * scale) / 2 - 10 } as View };
      }),
    [names, yaw],
  );

  const draw = (p: number) => {
    const root = svg.current;
    if (!root) return;
    const n = objects.length;
    objects.forEach((o, oi) => {
      const g = root.querySelector<SVGGElement>(`[data-obj="${oi}"]`);
      if (!g) return;
      // faixa deste objeto no progresso: [oi/n, (oi+1)/n]; dentro dela, entra (0→0.5) e sai (0.5→1)
      const local = Math.min(1, Math.max(0, p * n - oi));
      const last = oi === n - 1;
      // entra traçando (0→0,3), fica (0,3→0,7) e sai apagando de cima (0,7→1); o último não sai
      let reveal: number;
      let fromTop = false;
      if (!progress) reveal = Math.min(1, p / 0.5);
      else if (local < 0.3) reveal = local / 0.3;
      else if (local < 0.7 || last) reveal = 1;
      else {
        reveal = 1 - (local - 0.7) / 0.3;
        fromTop = true;
      }
      reveal = Math.min(1, Math.max(0, reveal));
      g.style.display = reveal <= 0.001 ? "none" : "";
      if (reveal <= 0.001) return;
      const view = { ...o.view, yaw: o.view.yaw + (local - 0.5) * spin };
      const paths = g.children;
      const S = o.slices.length;
      let k = 0;
      o.slices.forEach((s, si) => {
        // fração desta fatia já traçada
        const order = fromTop ? S - 1 - si : si;
        const f = Math.min(1, Math.max(0, reveal * (S + 6) - order) / 6);
        for (const ring of s.rings) {
          const el = paths[k++] as SVGPathElement | undefined;
          if (!el) continue;
          if (f <= 0) {
            el.style.opacity = "0";
            continue;
          }
          el.setAttribute("d", ringPath(ring, s.z, view));
          el.style.opacity = String(0.35 + 0.65 * (si / S));
          el.style.strokeDashoffset = String(1 - f);
        }
      });
    });
  };

  useMotionValueEvent(value, "change", draw);
  useEffect(() => {
    draw(value.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objects]);

  return (
    <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className={className} fill="none" stroke={stroke} strokeWidth={1} aria-hidden>
      {objects.map((o, oi) => (
        <g key={o.name + oi} data-obj={oi} style={{ display: "none" }}>
          {o.slices.flatMap((s, si) => s.rings.map((_, ri) => <path key={`${si}-${ri}`} pathLength={1} strokeDasharray="1 1" style={{ opacity: 0 }} vectorEffect="non-scaling-stroke" />))}
        </g>
      ))}
    </svg>
  );
}
