"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, type MotionValue } from "motion/react";
import { ArrowLeft, ArrowRight, ChevronDown, Crosshair, Landmark, Building2, HardHat, Scale, ShieldCheck, Ruler, ScrollText, Home } from "lucide-react";
import { ContourObject } from "./contour-object";
import type { ObjectName } from "./contour";
import type { Lang } from "@/lib/site/lang";

/* ─────────────────────────── textos ─────────────────────────── */

const T = {
  pt: {
    heroTitle: "Diagnóstico de fachadas com precisão de engenharia.",
    heroSub: "Do vídeo no celular ao laudo assinado: modelo 3D, nuvem de pontos, mapa de danos, quantitativos e orçamento numa única plataforma.",
    heroCta: "Solicitar diagnóstico",
    heroCta2: "Ver a tecnologia",
    scroll: "Role para explorar",
    stages: [
      { eyebrow: "01 · Captura", title: "Uma fachada inteira, gravada em vídeo pelo celular.", text: "O app guia a gravação em tempo real e guarda só os quadros nítidos. Sem scanner, sem drone, sem software instalado.", cta: "Como capturar", href: "/tecnologia#captura" },
      { eyebrow: "02 · Modelo 3D e nuvem de pontos", title: "Milhões de pontos medidos, com escala real.", text: "A fotogrametria reconstrói a geometria e o marcador de escala confere a medida sozinho, com a divergência declarada.", cta: "Modelo 3D e nuvem", href: "/tecnologia#captura" },
      { eyebrow: "03 · Diagnóstico", title: "Danos sugeridos pela IA, confirmados por quem assina.", text: "A visão computacional aponta fissuras, manchas e perdas sobre a fachada em escala. O profissional aceita ou rejeita cada uma.", cta: "Detecção automática", href: "/tecnologia#deteccao" },
      { eyebrow: "04 · Laudo", title: "Quantitativos, orçamento e laudo saindo do mesmo mapa.", text: "Áreas, comprimentos, prioridades pela matriz GUT e o PDF do laudo, gerados direto do que foi marcado.", cta: "Laudo e pranchas", href: "/tecnologia#laudo" },
    ],
    statement: "Do vídeo ao laudo, cada medida chega com a precisão declarada e cada decisão com a assinatura de quem entende de obra.",
    galleryA: "Precisão de engenharia para",
    galleryB: "Do patrimônio tombado ao prédio de escritórios: o mesmo fluxo, medido do mesmo jeito.",
    galleryWords: ["igrejas.", "fachadas.", "casarões.", "condomínios.", "galpões."],
    galleryCta: "Conheça a tecnologia",
    sectorsTitle: "Feito para quem responde pela obra.",
    sectors: [
      { icon: Landmark, title: "Arquitetura e restauro", text: "Mapa de danos e diagnóstico de bens históricos, com documentação para órgãos de preservação.", href: "/empresas#arquitetura" },
      { icon: HardHat, title: "Engenharia e inspeção predial", text: "Inspeções com quantitativos medidos, prioridades e laudo pronto para assinar.", href: "/empresas#engenharia" },
      { icon: Building2, title: "Construtoras", text: "Levantamento do existente antes da obra e acompanhamento de etapas.", href: "/empresas#construtoras" },
      { icon: Home, title: "Condomínios", text: "Fachadas inspecionadas com orçamento por prioridade para a assembleia.", href: "/empresas" },
      { icon: Scale, title: "Perícias e seguros", text: "Registro datado e comparável do estado da edificação.", href: "/empresas#pericias" },
      { icon: ShieldCheck, title: "Poder público", text: "Gestão de acervo edificado com monitoramento entre vistorias.", href: "/empresas#publico" },
    ],
    pillarsTitle: "O rigor que um laudo exige.",
    pillars: [
      { icon: Ruler, title: "Escala verificada", text: "O marcador impresso dá a medida real ao modelo, e medidas independentes se conferem. Divergência alta vira aviso, não número escondido.", href: "/index/escala-fotogrametria-marcador" },
      { icon: Crosshair, title: "Precisão declarada", text: "A retificação calcula a incerteza em milímetros a partir de pontos de conferência, e ela aparece no laudo.", href: "/tecnologia#retificacao" },
      { icon: ScrollText, title: "Rastreável do começo ao fim", text: "Cada dano sugerido pela IA é revisado por um profissional, e o laudo registra o método usado.", href: "/compromissos" },
    ],
    more: "Saiba mais",
    latestTitle: "Guias técnicos do Index.",
    latestCta: "Ver todos os guias",
    finalTitle: "Sua fachada, medida com rigor.",
    finalText: "Conte sobre o edifício. Um arquiteto do Estúdio Restaura responde com o caminho do diagnóstico.",
    finalCta: "Solicitar diagnóstico",
  },
  en: {
    heroTitle: "Façade diagnostics with engineering precision.",
    heroSub: "From a phone video to a signed report: 3D model, point cloud, damage map, quantities and budget on a single platform.",
    heroCta: "Request a diagnosis",
    heroCta2: "See the technology",
    scroll: "Scroll to explore",
    stages: [
      { eyebrow: "01 · Capture", title: "A whole façade, recorded on a phone video.", text: "The app guides the recording in real time and keeps only sharp frames. No scanner, no drone, no installed software.", cta: "How to capture", href: "/tecnologia#captura" },
      { eyebrow: "02 · 3D model and point cloud", title: "Millions of measured points, at real scale.", text: "Photogrammetry rebuilds the geometry and the scale marker checks the measurement on its own, with the divergence stated.", cta: "3D model and cloud", href: "/tecnologia#captura" },
      { eyebrow: "03 · Diagnosis", title: "AI-suggested damage, confirmed by whoever signs.", text: "Computer vision points out cracks, stains and losses on the scaled façade. The professional accepts or rejects each one.", cta: "Automatic detection", href: "/tecnologia#deteccao" },
      { eyebrow: "04 · Report", title: "Quantities, budget and report from the same map.", text: "Areas, lengths, GUT priorities and the PDF report, generated straight from what was marked.", cta: "Reports and sheets", href: "/tecnologia#laudo" },
    ],
    statement: "From video to report, every measurement arrives with its precision stated, and every decision with the signature of someone who knows construction.",
    galleryA: "Engineering precision for",
    galleryB: "From listed heritage to office buildings: the same flow, measured the same way.",
    galleryWords: ["churches.", "façades.", "mansions.", "condos.", "warehouses."],
    galleryCta: "Discover the technology",
    sectorsTitle: "Built for those accountable for the work.",
    sectors: [
      { icon: Landmark, title: "Architecture and restoration", text: "Damage maps and diagnostics of historic buildings, documented for heritage bodies.", href: "/empresas#arquitetura" },
      { icon: HardHat, title: "Engineering and inspection", text: "Inspections with measured quantities, priorities and a report ready to sign.", href: "/empresas#engenharia" },
      { icon: Building2, title: "Builders", text: "Survey the existing building before work and track each stage.", href: "/empresas#construtoras" },
      { icon: Home, title: "Condominiums", text: "Façades inspected with a budget by priority for the owners' meeting.", href: "/empresas" },
      { icon: Scale, title: "Forensics and insurance", text: "A dated, comparable record of the building's condition.", href: "/empresas#pericias" },
      { icon: ShieldCheck, title: "Public sector", text: "Managing built assets with monitoring between surveys.", href: "/empresas#publico" },
    ],
    pillarsTitle: "The rigour a report demands.",
    pillars: [
      { icon: Ruler, title: "Verified scale", text: "The printed marker gives the model its real size, and independent measurements check each other. High divergence becomes a warning, not a hidden number.", href: "/index/escala-fotogrametria-marcador" },
      { icon: Crosshair, title: "Stated precision", text: "Rectification computes the uncertainty in millimetres from check points, and it appears in the report.", href: "/tecnologia#retificacao" },
      { icon: ScrollText, title: "Traceable end to end", text: "Every AI suggestion is reviewed by a professional, and the report records the method used.", href: "/compromissos" },
    ],
    more: "Learn more",
    latestTitle: "Technical guides from the Index.",
    latestCta: "See all guides",
    finalTitle: "Your façade, measured with rigour.",
    finalText: "Tell us about the building. An architect from Estúdio Restaura replies with the path to a diagnosis.",
    finalCta: "Request a diagnosis",
  },
};

export type GuideCard = { slug: string; title: string; category: string; summary: string };

const ease = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────── 1. primeira dobra ─────────────────────────── */

function Hero({ t }: { t: (typeof T)["pt"] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const lift = useTransform(scrollYProgress, [0, 1], [0, -80]);
  return (
    <section ref={ref} className="eng-hero eng-dark relative -mt-[68px] h-[100svh] min-h-[620px] overflow-hidden bg-black text-white">
      <motion.div style={{ scale }} className="absolute inset-0">
        <video className="size-full object-cover opacity-70" autoPlay muted loop playsInline preload="metadata" poster="/site/video/hero-poster.jpg" aria-hidden>
          <source src="/site/video/hero-854.mp4" type="video/mp4" media="(max-width: 767px)" />
          <source src="/site/video/hero-1280.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(0_0_0/0.25),rgb(0_0_0/0.75))]" />
      </motion.div>
      <motion.div style={{ opacity: fade, y: lift }} className="relative flex h-full flex-col items-center justify-center px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease }}
          className="max-w-[18ch] text-[clamp(40px,6.4vw,92px)] leading-[1.02] tracking-[-0.03em]"
        >
          {t.heroTitle}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.2, ease }} className="mt-6 max-w-[56ch] text-[17px] leading-[1.5] text-white/75 sm:text-[19px]">
          {t.heroSub}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.35, ease }} className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/contato" className="a-btn">
            {t.heroCta}
          </Link>
          <Link href="/tecnologia" className="inline-flex h-12 items-center rounded-[8px] px-[18px] text-[16px] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.4)] transition-colors hover:bg-white/10">
            {t.heroCta2}
          </Link>
        </motion.div>
      </motion.div>
      <a href="#etapas" className="absolute right-4 bottom-6 flex items-center gap-3 font-mono text-[13px] text-white/80 sm:right-8">
        {t.scroll}
        <span className="grid size-10 place-items-center rounded-[8px] border border-white/60">
          <ChevronDown className="size-4" />
        </span>
      </a>
    </section>
  );
}

/* ─────────────────────────── 2. etapas presas na tela ─────────────────────────── */

const STAGE_OBJECTS: ObjectName[] = ["celular", "igreja", "notebook", "laudo"];

function StageText({ s, i, n, progress }: { s: (typeof T)["pt"]["stages"][number]; i: number; n: number; progress: MotionValue<number> }) {
  // um texto termina de sair antes do próximo entrar (sem sobreposição na troca)
  const vis = (v: number) => {
    const a = i / n;
    const b = (i + 1) / n;
    const w = 0.06;
    const fadeIn = i === 0 ? 1 : Math.min(1, Math.max(0, (v - a - 0.01) / w));
    const fadeOut = i === n - 1 ? 1 : Math.min(1, Math.max(0, (b - 0.01 - v) / w));
    return { o: Math.min(fadeIn, fadeOut), dir: fadeIn < 1 ? 1 : fadeOut < 1 ? -1 : 0 };
  };
  const opacity = useTransform(progress, (v) => vis(v).o);
  const y = useTransform(progress, (v) => {
    const { o, dir } = vis(v);
    return dir * (1 - o) * 24;
  });
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 top-0 mx-auto max-w-[760px] px-4 text-center">
      <p className="eng-eyebrow text-white/60">{s.eyebrow}</p>
      <h2 className="mt-5 text-[clamp(28px,3.4vw,44px)] leading-[1.12] text-white">{s.title}</h2>
      <p className="mx-auto mt-4 max-w-[60ch] text-[16px] leading-[1.55] text-white/65 sm:text-[17px]">{s.text}</p>
      <Link href={s.href} className="mt-7 inline-flex h-10 items-center gap-2 rounded-[8px] px-4 text-[15px] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.35)] hover:bg-white/10">
        {s.cta} <ArrowRight className="size-4" />
      </Link>
    </motion.div>
  );
}

function Stages({ t }: { t: (typeof T)["pt"] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const n = t.stages.length;
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(n - 1, Math.floor(v * n))));
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return (
    <section ref={ref} id="etapas" className="eng-dark relative bg-black text-white" style={{ height: `${n * 100 + 60}vh` }}>
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden pt-16">
        <ContourObject names={STAGE_OBJECTS} progress={scrollYProgress} className="h-[38svh] w-auto max-w-[80vw] text-white sm:h-[44svh]" />
        <div className="relative mt-8 h-[260px] w-full sm:h-[240px]">
          {t.stages.map((s, i) => (
            <StageText key={s.eyebrow} s={s} i={i} n={n} progress={scrollYProgress} />
          ))}
        </div>
        {/* marcador das etapas */}
        <div className="absolute bottom-8 left-1/2 w-[min(520px,86vw)] -translate-x-1/2">
          <div className="grid grid-cols-4 gap-3 font-mono text-[11px] tracking-[0.05em] text-white/40 uppercase">
            {t.stages.map((s, i) => (
              <span key={s.eyebrow} className={i === active ? "text-white" : ""}>
                {String(i + 1).padStart(2, "0")}
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

/* ─────────────────────────── 3. painel que cresce ─────────────────────────── */

function Word({ w, i, n, progress }: { w: string; i: number; n: number; progress: MotionValue<number> }) {
  // cada palavra acende numa fatia do progresso, enquanto o painel está preso na tela
  const start = 0.42 + (i / n) * 0.45;
  const opacity = useTransform(progress, (v) => 0.16 + 0.84 * Math.min(1, Math.max(0, (v - start) / 0.04)));
  return <motion.span style={{ opacity }}>{w} </motion.span>;
}

function Statement({ t }: { t: (typeof T)["pt"] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  // função explícita: a interpolação por faixas se comporta mal nas pontas
  const k = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
  const inset = useTransform(scrollYProgress, (v) => `${30 * (1 - k(v, 0.3, 0.62))}%`);
  const radius = useTransform(scrollYProgress, (v) => 24 * (1 - k(v, 0.3, 0.62)));
  const tileY1 = useTransform(scrollYProgress, (v) => 160 - 960 * k(v, 0, 0.4));
  const tileY2 = useTransform(scrollYProgress, (v) => 360 - 960 * k(v, 0, 0.4));
  const words = t.statement.split(" ");
  return (
    <section ref={ref} className="eng-dark relative bg-black" style={{ height: "260vh" }}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <motion.div style={{ left: inset, borderRadius: radius }} className="absolute inset-y-[10svh] right-0 bg-[#1e1c28]">
          <p className="absolute top-[12%] right-[6%] left-[6%] max-w-[22ch] text-[clamp(26px,3.6vw,56px)] leading-[1.12] tracking-[-0.02em] text-white">
            {words.map((w, i) => (
              <Word key={i} w={w} i={i} n={words.length} progress={scrollYProgress} />
            ))}
          </p>
        </motion.div>
        {/* trechos do vídeo flutuando à esquerda */}
        <motion.div style={{ y: tileY1 }} className="absolute top-[22%] left-4 hidden w-[24vw] max-w-[360px] overflow-hidden rounded-[16px] md:block">
          <video className="aspect-[4/3] w-full object-cover" autoPlay muted loop playsInline preload="none" poster="/site/video/clip-fachada.jpg" src="/site/video/clip-fachada.mp4" aria-hidden />
        </motion.div>
        <motion.div style={{ y: tileY2 }} className="absolute top-[52%] left-[10vw] hidden w-[14vw] max-w-[220px] overflow-hidden rounded-[12px] lg:block">
          <video className="aspect-square w-full object-cover" autoPlay muted loop playsInline preload="none" poster="/site/video/clip-telhado.jpg" src="/site/video/clip-telhado.mp4" aria-hidden />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 4. galeria em paralaxe ─────────────────────────── */

const TILES: { kind: "clip" | "obj"; src?: string; obj?: ObjectName; x: string; y: string; w: string; speed: number }[] = [
  { kind: "clip", src: "terreno", x: "4%", y: "10%", w: "15vw", speed: -60 },
  { kind: "obj", obj: "torre", x: "20%", y: "62%", w: "10vw", speed: 90 },
  { kind: "clip", src: "planta", x: "73%", y: "8%", w: "13vw", speed: -110 },
  { kind: "obj", obj: "fachada", x: "82%", y: "56%", w: "13vw", speed: 60 },
  { kind: "clip", src: "telhado", x: "8%", y: "72%", w: "11vw", speed: 140 },
  { kind: "obj", obj: "igreja", x: "64%", y: "70%", w: "9vw", speed: -40 },
  { kind: "clip", src: "fachada", x: "30%", y: "4%", w: "9vw", speed: 70 },
];

function Tile({ tile, progress }: { tile: (typeof TILES)[number]; progress: MotionValue<number> }) {
  const y = useTransform(progress, [0, 1], [tile.speed, -tile.speed]);
  return (
    <motion.div style={{ y, left: tile.x, top: tile.y, width: tile.w }} className="absolute hidden min-w-[110px] md:block">
      {tile.kind === "clip" ? (
        <video className="aspect-[4/3] w-full rounded-[12px] object-cover" autoPlay muted loop playsInline preload="none" poster={`/site/video/clip-${tile.src}.jpg`} src={`/site/video/clip-${tile.src}.mp4`} aria-hidden />
      ) : (
        <div className="aspect-square rounded-[12px] bg-white p-3">
          <ContourObject names={[tile.obj!]} className="size-full text-black" />
        </div>
      )}
    </motion.div>
  );
}

function Gallery({ t }: { t: (typeof T)["pt"] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setW((v) => (v + 1) % t.galleryWords.length), 2200);
    return () => clearInterval(id);
  }, [t.galleryWords.length]);
  return (
    <section ref={ref} className="relative overflow-hidden bg-[#eaeaea] py-40 sm:py-56">
      {TILES.map((tile, i) => (
        <Tile key={i} tile={tile} progress={scrollYProgress} />
      ))}
      <div className="relative mx-auto max-w-[1240px] px-4 text-center">
        <h2 className="text-[clamp(34px,4.6vw,72px)] leading-[1.05] tracking-[-0.03em]">
          {t.galleryA}
          <br />
          <span className="relative inline-block overflow-hidden align-bottom text-[var(--eng-iris)]">
            <motion.span key={w} initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ duration: 0.6, ease }} className="inline-block">
              {t.galleryWords[w]}
            </motion.span>
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-[48ch] text-[17px] text-[#575757]">{t.galleryB}</p>
        <Link href="/tecnologia" className="a-btn mt-8">
          {t.galleryCta}
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────────── 5. setores em carrossel ─────────────────────────── */

function Sectors({ t }: { t: (typeof T)["pt"] }) {
  const rail = useRef<HTMLUListElement>(null);
  const go = (d: number) => rail.current?.scrollBy({ left: d * 360, behavior: "smooth" });
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="flex items-end justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <h2 className="max-w-[20ch] text-[clamp(32px,4vw,56px)] leading-[1.05] tracking-[-0.025em]" data-reveal>
          {t.sectorsTitle}
        </h2>
        <div className="flex gap-2">
          {[-1, 1].map((d) => (
            <button key={d} onClick={() => go(d)} aria-label={d < 0 ? "Anterior" : "Próximo"} className="grid size-10 place-items-center rounded-[8px] border border-[#e5e5e5] bg-white hover:bg-[#f2f2f2]">
              {d < 0 ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
            </button>
          ))}
        </div>
      </div>
      <ul ref={rail} className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 sm:scroll-px-6 sm:px-6 lg:scroll-px-8 lg:px-8">
        {t.sectors.map((s, i) => (
          <motion.li
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.9, delay: i * 0.06, ease }}
            className="w-[min(82vw,340px)] shrink-0 snap-start"
          >
            <Link href={s.href} className="group flex h-[360px] flex-col rounded-[16px] bg-[#f2f2f2] p-8 transition-colors hover:bg-[#eaeaea]">
              <span className="grid size-11 place-items-center rounded-[8px] bg-[#e5e5e5]">
                <s.icon className="size-5" strokeWidth={1.4} />
              </span>
              <span className="mt-auto text-[24px] leading-[1.2] tracking-[-0.01em]">{s.title}</span>
              <span className="mt-3 text-[15px] leading-[1.5] text-[#575757]">{s.text}</span>
              <span className="mt-6 flex items-center gap-1.5 font-mono text-[11px] tracking-[0.05em] uppercase">
                {t.more} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

/* ─────────────────────────── 6. pilares ─────────────────────────── */

function Pillars({ t }: { t: (typeof T)["pt"] }) {
  return (
    <section className="bg-[#f2f2f2] px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <h2 className="max-w-[18ch] text-[clamp(32px,4vw,56px)] leading-[1.05] tracking-[-0.025em]" data-reveal>
        {t.pillarsTitle}
      </h2>
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {t.pillars.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1, delay: i * 0.1, ease }}
            className="flex flex-col rounded-[16px] bg-white p-8"
          >
            <span className="grid size-11 place-items-center rounded-[8px] bg-[#f2f2f2]">
              <p.icon className="size-5" strokeWidth={1.4} />
            </span>
            <h3 className="mt-16 text-[24px] leading-[1.2]">{p.title}</h3>
            <p className="mt-3 text-[15px] leading-[1.55] text-[#575757]">{p.text}</p>
            <Link href={p.href} className="mt-8 inline-flex h-10 w-fit items-center rounded-[8px] px-4 text-[14px] shadow-[inset_0_0_0_1px_#c7c7c7] hover:bg-[#f2f2f2]">
              {t.more}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── 7. últimos guias ─────────────────────────── */

function Latest({ t, guides }: { t: (typeof T)["pt"]; guides: GuideCard[] }) {
  const [first, ...rest] = guides;
  if (!first) return null;
  return (
    <section className="bg-white px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="flex items-end justify-between gap-6">
        <h2 className="text-[clamp(32px,4vw,56px)] leading-[1.05] tracking-[-0.025em]" data-reveal>
          {t.latestTitle}
        </h2>
        <Link href="/index" className="hidden font-mono text-[11px] tracking-[0.05em] uppercase underline-offset-4 hover:underline sm:block">
          {t.latestCta}
        </Link>
      </div>
      <div className="mt-12 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Link href={`/index/${first.slug}`} className="group relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[16px] bg-[#193a29] p-8 text-white">
          <ContourObject names={["fachada"]} className="absolute -top-6 right-0 h-[70%] w-auto text-white/70" />
          <p className="eng-eyebrow relative text-white/60">{first.category}</p>
          <h3 className="relative mt-3 max-w-[24ch] text-[clamp(24px,2.4vw,34px)] leading-[1.15] group-hover:underline group-hover:underline-offset-4">{first.title}</h3>
        </Link>
        <ul className="grid gap-4 sm:grid-cols-2">
          {rest.slice(0, 4).map((g) => (
            <li key={g.slug}>
              <Link href={`/index/${g.slug}`} className="group flex h-full min-h-[200px] flex-col rounded-[16px] bg-[#f2f2f2] p-6 hover:bg-[#eaeaea]">
                <p className="eng-eyebrow">{g.category}</p>
                <h3 className="mt-auto pt-8 text-[18px] leading-[1.3] group-hover:underline group-hover:underline-offset-4">{g.title}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────── 8. chamada final ─────────────────────────── */

function FinalCta({ t }: { t: (typeof T)["pt"] }) {
  return (
    <section className="grid items-center gap-10 bg-[#a8927c] px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:px-8">
      <div className="lg:pl-[8%]">
        <h2 className="max-w-[14ch] text-[clamp(36px,4.4vw,64px)] leading-[1.05] tracking-[-0.03em] text-black" data-reveal>
          {t.finalTitle}
        </h2>
        <p className="mt-5 max-w-[42ch] text-[18px] leading-[1.5] text-black/75" data-reveal data-reveal-delay={80}>
          {t.finalText}
        </p>
        <Link href="/contato" className="mt-8 inline-flex h-12 items-center gap-3 rounded-[8px] bg-black pr-1.5 pl-[18px] text-[16px] text-white" data-reveal data-reveal-delay={160}>
          {t.finalCta}
          <span className="grid size-9 place-items-center rounded-[6px] bg-white/15">
            <ArrowRight className="size-4" />
          </span>
        </Link>
      </div>
      <ContourObject names={["igreja"]} className="mx-auto h-[min(60vw,460px)] w-auto text-black" spin={0} />
    </section>
  );
}

/* ─────────────────────────── página ─────────────────────────── */

export function EngHome({ lang, guides }: { lang: Lang; guides: GuideCard[] }) {
  const t = T[lang];
  return (
    <>
      <Hero t={t} />
      <Stages t={t} />
      <Statement t={t} />
      <Gallery t={t} />
      <Sectors t={t} />
      <Pillars t={t} />
      <Latest t={t} guides={guides} />
      <FinalCta t={t} />
    </>
  );
}

