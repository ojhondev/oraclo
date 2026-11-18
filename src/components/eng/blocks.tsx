"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContourObject } from "./contour-object";
import { Rise } from "./motion";
import { externalProps } from "@/lib/site/whatsapp";
import type { ObjectName } from "./contour";

/**
 * Blocos do site v2 (engenharia): topo escuro com objeto em curvas de nível, etapas presas na tela,
 * frase em painel que acende palavra a palavra, cabeçalho de seção, faixas e chamada final.
 * As páginas montam esses blocos e mantêm o próprio conteúdo.
 */

const ease = [0.16, 1, 0.3, 1] as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export type Cta = { href: string; label: string };

/* ─────────────────────────── topo escuro ─────────────────────────── */

export function EngPageHero({
  eyebrow,
  title,
  text,
  ctas = [],
  object,
  video,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  text?: ReactNode;
  ctas?: Cta[];
  object?: ObjectName;
  /** Trecho de vídeo de fundo (public/site/video/clip-*.mp4), opcional. */
  video?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const lift = useTransform(scrollYProgress, (v) => -90 * v);
  const fade = useTransform(scrollYProgress, (v) => 1 - clamp01(v / 0.7));
  const objY = useTransform(scrollYProgress, (v) => 60 * v);
  return (
    <section ref={ref} className="eng-hero eng-dark relative -mt-[68px] overflow-hidden bg-black text-white">
      {video && (
        <video className="absolute inset-0 size-full object-cover opacity-30" autoPlay muted loop playsInline preload="none" poster={`/site/video/clip-${video}.jpg`} src={`/site/video/clip-${video}.mp4`} aria-hidden />
      )}
      {video && <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />}
      <div className="relative grid min-h-[min(92svh,860px)] items-center gap-10 px-4 pt-[132px] pb-20 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:px-8">
        <motion.div style={{ y: lift, opacity: fade }}>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease }} className="eng-eyebrow text-white/60">
            {eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.08, ease }}
            className="mt-6 max-w-[17ch] text-[clamp(40px,5.6vw,84px)] leading-[1.02] tracking-[-0.03em]"
          >
            {title}
          </motion.h1>
          {text && (
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.2, ease }} className="mt-6 max-w-[56ch] text-[17px] leading-[1.55] text-white/70 sm:text-[19px]">
              {text}
            </motion.p>
          )}
          {ctas.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.32, ease }} className="mt-9 flex flex-wrap gap-3">
              {ctas.map((c, i) =>
                i === 0 ? (
                  <Link key={c.href} href={c.href} {...externalProps(c.href)} className="a-btn">
                    {c.label}
                  </Link>
                ) : (
                  <Link key={c.href} href={c.href} {...externalProps(c.href)} className="inline-flex h-12 items-center rounded-[8px] px-[18px] text-[16px] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.4)] transition-colors hover:bg-white/10">
                    {c.label}
                  </Link>
                ),
              )}
            </motion.div>
          )}
          {children}
        </motion.div>
        {object && (
          <motion.div style={{ y: objY }} className="hidden justify-self-center lg:block">
            <ContourObject names={[object]} className="h-[min(56svh,520px)] w-auto text-white" />
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────── cabeçalho de seção ─────────────────────────── */

export function EngHead({ eyebrow, title, text, className, dark }: { eyebrow?: string; title: ReactNode; text?: ReactNode; className?: string; dark?: boolean }) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-end lg:gap-16", className)}>
      <div>
        {eyebrow && (
          <p className={cn("eng-eyebrow", dark && "text-white/55")} data-reveal>
            {eyebrow}
          </p>
        )}
        <h2 className="mt-4 max-w-[20ch] text-[clamp(30px,3.8vw,56px)] leading-[1.06] tracking-[-0.025em]" data-reveal data-reveal-delay={60}>
          {title}
        </h2>
      </div>
      {text && (
        <p className={cn("max-w-[60ch] text-[17px] leading-[1.55] sm:text-[19px]", dark ? "text-white/65" : "text-(--eng-mute)")} data-reveal data-reveal-delay={120}>
          {text}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────── faixas ─────────────────────────── */

const TONE = {
  white: "bg-(--eng-0) text-(--eng-ink)",
  mist: "bg-(--eng-1) text-(--eng-ink)",
  stone: "bg-(--eng-2) text-(--eng-ink)",
  dark: "eng-dark site-ink bg-black text-white",
};

export function EngBand({ tone = "white", id, className, children }: { tone?: keyof typeof TONE; id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32 lg:px-8", TONE[tone], className)}>
      <Rise amount={110}>{children}</Rise>
    </section>
  );
}

/* ─────────────────────────── etapas presas na tela ─────────────────────────── */

export type Step = { eyebrow: string; title: string; text: string; bullets?: string[]; cta?: Cta; object: ObjectName; id?: string };

function StepText({ s, i, n, progress }: { s: Step; i: number; n: number; progress: MotionValue<number> }) {
  const vis = (v: number) => {
    const a = i / n;
    const b = (i + 1) / n;
    const w = Math.min(0.06, 0.4 / n);
    const fadeIn = i === 0 ? 1 : clamp01((v - a - 0.01) / w);
    const fadeOut = i === n - 1 ? 1 : clamp01((b - 0.01 - v) / w);
    return { o: Math.min(fadeIn, fadeOut), dir: fadeIn < 1 ? 1 : fadeOut < 1 ? -1 : 0 };
  };
  const opacity = useTransform(progress, (v) => vis(v).o);
  const y = useTransform(progress, (v) => {
    const { o, dir } = vis(v);
    return dir * (1 - o) * 24;
  });
  const pointer = useTransform(progress, (v) => (vis(v).o > 0.5 ? "auto" : "none"));
  return (
    <motion.div style={{ opacity, y, pointerEvents: pointer }} className="absolute inset-0">
      {s.id && <span id={s.id} className="absolute -top-[40vh]" aria-hidden />}
      <p className="eng-eyebrow text-white/55">{s.eyebrow}</p>
      <h3 className="mt-5 max-w-[20ch] text-[clamp(28px,3.2vw,46px)] leading-[1.1] tracking-[-0.02em]">{s.title}</h3>
      <p className="mt-4 max-w-[52ch] text-[16px] leading-[1.6] text-white/65 sm:text-[17px]">{s.text}</p>
      {s.bullets && (
        <ul className="mt-6 grid max-w-[56ch] gap-2.5 border-t border-white/15 pt-5 text-[14.5px] leading-[1.55] text-white/75">
          {s.bullets.map((b) => (
            <li key={b} className="flex gap-3">
              <span className="mt-[8px] size-1.5 shrink-0 rounded-[1px] bg-white/60" />
              {b}
            </li>
          ))}
        </ul>
      )}
      {s.cta && (
        <Link href={s.cta.href} className="mt-7 inline-flex h-10 items-center gap-2 rounded-[8px] px-4 text-[15px] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.35)] hover:bg-white/10">
          {s.cta.label} <ArrowRight className="size-4" />
        </Link>
      )}
    </motion.div>
  );
}

/** Seção preta presa na tela: o objeto em curvas de nível se transforma a cada etapa e o texto troca. */
export function EngPinnedSteps({ steps, eyebrow, title, id }: { steps: Step[]; eyebrow?: string; title?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const n = steps.length;
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(n - 1, Math.floor(v * n))));
  const bar = useTransform(scrollYProgress, (v) => `${clamp01(v) * 100}%`);
  return (
    <section ref={ref} id={id} className="eng-dark site-ink relative bg-black text-white" style={{ height: `${n * 90 + 60}vh` }}>
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden px-4 pt-16 sm:px-6 lg:px-8">
        {(eyebrow || title) && (
          <div className="absolute top-[88px] left-4 sm:left-6 lg:left-8">
            {eyebrow && <p className="eng-eyebrow text-white/45">{eyebrow}</p>}
            {title && <p className="mt-2 text-[15px] text-white/70">{title}</p>}
          </div>
        )}
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <ContourObject names={steps.map((s) => s.object)} progress={scrollYProgress} className="mx-auto h-[30svh] w-auto max-w-[80vw] text-white lg:h-[58svh]" />
          <div className="relative h-[420px] sm:h-[400px]">
            {steps.map((s, i) => (
              <StepText key={s.eyebrow} s={s} i={i} n={n} progress={scrollYProgress} />
            ))}
          </div>
        </div>
        <div className="relative mt-4 sm:absolute sm:right-6 sm:bottom-8 sm:left-6 sm:mt-0 lg:right-8 lg:left-8">
          <div className="grid gap-3 font-mono text-[11px] tracking-[0.05em] text-white/40 uppercase" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {steps.map((s, i) => (
              <span key={s.eyebrow} className={cn("truncate", i === active && "text-white")}>
                {String(i + 1).padStart(2, "0")}
                <span className="hidden md:inline"> · {s.eyebrow.replace(/^\d+\s*·\s*/, "")}</span>
              </span>
            ))}
          </div>
          <div className="mt-2 h-px bg-white/15">
            <motion.div style={{ width: bar }} className="h-px bg-white" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── frase em painel ─────────────────────────── */

function Word({ w, i, n, progress }: { w: string; i: number; n: number; progress: MotionValue<number> }) {
  const start = 0.32 + (i / n) * 0.5;
  const opacity = useTransform(progress, (v) => 0.16 + 0.84 * clamp01((v - start) / 0.04));
  return <motion.span style={{ opacity }}>{w} </motion.span>;
}

/** Painel escuro que cresce até a largura toda; a frase acende palavra a palavra com a rolagem. */
export function EngStatement({ text, color = "#1e1c28", video, object = "catedral" }: { text: string; color?: string; video?: string; object?: ObjectName }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const k = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
  const inset = useTransform(scrollYProgress, (v) => `${24 * (1 - k(v, 0.2, 0.55))}%`);
  const radius = useTransform(scrollYProgress, (v) => 24 * (1 - k(v, 0.2, 0.55)));
  const tileY = useTransform(scrollYProgress, (v) => 160 - 900 * k(v, 0, 0.38));
  const build = useTransform(scrollYProgress, (v) => 0.3 * k(v, 0.22, 0.92));
  const words = text.split(" ");
  return (
    <section ref={ref} className="eng-dark relative bg-black" style={{ height: "230vh" }}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <motion.div style={{ left: inset, borderRadius: radius, background: color }} className="absolute inset-y-[10svh] right-0">
          <p className="absolute top-[12%] right-[6%] left-[6%] max-w-[24ch] text-[clamp(26px,3.6vw,56px)] leading-[1.12] tracking-[-0.02em] text-white">
            {words.map((w, i) => (
              <Word key={i} w={w} i={i} n={words.length} progress={scrollYProgress} />
            ))}
          </p>
          <div className="absolute right-[2%] bottom-[2%] h-[44%] w-[80%] sm:h-[62%] sm:w-[60%] lg:right-[3%] lg:bottom-[4%] lg:h-[86%] lg:w-[46%]">
            <ContourObject names={[object]} progress={build} spin={1.1} yaw={0.4} className="size-full text-white/85" />
          </div>
        </motion.div>
        {video && (
          <motion.div style={{ y: tileY }} className="absolute top-[24%] left-4 hidden w-[19vw] max-w-[300px] overflow-hidden rounded-[16px] md:block">
            <video className="aspect-[4/5] w-full object-cover" autoPlay muted loop playsInline preload="none" poster={`/site/video/clip-${video}.jpg`} src={`/site/video/clip-${video}.mp4`} aria-hidden />
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────── cartões ─────────────────────────── */

export function EngCards({ items, cols = 3, tone = "white" }: { items: { icon?: ReactNode; eyebrow?: string; title: string; text: string; href?: string; more?: string }[]; cols?: 2 | 3 | 4; tone?: "white" | "mist" }) {
  const grid = { 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[cols];
  return (
    <div className={cn("grid gap-4", grid)}>
      {items.map((it, i) => {
        const body = (
          <>
            {it.icon && <span className="grid size-11 place-items-center rounded-[8px] bg-(--eng-3)">{it.icon}</span>}
            {it.eyebrow && <p className="eng-eyebrow">{it.eyebrow}</p>}
            <h3 className="mt-auto pt-12 text-[22px] leading-[1.2] tracking-[-0.01em]">{it.title}</h3>
            <p className="mt-3 text-[15px] leading-[1.55] text-(--eng-mute)">{it.text}</p>
            {it.href && (
              <span className="mt-6 flex items-center gap-1.5 font-mono text-[11px] tracking-[0.05em] uppercase">
                {it.more ?? "Saiba mais"} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </>
        );
        const cls = cn("group flex min-h-[300px] flex-col rounded-[16px] p-8 transition-colors", tone === "white" ? "bg-(--eng-0)" : "bg-(--eng-1)", it.href && (tone === "white" ? "hover:bg-(--eng-h)" : "hover:bg-(--eng-2)"));
        return (
          <motion.div key={it.title} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.9, delay: (i % cols) * 0.08, ease }}>
            {it.href ? (
              <Link href={it.href} className={cls}>
                {body}
              </Link>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── chamada final ─────────────────────────── */

export function EngCta({ title, text, cta, object = "igreja" }: { title: string; text?: string; cta: Cta; object?: ObjectName }) {
  return (
    <section className="eng-light grid items-center gap-10 bg-[#a8927c] px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:px-8">
      <div className="lg:pl-[8%]">
        <h2 className="max-w-[16ch] text-[clamp(34px,4.2vw,62px)] leading-[1.05] tracking-[-0.03em] text-(--eng-ink)" data-reveal>
          {title}
        </h2>
        {text && (
          <p className="mt-5 max-w-[44ch] text-[18px] leading-[1.5] text-(--eng-ink)/75" data-reveal data-reveal-delay={80}>
            {text}
          </p>
        )}
        <Link href={cta.href} {...externalProps(cta.href)} className="mt-8 inline-flex h-12 items-center gap-3 rounded-[8px] bg-black pr-1.5 pl-[18px] text-[16px] text-white" data-reveal data-reveal-delay={160}>
          {cta.label}
          <span className="grid size-9 place-items-center rounded-[6px] bg-white/15">
            <ArrowRight className="size-4" />
          </span>
        </Link>
      </div>
      <ContourObject names={[object]} step={2} className="mx-auto h-[min(76vw,540px)] w-auto text-(--eng-ink)" spin={0} />
    </section>
  );
}

/* ─────────────────────────── índice que acompanha a rolagem ─────────────────────────── */

/** Lista de âncoras presa ao lado do conteúdo; destaca a seção visível. */
export function EngStickyIndex({ items, label }: { items: { id: string; label: string }[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", () => {
    let cur = items[0]?.id;
    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = it.id;
    }
    setActive(cur);
  });
  return (
    <div ref={ref} className="sticky top-[100px] hidden self-start lg:block">
      <p className="eng-eyebrow">{label}</p>
      <ul className="mt-5 grid gap-1">
        {items.map((it, i) => (
          <li key={it.id}>
            <a href={`#${it.id}`} className={cn("flex items-baseline gap-3 rounded-[8px] py-1.5 text-[15px] transition-colors", active === it.id ? "text-(--eng-ink)" : "text-(--eng-ink)/40 hover:text-(--eng-ink)/70")}>
              <span className="font-mono text-[11px]">{String(i + 1).padStart(2, "0")}</span>
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
