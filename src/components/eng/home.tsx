"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, type MotionValue } from "motion/react";
import { ArrowRight, ChevronDown, Landmark, Building2, HardHat, Scale, ShieldCheck, Home } from "lucide-react";
import { ContourObject } from "./contour-object";
import { Drift, Rise } from "./motion";
import { topoPaths } from "./topo";
import type { ObjectName } from "./contour";
import type { Lang } from "@/lib/site/lang";

/* ─────────────────────────── textos ─────────────────────────── */

const T = {
  pt: {
    heroTitle: "Levantamento 3D e nuvem de pontos com tecnologia própria: sem laser scanner nem drone.",
    heroSub: "O Estúdio Restaura vai até o imóvel, levanta a edificação em 3D com tecnologia própria, mapeia cada dano e entrega laudo, orçamento e prioridades. Mais simples, mais rápido e mais acessível.",
    heroCta: "Solicitar orçamento",
    heroCta2: "Como funciona",
    scroll: "Role para explorar",
    heroAfterTitle: "Aplicativo próprio com tecnologia LiDAR e IA embutida.",
    heroAfterText: "O ArchRay é software próprio que capta em vídeo e gera imagens retificadas, modelo 3D, mapa de danos e nuvem de pontos.",
    stages: [
      { eyebrow: "01 · Vistoria", title: "Nossa equipe vai até o imóvel e grava a fachada com o celular.", text: "Um marcador de escala na parede e o nosso app de captura bastam. Sem mobilizar laser scanner, sem drone e sem interromper o uso do edifício.", cta: "Como capturamos", href: "/tecnologia#captura" },
      { eyebrow: "02 · Levantamento 3D", title: "A gravação vira modelo 3D e nuvem de pontos em escala real.", text: "A fotogrametria reconstrói a edificação e o marcador confere a medida sozinho, com a divergência declarada. Já usa laser? Trabalhamos sobre a sua nuvem.", cta: "Modelo 3D e nuvem", href: "/tecnologia#captura" },
      { eyebrow: "03 · Diagnóstico", title: "IA embutida faz o mapeamento de danos primário, e nossa equipe revisa.", text: "Fissuras, manchas e perdas são marcadas pela IA sobre a fachada em escala; arquitetos de restauro conferem cada dano. Nada entra no laudo sem revisão.", cta: "Como diagnosticamos", href: "/tecnologia#deteccao" },
      { eyebrow: "04 · Entrega", title: "Você recebe laudo, orçamento e prioridades, prontos para decidir.", text: "Mapa de danos, quantitativos, orçamento do tratamento, matriz GUT, pranchas e DXF, com o laudo assinado pelo responsável técnico.", cta: "O que entregamos", href: "/tecnologia#laudo" },
    ],
    statement: "Contratar levantamento com laser scanner e drone custa caro e não cabe em prazos apertados: equipamento, equipe especializada e semanas de espera. O ArchRay resolve a maioria dos casos de um jeito mais simples, com custo até 60% menor e entrega mais rápida.",
    galleryA: "Levantamento e laudo para",
    galleryB: "Do patrimônio tombado ao prédio comercial, o mesmo serviço: vistoria, modelo 3D, mapa de danos e laudo.",
    galleryWords: ["igrejas.", "fachadas.", "casarões.", "condomínios.", "galpões."],
    galleryCta: "Conheça a tecnologia",
    sectorsTitle: "Para quem precisa decidir a obra.",
    sectors: [
      { icon: Landmark, title: "Patrimônio e restauro", text: "Levantamento e mapa de danos de igrejas e bens tombados, com a documentação que os órgãos de preservação pedem.", href: "/empresas#arquitetura" },
      { icon: HardHat, title: "Escritórios de arquitetura e engenharia", text: "Terceirize o levantamento e o diagnóstico: você recebe a base em escala e o mapa de danos para o seu projeto.", href: "/empresas#engenharia" },
      { icon: Building2, title: "Construtoras e retrofit", text: "Levantamento do existente antes da obra, com quantitativos para orçar a recuperação.", href: "/empresas#construtoras" },
      { icon: Home, title: "Condomínios", text: "Inspeção da fachada com orçamento por prioridade, pronto para levar à assembleia.", href: "/empresas" },
      { icon: Scale, title: "Perícias e seguros", text: "Registro datado, medido e comparável do estado da edificação.", href: "/empresas#pericias" },
      { icon: ShieldCheck, title: "Poder público", text: "Diagnóstico de acervo edificado e monitoramento entre vistorias.", href: "/empresas#publico" },
    ],
    more: "Saiba mais",
    latestTitle: "Do campo ao laudo.",
    latestTitle2: "O que há de novo no ArchRay.",
    latestCta: "Ver todos os guias",
    guideTag: "Guia",
    caseTag: "Caso · Patrimônio",
    caseTitle: "Igreja do Carmo, Horta: do levantamento à prancha em escala.",
    techTag: "Levantamento 3D",
    techTitle: "Como um vídeo de celular vira nuvem de pontos em escala.",
    finalTitle: "Conte qual é o imóvel. Mandamos o orçamento.",
    finalText: "Um arquiteto do Estúdio Restaura responde com escopo, prazo e orçamento do levantamento e do laudo.",
    finalCta: "Solicitar orçamento",
  },
  en: {
    heroTitle: "3D surveys and point clouds with in-house technology: no laser scanner, no drone.",
    heroSub: "Estúdio Restaura goes to the building, surveys it in 3D with in-house technology, maps every defect and delivers the report, budget and priorities. Simpler, faster and more affordable.",
    heroCta: "Request a quote",
    heroCta2: "How it works",
    scroll: "Scroll to explore",
    heroAfterTitle: "Our own app, with LiDAR technology and built-in AI.",
    heroAfterText: "ArchRay is in-house software that captures on video and produces rectified images, a 3D model, a damage map and a point cloud.",
    stages: [
      { eyebrow: "01 · Site visit", title: "Our team goes to the building and records the façade on a phone.", text: "A scale marker on the wall and our capture app are enough. No laser scanner, no drone, no disruption to the building.", cta: "How we capture", href: "/tecnologia#captura" },
      { eyebrow: "02 · 3D survey", title: "The recording becomes a 3D model and point cloud at real scale.", text: "Photogrammetry rebuilds the building and the marker checks the measurement on its own, with the divergence stated. Already have a laser scan? We work on your cloud.", cta: "3D model and cloud", href: "/tecnologia#captura" },
      { eyebrow: "03 · Diagnosis", title: "Built-in AI does the first damage mapping, and our team reviews it.", text: "Cracks, stains and losses are marked by AI on the scaled façade; restoration architects check every defect. Nothing reaches the report without review.", cta: "How we diagnose", href: "/tecnologia#deteccao" },
      { eyebrow: "04 · Delivery", title: "You receive the report, budget and priorities, ready to decide.", text: "Damage map, quantities, treatment budget, GUT matrix, drawings and DXF, with the report signed by the professional in charge.", cta: "What we deliver", href: "/tecnologia#laudo" },
    ],
    statement: "Hiring a laser scanner and drone survey is expensive and rarely fits a tight deadline: equipment, a specialised crew and weeks of waiting. ArchRay handles most cases in a simpler way, at up to 60% lower cost and with faster delivery.",
    galleryA: "Surveys and reports for",
    galleryB: "From listed heritage to commercial buildings, the same service: site visit, 3D model, damage map and report.",
    galleryWords: ["churches.", "façades.", "mansions.", "condos.", "warehouses."],
    galleryCta: "Discover the technology",
    sectorsTitle: "For those who must decide the work.",
    sectors: [
      { icon: Landmark, title: "Heritage and restoration", text: "Surveys and damage maps of churches and listed buildings, with the documentation heritage bodies ask for.", href: "/empresas#arquitetura" },
      { icon: HardHat, title: "Architecture and engineering firms", text: "Outsource the survey and diagnosis: you get the scaled base and the damage map for your project.", href: "/empresas#engenharia" },
      { icon: Building2, title: "Builders and retrofit", text: "Survey of the existing building before work, with quantities to price the repair.", href: "/empresas#construtoras" },
      { icon: Home, title: "Condominiums", text: "Façade inspection with a budget by priority, ready for the owners' meeting.", href: "/empresas" },
      { icon: Scale, title: "Forensics and insurance", text: "A dated, measured and comparable record of the building's condition.", href: "/empresas#pericias" },
      { icon: ShieldCheck, title: "Public sector", text: "Diagnosis of built assets and monitoring between surveys.", href: "/empresas#publico" },
    ],
    more: "Learn more",
    latestTitle: "From site to report.",
    latestTitle2: "What's new at ArchRay.",
    latestCta: "See all guides",
    guideTag: "Guide",
    caseTag: "Case · Heritage",
    caseTitle: "Carmo Church, Horta: from survey to scaled drawing.",
    techTag: "3D survey",
    techTitle: "How a phone video becomes a scaled point cloud.",
    finalTitle: "Tell us about the building. We'll send a quote.",
    finalText: "An architect from Estúdio Restaura replies with the scope, timeline and budget for the survey and report.",
    finalCta: "Request a quote",
  },
};

export type GuideCard = { slug: string; title: string; category: string; summary: string };

const ease = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────── 1. primeira dobra ─────────────────────────── */

/** Moldura de "celular deitado" em linhas finas, do tamanho do cartão (camadas da frente e de trás). */
function DeviceFrame({ dotted = false }: { dotted?: boolean }) {
  return (
    <svg viewBox="0 0 1000 500" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" fill="none" stroke="white" aria-hidden>
      <rect x="1" y="1" width="998" height="498" rx="34" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      <rect x="18" y="18" width="964" height="464" rx="24" strokeWidth="0.8" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
      {dotted &&
        [70, 150, 230, 310, 390].map((y, i) => (
          <g key={y}>
            <path d={`M-60 ${y} L${180 + i * 40} ${y + (i % 2 ? 14 : -10)}`} strokeWidth="1" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
            <path d={`M-66 ${y - 6} l10 6 l-10 6 z`} fill="white" stroke="none" />
            <path d={`M${860 - i * 24} ${y + 20} L1060 ${y + 30}`} strokeWidth="1" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
            <text x="1072" y={y + 34} fill="white" stroke="none" fontSize="16" fontFamily="monospace" opacity="0.8">
              {["1101", "0110", "1011", "1110", "0101"][i]}
            </text>
          </g>
        ))}
    </svg>
  );
}

/**
 * Primeira dobra no padrão do Scale: o vídeo num cartão com margens e cantos arredondados; ao rolar,
 * o fundo escurece e o cartão encolhe e gira em 3D para dentro de uma moldura de "celular deitado",
 * com curvas de nível desenhadas por cima e o texto aparecendo embaixo.
 */
function Hero({ t }: { t: (typeof T)["pt"] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const k = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
  const sm = (x: number) => x * x * (3 - 2 * x);
  const bg = useTransform(p, (v) => {
    const dark = typeof document !== "undefined" && document.getElementById("archray-site")?.classList.contains("site-dark");
    const c = dark ? 0 : Math.round(255 * (1 - k(v, 0.02, 0.22)));
    return `rgb(${c} ${c} ${c})`;
  });
  const scale = useTransform(p, (v) => 1 - 0.5 * sm(k(v, 0.04, 0.42)));
  const rotY = useTransform(p, (v) => -17 * sm(k(v, 0.1, 0.45)));
  const rotX = useTransform(p, (v) => 7 * sm(k(v, 0.1, 0.45)));
  const lift = useTransform(p, (v) => `${-9 * sm(k(v, 0.04, 0.42))}vh`);
  const radius = useTransform(p, (v) => 16 + 30 * k(v, 0.04, 0.42));
  const titleO = useTransform(p, (v) => 1 - k(v, 0, 0.12));
  const frameO = useTransform(p, (v) => k(v, 0.22, 0.4));
  const backZ = useTransform(p, (v) => `translateZ(${-140 * k(v, 0.22, 0.45)}px) translateX(${-6 * k(v, 0.22, 0.45)}%)`);
  const frontZ = useTransform(p, (v) => `translateZ(${110 * k(v, 0.22, 0.45)}px) translateX(${5 * k(v, 0.22, 0.45)}%)`);
  const topoClip = useTransform(p, (v) => `inset(0 ${100 - 100 * k(v, 0.32, 0.55)}% 0 0)`);
  const videoDim = useTransform(p, (v) => 0.62 - 0.12 * k(v, 0.3, 0.55));
  // véu escuro forte enquanto o título está na tela; some quando o vídeo vira o aparelho
  const veil = useTransform(p, (v) => 1 - 0.6 * k(v, 0.05, 0.3));
  const textO = useTransform(p, (v) => k(v, 0.45, 0.6));
  const textY = useTransform(p, (v) => 30 * (1 - k(v, 0.45, 0.6)));
  const promptO = useTransform(p, (v) => 1 - k(v, 0, 0.06));
  const paths = useMemo(() => topoPaths({ w: 1000, h: 500, levels: 11, cols: 90, seed: 11 }), []);

  // o cabeçalho fica escuro enquanto o fundo da primeira dobra está escuro
  useMotionValueEvent(p, "change", (v) => {
    const root = document.getElementById("archray-site");
    if (root) root.toggleAttribute("data-hero-dark", v > 0.12 && v < 0.999);
  });
  useEffect(() => () => document.getElementById("archray-site")?.removeAttribute("data-hero-dark"), []);

  return (
    <section ref={ref} className="relative -mt-[68px]" style={{ height: "280vh" }}>
      <motion.div style={{ background: bg }} className="eng-hero-bg sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-x-3 top-[80px] bottom-3 [perspective:1800px] sm:inset-x-6 sm:top-[92px] sm:bottom-6">
          <motion.div style={{ scale, rotateY: rotY, rotateX: rotX, y: lift, transformStyle: "preserve-3d" }} className="relative size-full">
            {/* moldura de trás */}
            <motion.div style={{ opacity: frameO, transform: backZ }} className="pointer-events-none absolute inset-0">
              <DeviceFrame />
            </motion.div>
            {/* o vídeo */}
            <motion.div style={{ borderRadius: radius }} className="absolute inset-0 overflow-hidden bg-black">
              <motion.video style={{ opacity: videoDim }} className="size-full object-cover" autoPlay muted loop playsInline preload="metadata" poster="/site/video/hero-poster.jpg" aria-hidden>
                <source src="/site/video/hero-854.mp4" type="video/mp4" media="(max-width: 767px)" />
                <source src="/site/video/hero-1280.mp4" type="video/mp4" />
              </motion.video>
              <motion.div style={{ opacity: veil }} className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgb(0_0_0/0.72),rgb(0_0_0/0.45))]" />
              {/* curvas de nível desenhadas por cima do vídeo */}
              <motion.svg style={{ clipPath: topoClip }} viewBox="0 0 1000 500" preserveAspectRatio="none" className="absolute inset-0 size-full" fill="none" stroke="white" aria-hidden>
                {paths.map((d, i) => (
                  <path key={i} d={d} strokeWidth="1" strokeOpacity={0.35 + 0.05 * i} vectorEffect="non-scaling-stroke" />
                ))}
              </motion.svg>
              <motion.div style={{ opacity: titleO }} className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
                <h1 className="max-w-[20ch] text-[clamp(36px,4.6vw,68px)] leading-[1.06] tracking-[-0.02em] [text-shadow:0_2px_24px_rgb(0_0_0/0.45)]">{t.heroTitle}</h1>
                <p className="mt-5 max-w-[56ch] text-[16px] leading-[1.5] text-white/90 [text-shadow:0_1px_12px_rgb(0_0_0/0.6)] sm:text-[18px]">{t.heroSub}</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link href="/contato" className="eng-light inline-flex h-12 items-center rounded-[8px] bg-(--eng-0) px-[18px] text-[16px] text-(--eng-ink) hover:bg-(--eng-3)">
                    {t.heroCta}
                  </Link>
                  <Link href="/tecnologia" className="inline-flex h-12 items-center rounded-[8px] px-[18px] text-[16px] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.5)] hover:bg-white/10">
                    {t.heroCta2}
                  </Link>
                </div>
              </motion.div>
              <motion.a style={{ opacity: promptO }} href="#etapas" className="absolute right-5 bottom-5 flex items-center gap-3 font-mono text-[13px] text-white sm:right-8 sm:bottom-7">
                {t.scroll}
                <span className="grid size-10 place-items-center rounded-[8px] border border-white">
                  <ChevronDown className="size-4" />
                </span>
              </motion.a>
            </motion.div>
            {/* moldura da frente, com as linhas pontilhadas e os rótulos */}
            <motion.div style={{ opacity: frameO, transform: frontZ }} className="pointer-events-none absolute inset-0">
              <DeviceFrame dotted />
            </motion.div>
          </motion.div>
        </div>
        {/* texto que aparece embaixo do aparelho */}
        <motion.div style={{ opacity: textO, y: textY }} className="absolute inset-x-0 bottom-[9vh] px-4 text-center text-white">
          <h2 className="text-[clamp(28px,3vw,44px)] leading-[1.1] tracking-[-0.02em]">{t.heroAfterTitle}</h2>
          <p className="mx-auto mt-4 max-w-[62ch] text-[15px] leading-[1.55] text-white/65 sm:text-[16px]">{t.heroAfterText}</p>
        </motion.div>
      </motion.div>
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
        <ContourObject names={STAGE_OBJECTS} progress={scrollYProgress} className="h-[42svh] w-auto max-w-[88vw] text-white sm:h-[50svh]" />
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
  // a catedral se traça enquanto o painel está preso (o objeto único termina de entrar em 0,3)
  const build = useTransform(scrollYProgress, (v) => 0.3 * k(v, 0.32, 0.94));
  const words = t.statement.split(" ");
  return (
    <section ref={ref} className="eng-dark relative bg-black" style={{ height: "260vh" }}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <motion.div style={{ left: inset, borderRadius: radius }} className="absolute inset-y-[10svh] right-0 bg-[#1e1c28]">
          <p className="absolute top-[10%] right-[6%] left-[6%] max-w-[24ch] text-[clamp(23px,3vw,46px)] leading-[1.14] tracking-[-0.02em] text-white">
            {words.map((w, i) => (
              <Word key={i} w={w} i={i} n={words.length} progress={scrollYProgress} />
            ))}
          </p>
          <div className="absolute right-[2%] bottom-[2%] h-[44%] w-[80%] sm:h-[62%] sm:w-[60%] lg:right-[3%] lg:bottom-[4%] lg:h-[86%] lg:w-[46%]">
            <ContourObject names={["catedral"]} progress={build} spin={1.1} yaw={0.4} className="size-full text-white/85" />
          </div>
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

const TILES: { kind: "clip" | "obj"; src?: string; obj?: ObjectName; x: string; y: string; w: string; mx?: string; my?: string; mw?: string; speed: number }[] = [
  { kind: "clip", src: "terreno", x: "4%", y: "10%", w: "15vw", mx: "4%", my: "3%", mw: "38vw", speed: -60 },
  { kind: "obj", obj: "torre", x: "20%", y: "62%", w: "11vw", speed: 90 },
  { kind: "clip", src: "planta", x: "73%", y: "8%", w: "13vw", mx: "58%", my: "6%", mw: "36vw", speed: -110 },
  { kind: "obj", obj: "fachada", x: "82%", y: "56%", w: "13vw", speed: 60 },
  { kind: "clip", src: "telhado", x: "8%", y: "72%", w: "11vw", mx: "6%", my: "80%", mw: "34vw", speed: 140 },
  { kind: "obj", obj: "catedral", x: "63%", y: "66%", w: "12vw", mx: "58%", my: "77%", mw: "34vw", speed: -40 },
  { kind: "clip", src: "fachada", x: "30%", y: "4%", w: "9vw", speed: 70 },
];

function Tile({ tile, progress }: { tile: (typeof TILES)[number]; progress: MotionValue<number> }) {
  const y = useTransform(progress, (v) => tile.speed * (1 - 2 * v));
  const mobile = Boolean(tile.mw);
  const vars = { "--x": tile.x, "--y": tile.y, "--w": tile.w, "--mx": tile.mx ?? tile.x, "--my": tile.my ?? tile.y, "--mw": tile.mw ?? tile.w } as React.CSSProperties;
  return (
    <motion.div
      style={{ y, ...vars }}
      className={`absolute top-(--my) left-(--mx) w-(--mw) md:top-(--y) md:left-(--x) md:w-(--w) md:min-w-[110px] ${mobile ? "block" : "hidden md:block"}`}
    >
      {tile.kind === "clip" ? (
        <video className="aspect-[4/3] w-full rounded-[12px] object-cover" autoPlay muted loop playsInline preload="none" poster={`/site/video/clip-${tile.src}.jpg`} src={`/site/video/clip-${tile.src}.mp4`} aria-hidden />
      ) : (
        <div className="aspect-square rounded-[12px] bg-(--eng-0) p-3">
          <ContourObject names={[tile.obj!]} step={3} className="size-full text-(--eng-ink)" />
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
    <section ref={ref} className="relative overflow-hidden bg-(--eng-2) py-[300px] sm:py-56">
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
        <p className="mx-auto mt-6 max-w-[48ch] text-[17px] text-(--eng-mute)">{t.galleryB}</p>
        <Link href="/tecnologia" className="a-btn mt-8">
          {t.galleryCta}
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────────── 5. setores em trilho horizontal ─────────────────────────── */

/** Cor e objeto de cada setor (mesma ordem de T.sectors). */
const SECTOR_LOOK: { card: string; ink: string; obj: ObjectName }[] = [
  { card: "bg-[#193a29] text-white", ink: "text-white/85", obj: "catedral" },
  { card: "eng-light bg-[#d9d1e2]", ink: "text-black/80", obj: "notebook" },
  { card: "eng-light bg-[#a8927c]", ink: "text-black/80", obj: "torre" },
  { card: "bg-black text-white", ink: "text-white/85", obj: "fachada" },
  { card: "bg-(--eng-1)", ink: "text-(--eng-ink)", obj: "laudo" },
  { card: "bg-[#79648c] text-white", ink: "text-white/85", obj: "igreja" },
];

/**
 * Setores no padrão do Scale: a seção fica presa e a rolagem vertical empurra um trilho de cartões
 * grandes para o lado. Cada cartão desenha o seu objeto em curvas de nível quando entra na tela.
 */
function Sectors({ t }: { t: (typeof T)["pt"] }) {
  const ref = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const measure = () => setDist(Math.max(0, el.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const k = (v: number) => Math.min(1, Math.max(0, (v - 0.04) / 0.92));
  const x = useTransform(scrollYProgress, (v) => -dist * k(v));
  const bar = useTransform(scrollYProgress, (v) => `${100 * k(v)}%`);
  const n = t.sectors.length;
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(n - 1, Math.round(k(v) * (n - 1)))));
  return (
    <section ref={ref} className="relative bg-(--eng-0)" style={{ height: `calc(100svh + ${Math.round(dist * 1.15)}px)` }}>
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pt-16 pb-8">
        <div className="flex items-end justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Rise>
            <h2 className="max-w-[16ch] text-[clamp(32px,4.4vw,64px)] leading-[1.04] tracking-[-0.03em]">{t.sectorsTitle}</h2>
          </Rise>
          <p className="eng-eyebrow shrink-0 tabular-nums">
            {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </p>
        </div>
        <motion.div ref={rail} style={{ x }} className="mt-8 flex w-max gap-4 px-4 sm:mt-10 sm:px-6 lg:px-8">
          {t.sectors.map((s, i) => {
            const look = SECTOR_LOOK[i % SECTOR_LOOK.length]!;
            return (
              <Link
                key={s.title}
                href={s.href}
                className={`group relative flex h-[min(60svh,560px)] w-[min(84vw,460px)] shrink-0 flex-col overflow-hidden rounded-[20px] p-7 transition-transform duration-500 hover:-translate-y-1.5 sm:p-9 ${look.card}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-[12px] tracking-[0.05em] uppercase opacity-70">{String(i + 1).padStart(2, "0")}</span>
                  <span className="grid size-10 place-items-center rounded-full border border-current/25 transition-transform duration-500 group-hover:rotate-[-45deg]">
                    <ArrowRight className="size-4" />
                  </span>
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-[8%] h-[58%] transition-transform duration-700 group-hover:scale-[1.06]">
                  <ContourObject names={[look.obj]} step={look.obj === "catedral" ? 2 : 1} className={`mx-auto size-full ${look.ink}`} />
                </div>
                <div className="relative mt-auto">
                  <h3 className="text-[clamp(24px,2.2vw,32px)] leading-[1.12] tracking-[-0.015em]">{s.title}</h3>
                  <p className="mt-3 max-w-[38ch] text-[15px] leading-[1.5] opacity-75">{s.text}</p>
                </div>
              </Link>
            );
          })}
        </motion.div>
        <div className="mx-4 mt-8 h-px bg-(--eng-line) sm:mx-6 lg:mx-8">
          <motion.div style={{ width: bar }} className="h-px bg-(--eng-ink)" />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 7. últimos guias ─────────────────────────── */

function Tag({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <span className={`w-fit rounded-[6px] px-2 py-1 font-mono text-[11px] tracking-[0.05em] uppercase ${light ? "bg-white/90 text-black" : "bg-(--eng-3)"}`}>{children}</span>;
}

function Latest({ t, guides }: { t: (typeof T)["pt"]; guides: GuideCard[] }) {
  const [a, b, c] = guides;
  if (!a) return null;
  const card = "group relative flex overflow-hidden rounded-[16px] p-7 sm:p-8";
  const title = "max-w-[26ch] leading-[1.18] tracking-[-0.01em] group-hover:underline group-hover:underline-offset-4";
  return (
    <section className="relative z-[1] -mt-6 rounded-t-[24px] bg-(--eng-0) px-4 py-24 sm:px-6 sm:py-36 lg:px-8">
      <Rise>
        <h2 className="mx-auto max-w-[24ch] text-center text-[clamp(34px,4.8vw,76px)] leading-[1.04] tracking-[-0.03em]">
          {t.latestTitle}
          <br />
          <span className="text-(--eng-mute)">{t.latestTitle2}</span>
        </h2>
      </Rise>
      <div className="mt-16 grid gap-4 lg:grid-cols-12">
        {/* claro, com o laudo */}
        <Drift speed={30} className="lg:col-span-5">
          <Link href={b ? `/index/${b.slug}` : "/index"} className={`${card} h-[440px] flex-col bg-(--eng-1) hover:bg-(--eng-2)`}>
            <Tag>
              {t.guideTag} · {b?.category}
            </Tag>
            <h3 className={`${title} mt-5 text-[22px]`}>{b?.title}</h3>
            <ContourObject names={["laudo"]} step={2} className="pointer-events-none absolute -right-6 -bottom-10 h-[72%] w-auto text-(--eng-ink)" />
          </Link>
        </Drift>
        {/* caso real com imagem */}
        <Drift speed={-20} className="lg:col-span-7">
          <Link href="/historias/carmo-da-horta" className={`${card} h-[440px] flex-col justify-between bg-black text-white`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/site/video/clip-fachada.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <span className="relative">
              <Tag light>{t.caseTag}</Tag>
            </span>
            <h3 className={`${title} relative text-[clamp(22px,2.2vw,32px)]`}>{t.caseTitle}</h3>
          </Link>
        </Drift>
        {/* destaque grande verde, com a catedral */}
        <Drift speed={40} className="lg:col-span-7">
          <Link href={`/index/${a.slug}`} className={`${card} h-[560px] flex-col justify-end bg-[#193a29] text-white`}>
            <ContourObject names={["catedral"]} step={2} className="pointer-events-none absolute -top-4 right-[-4%] h-[86%] w-auto text-white/80" />
            <span className="relative">
              <Tag light>
                {t.guideTag} · {a.category}
              </Tag>
            </span>
            <h3 className={`${title} relative mt-4 text-[clamp(26px,2.8vw,40px)]`}>{a.title}</h3>
            <p className="relative mt-3 max-w-[52ch] text-[15px] leading-[1.55] text-white/70">{a.summary}</p>
          </Link>
        </Drift>
        <div className="grid gap-4 lg:col-span-5">
          {/* vídeo da tecnologia */}
          <Drift speed={-30}>
            <Link href="/tecnologia#captura" className={`${card} h-[272px] flex-col justify-between bg-black text-white`}>
              <video className="absolute inset-0 size-full object-cover opacity-85" autoPlay muted loop playsInline preload="none" poster="/site/video/clip-planta.jpg" src="/site/video/clip-planta.mp4" aria-hidden />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="relative">
                <Tag light>{t.techTag}</Tag>
              </span>
              <h3 className={`${title} relative text-[20px]`}>{t.techTitle}</h3>
            </Link>
          </Drift>
          {/* guia com a torre, em lilás */}
          <Drift speed={20}>
            <Link href={c ? `/index/${c.slug}` : "/index"} className={`${card} eng-light h-[272px] flex-col bg-[#d9d1e2]`}>
              <Tag>
                {t.guideTag} · {c?.category}
              </Tag>
              <h3 className={`${title} mt-4 max-w-[20ch] text-[20px]`}>{c?.title}</h3>
              <ContourObject names={["torre"]} step={2} className="pointer-events-none absolute -right-2 -bottom-6 h-[90%] w-auto text-black/80" />
            </Link>
          </Drift>
        </div>
      </div>
      <div className="mt-12 text-center">
        <Link href="/index" className="a-btn">
          {t.latestCta}
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────────── 8. chamada final ─────────────────────────── */

function FinalCta({ t }: { t: (typeof T)["pt"] }) {
  return (
    <section className="eng-light relative z-[1] -mt-6 grid items-center gap-10 rounded-t-[24px] bg-[#a8927c] px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:px-8">
      <div className="lg:pl-[8%]">
        <h2 className="max-w-[14ch] text-[clamp(36px,4.4vw,64px)] leading-[1.05] tracking-[-0.03em] text-(--eng-ink)" data-reveal>
          {t.finalTitle}
        </h2>
        <p className="mt-5 max-w-[42ch] text-[18px] leading-[1.5] text-(--eng-ink)/75" data-reveal data-reveal-delay={80}>
          {t.finalText}
        </p>
        <Link href="/contato" className="mt-8 inline-flex h-12 items-center gap-3 rounded-[8px] bg-black pr-1.5 pl-[18px] text-[16px] text-white" data-reveal data-reveal-delay={160}>
          {t.finalCta}
          <span className="grid size-9 place-items-center rounded-[6px] bg-white/15">
            <ArrowRight className="size-4" />
          </span>
        </Link>
      </div>
      <Drift speed={-50}>
        <ContourObject names={["catedral"]} step={2} className="mx-auto h-[min(80vw,560px)] w-auto text-(--eng-ink)" spin={0} />
      </Drift>
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
      <Latest t={t} guides={guides} />
      <FinalCta t={t} />
    </>
  );
}

