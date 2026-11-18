"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import { DAMAGE_OVERLAY, type OverlayItem } from "./damage-overlay-data";

type Props = {
  /** 0 → 1: cada dano se desenha na sua vez (traço, hachura e etiqueta). */
  progress: MotionValue<number>;
  className?: string;
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Mapa de danos desenhado por cima do vídeo da primeira dobra, no lugar das curvas de nível.
 * Usa as siglas e cores da biblioteca de danos do ArchRay (src/lib/damage-library.ts): áreas com
 * hachura que corre devagar, fissuras que se traçam e etiquetas com sigla e nome. Desenho imperativo
 * (sem re-render) para ficar fluido na rolagem.
 */
export function DamageOverlay({ progress, className }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const items = DAMAGE_OVERLAY;
  const N = items.length;

  const draw = (p: number) => {
    const box = root.current;
    if (!box) return;
    items.forEach((_, i) => {
      // janelas escalonadas: cada dano começa um pouco depois do anterior
      const a = (i / N) * 0.55;
      const f = clamp((p - a) / 0.32);
      const tag = clamp((p - a - 0.22) / 0.18);
      box.querySelectorAll<HTMLElement | SVGElement>(`[data-d="${i}"]`).forEach((el) => {
        const role = el.dataset.role;
        if (role === "stroke") {
          el.style.strokeDashoffset = String(1 - f);
          el.style.opacity = f > 0.001 ? "1" : "0";
        }
        else if (role === "fill") el.style.opacity = String(f * 0.9);
        else if (role === "tag") {
          el.style.opacity = String(tag);
          el.style.transform = `translateY(${(1 - tag) * 8}px)`;
        }
      });
    });
  };

  useMotionValueEvent(progress, "change", draw);
  useEffect(() => draw(progress.get()));

  const patterns = useMemo(() => Array.from(new Set(items.map((it) => it.pattern))), [items]);

  return (
    <div ref={root} className={className} aria-hidden>
      {/* manchas, fissuras e linhas de chamada: esticam junto com o cartão (traço sem escala) */}
      <svg viewBox="0 0 1000 500" preserveAspectRatio="none" className="absolute inset-0 size-full" fill="none">
        <defs>
          {patterns.map((p) => (
            <Pattern key={p} kind={p} />
          ))}
        </defs>
        {items.map((it, i) => (
          <Item key={it.code} it={it} i={i} />
        ))}
      </svg>
      {/* etiquetas: HTML em %, sempre legíveis; no celular só a sigla */}
      {items.map((it, i) => (
        <span
          key={it.code}
          data-d={i}
          data-role="tag"
          style={{ left: `${it.tag[0] / 10}%`, top: `${it.tag[1] / 5}%`, opacity: 0 }}
          className="absolute flex items-center gap-1.5 rounded-[5px] border border-white/35 bg-black/65 px-1.5 py-[3px] font-mono text-[10px] leading-none tracking-[0.04em] whitespace-nowrap text-white backdrop-blur-[2px] md:px-2 md:py-1 md:text-[11.5px]"
        >
          <span className="size-[7px] shrink-0 rounded-full" style={{ background: it.color }} />
          <b className="font-semibold">{it.code}</b>
          <span className="hidden text-white/80 md:inline">· {it.name}</span>
        </span>
      ))}
    </div>
  );
}

/** Hachuras da legenda (mesmos nomes de padrão da biblioteca), em branco, deslizando devagar. */
function Pattern({ kind }: { kind: OverlayItem["pattern"] }) {
  const id = `dmg-${kind}`;
  const flow = <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="14 0" dur="6s" repeatCount="indefinite" additive="sum" />;
  if (kind === "diagonal")
    return (
      <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="10" stroke="white" strokeWidth="1.1" strokeOpacity="0.75" />
        {flow}
      </pattern>
    );
  if (kind === "circulos")
    return (
      <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="8" cy="8" r="4" stroke="white" strokeWidth="0.9" strokeOpacity="0.8" fill="none" />
        {flow}
      </pattern>
    );
  if (kind === "pontilhado" || kind === "pontilhado-denso") {
    const s = kind === "pontilhado" ? 9 : 5;
    return (
      <pattern id={id} width={s} height={s} patternUnits="userSpaceOnUse">
        <circle cx={s / 2} cy={s / 2} r="1.1" fill="white" fillOpacity="0.85" />
        {flow}
      </pattern>
    );
  }
  if (kind === "cruzado")
    return (
      <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path d="M0 0V12M0 0H12" stroke="white" strokeWidth="0.9" strokeOpacity="0.7" />
        {flow}
      </pattern>
    );
  // sólido: véu branco leve
  return (
    <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill="white" fillOpacity="0.22" />
    </pattern>
  );
}

function Item({ it, i }: { it: OverlayItem; i: number }) {
  const [tx, ty] = it.tag;
  return (
    <g>
      {it.kind === "area" && (
        <>
          <path data-d={i} data-role="fill" d={it.d} fill={`url(#dmg-${it.pattern})`} style={{ opacity: 0 }} />
          <path data-d={i} data-role="stroke" d={it.d} stroke="white" strokeWidth="0.9" pathLength={1} strokeDasharray="1 1" style={{ strokeDashoffset: 1, opacity: 0 }} />
        </>
      )}
      {it.kind === "linha" &&
        it.lines!.map((d, k) => (
          <path key={k} data-d={i} data-role="stroke" d={d} stroke="white" strokeWidth={k === 0 ? 1.3 : 0.8} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" style={{ strokeDashoffset: 1, opacity: 0 }} />
        ))}
      {/* linha de chamada até a etiqueta */}
      <g data-d={i} data-role="tag" style={{ opacity: 0 }}>
        <path d={`M${it.anchor[0]} ${it.anchor[1]} L${tx + 6} ${ty + 11}`} stroke="white" strokeWidth="1" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
        <circle cx={it.anchor[0]} cy={it.anchor[1]} r="3" fill="white" />
      </g>
    </g>
  );
}
