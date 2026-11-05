"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Box, Check, Eye, FileText, Layers, Scan, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/site/lang";

type TabId = "captura" | "modelo" | "nuvem" | "mapa" | "laudo";

const ICONS: Record<TabId, React.ElementType> = { captura: Video, modelo: Box, nuvem: Scan, mapa: Layers, laudo: FileText };
const IDS: TabId[] = ["captura", "modelo", "nuvem", "mapa", "laudo"];
const PHOTO = "/site/showcase-fachada.jpg";
const VISTA = "/site/showcase-vista.jpg";
const AUTO_MS = 6500;

const COPY = {
  pt: {
    kicker: "Captura 3D no celular",
    titleA: "Da câmera",
    titleB: "ao laudo, no mesmo app",
    more: "Saiba mais",
    project: "Igreja do Carmo",
    layers: "Camadas",
    caption: "Simulação do aplicativo. Foto: José Luís Ávila Silveira / Pedro Noronha e Costa, domínio público (Wikimedia Commons).",
    tabs: {
      captura: ["Captura", "Filme a fachada com o celular. O ArchRay guarda os quadros mais nítidos e avisa quando você estiver rápido demais.", "/tecnologia#captura"],
      modelo: ["Modelo 3D", "Os quadros viram um modelo 3D com textura, pronto para girar, medir e gerar a imagem em escala.", "/tecnologia#captura"],
      nuvem: ["Nuvem de pontos", "Cada detalhe da fachada vira um ponto no espaço. Abra a nuvem no navegador ou baixe em LAS.", "/tecnologia#captura"],
      mapa: ["Mapa de danos", "A IA sugere os danos, o contorno sai em um clique e as medidas chegam com margem de erro.", "/tecnologia#deteccao"],
      laudo: ["Laudo", "Quantitativos, prioridades, orçamento, prancha e PDF gerados do mesmo dado.", "/tecnologia#laudo"],
    },
    layerNames: { captura: "Vídeo da fachada", modelo: "Modelo 3D", nuvem: "Nuvem de pontos", mapa: "Mapa de danos", laudo: "Laudo" },
    good: "Bom ritmo",
    frames: "quadros",
    sharp: "nítido",
    processing: "Gerando o modelo 3D",
    ready: "Nuvem de pontos pronta",
    open: "Abrir no navegador",
    suggestions: "Sugestões da IA",
    accept: "Revisar",
    reportReady: "Laudo pronto",
    download: "Baixar PDF",
    damages: [
      ["Perda de reboco", "#c8553d", "6,4 m²"],
      ["Mancha de umidade", "#3f7cac", "11,2 m²"],
      ["Fissura", "#e0a100", "3,8 m"],
      ["Biodeterioração", "#4f8a4b", "2,1 m²"],
    ],
    report: "Laudo de estado de conservação",
    sheet: "Prancha A3",
    rows: ["Prioridade imediata", "Orçamento estimado", "Quantitativos por dano"],
  },
  en: {
    kicker: "3D capture on your phone",
    titleA: "From camera",
    titleB: "to report, in one app",
    more: "Learn more",
    project: "Carmo Church",
    layers: "Layers",
    caption: "App simulation. Photo: José Luís Ávila Silveira / Pedro Noronha e Costa, public domain (Wikimedia Commons).",
    tabs: {
      captura: ["Capture", "Film the facade on your phone. ArchRay keeps the sharpest frames and warns you when you move too fast.", "/tecnologia#captura"],
      modelo: ["3D model", "Frames become a textured 3D model, ready to rotate, measure and turn into a scaled image.", "/tecnologia#captura"],
      nuvem: ["Point cloud", "Every facade detail becomes a point in space. Open the cloud in your browser or download it as LAS.", "/tecnologia#captura"],
      mapa: ["Damage map", "AI suggests damage, outlines take one click and measurements come with a margin of error.", "/tecnologia#deteccao"],
      laudo: ["Report", "Quantities, priorities, budget, sheet and PDF generated from the same data.", "/tecnologia#laudo"],
    },
    layerNames: { captura: "Facade video", modelo: "3D model", nuvem: "Point cloud", mapa: "Damage map", laudo: "Report" },
    good: "Good pace",
    frames: "frames",
    sharp: "sharp",
    processing: "Generating the 3D model",
    ready: "Point cloud ready",
    open: "Open in browser",
    suggestions: "AI suggestions",
    accept: "Review",
    reportReady: "Report ready",
    download: "Download PDF",
    damages: [
      ["Render loss", "#c8553d", "6.4 m²"],
      ["Damp stain", "#3f7cac", "11.2 m²"],
      ["Crack", "#e0a100", "3.8 m"],
      ["Biodeterioration", "#4f8a4b", "2.1 m²"],
    ],
    report: "Condition report",
    sheet: "A3 sheet",
    rows: ["Immediate priority", "Estimated budget", "Quantities by damage"],
  },
} as const;

type Copy = (typeof COPY)[Lang];

/** Nuvem de pontos desenhada ao vivo a partir da imagem da fachada, girando devagar. */
function PointCloud() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = !!e?.isIntersecting));
    io.observe(canvas);
    const img = new Image();
    img.src = VISTA;
    img.onload = () => {
      const size = window.innerWidth < 640 ? 200 : 300;
      const off = document.createElement("canvas");
      off.width = size;
      off.height = Math.round((size * img.height) / img.width);
      const oc = off.getContext("2d", { willReadFrequently: true })!;
      oc.drawImage(img, 0, 0, off.width, off.height);
      const px = oc.getImageData(0, 0, off.width, off.height).data;
      const pts: number[] = [];
      for (let y = 0; y < off.height; y += 1) {
        for (let x = 0; x < off.width; x += 1) {
          const i = (y * off.width + x) * 4;
          const r = px[i]!, g = px[i + 1]!, b = px[i + 2]!;
          const lum = (r + g + b) / 3;
          // aberturas escuras recuam, como em uma nuvem real
          const z = (lum < 55 ? -26 : 0) + (Math.sin(x * 12.9 + y * 78.2) * 43758.5453 % 1) * 5;
          pts.push(x - off.width / 2, y - off.height / 2, z, 0xff000000 | (b << 16) | (g << 8) | r);
        }
      }
      const W = canvas.width, H = canvas.height;
      const frame = ctx.createImageData(W, H);
      const buf = new Uint32Array(frame.data.buffer);
      const scale = (H * 0.86) / off.height;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const draw = (t: number) => {
        raf = requestAnimationFrame(draw);
        if (!visible) return;
        const a = reduced ? 0.35 : Math.sin(t / 2600) * 0.5;
        const c = Math.cos(a), s = Math.sin(a);
        buf.fill(0xff141414);
        for (let i = 0; i < pts.length; i += 4) {
          const x = pts[i]!, y = pts[i + 1]!, z = pts[i + 2]!;
          const xr = x * c + z * s, zr = -x * s + z * c;
          const k = 620 / (620 - zr - xr * 0.25);
          const u = (W / 2 + xr * scale * k) | 0, v = (H / 2 + y * scale * k) | 0;
          if (u < 0 || v < 0 || u >= W - 1 || v >= H - 1) continue;
          const o = v * W + u;
          buf[o] = pts[i + 3]!;
          buf[o + 1] = pts[i + 3]!;
          buf[o + W] = pts[i + 3]!;
          buf[o + W + 1] = pts[i + 3]!;
        }
        ctx.putImageData(frame, 0, 0);
      };
      raf = requestAnimationFrame(draw);
    };
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);
  return <canvas ref={ref} width={760} height={760} className="size-full object-contain" aria-hidden />;
}

function CaptureScene({ t }: { t: Copy }) {
  const crops = ["22% 8%", "32% 18%", "42% 14%", "52% 26%", "24% 46%", "34% 52%", "44% 48%", "56% 56%", "22% 86%", "36% 92%", "48% 88%", "66% 78%"];
  return (
    <ul className="grid h-full grid-cols-3 content-center gap-2 p-4 pl-[46%] sm:grid-cols-4 sm:pl-[250px] lg:pl-[250px]">
      {crops.map((pos, i) => (
        <li key={pos} className="a-frame-in relative aspect-[4/3] overflow-hidden rounded-md" style={{ animationDelay: `${i * 0.28}s` }}>
          <span className="block size-full bg-no-repeat" style={{ backgroundImage: `url(${PHOTO})`, backgroundSize: "340%", backgroundPosition: pos }} />
          <span className="absolute right-1 bottom-1 hidden items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] text-white sm:inline-flex">
            <Check className="size-2.5" /> {t.sharp}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ModelScene() {
  return (
    <div className="grid size-full place-items-center overflow-hidden pl-[34%] sm:pl-[200px]" style={{ perspective: 1100 }}>
      <div className="a-sway relative aspect-square h-[78%]" style={{ transformStyle: "preserve-3d" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={VISTA} alt="" className="absolute inset-0 size-full object-cover" style={{ transform: "translateZ(40px)" }} />
        <span className="absolute inset-y-0 left-0 w-20 bg-[#6d6a63]" style={{ transform: "translateX(-40px) rotateY(-90deg)" }} />
        <span className="absolute inset-y-0 right-0 w-20 bg-[#59564f]" style={{ transform: "translateX(40px) rotateY(90deg)" }} />
        <span className="absolute inset-x-0 top-0 h-20 bg-[#8d8a83]" style={{ transform: "translateY(-40px) rotateX(90deg)" }} />
      </div>
    </div>
  );
}

function MapScene({ t }: { t: Copy }) {
  return (
    <div className="flex size-full items-center justify-center gap-5 p-4 pl-[38%] sm:pl-[230px]">
      <div className="relative aspect-square h-full max-h-full max-w-full overflow-hidden rounded-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={VISTA} alt="" className="size-full object-cover" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
          <defs>
            {t.damages.map(([, color], i) => (
              <pattern key={color} id={`hatch-${i}`} width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="0.5" height="1.6" fill={color} />
              </pattern>
            ))}
          </defs>
          <path className="a-draw" d="M1 74 L12 72 L14 88 L10 99 L1 99 Z" fill="url(#hatch-0)" stroke="#c8553d" strokeWidth="0.35" />
          <path className="a-draw" d="M29 4 L70 4 L71 13 L58 16 L40 13 L28 14 Z" fill="url(#hatch-1)" stroke="#3f7cac" strokeWidth="0.35" style={{ animationDelay: "0.5s" }} />
          <path className="a-draw" d="M77 39 L74 45 L76 49 L73 55 L75 60" fill="none" stroke="#e0a100" strokeWidth="0.6" style={{ animationDelay: "1s" }} />
          <path className="a-draw" d="M86 88 L99 86 L99 99 L84 99 Z" fill="url(#hatch-3)" stroke="#4f8a4b" strokeWidth="0.35" style={{ animationDelay: "1.5s" }} />
        </svg>
      </div>
      <ul className="hidden w-48 shrink-0 gap-2 text-[12.5px] text-white xl:grid">
        {t.damages.map(([name, color, qty]) => (
          <li key={name} className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-2">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: color }} />
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <span className="text-white/70">{qty}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReportScene({ t }: { t: Copy }) {
  return (
    <div className="flex size-full items-center justify-center gap-5 p-5 pl-[40%] sm:pl-[240px]">
      <div className="flex aspect-[1/1.41] h-[92%] flex-col rounded-sm bg-white p-4 text-[#141413] shadow-xl sm:p-5">
        <p className="text-[8px] tracking-[0.12em] uppercase opacity-60 sm:text-[9px]">ArchRay</p>
        <p className="mt-1 text-[11px] leading-tight font-medium sm:text-[14px]">{t.report}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={VISTA} alt="" className="mt-2 aspect-[16/10] w-full rounded-[2px] object-cover" />
        <ul className="mt-2 grid text-[8px] sm:text-[10px]">
          {t.rows.map((row) => (
            <li key={row} className="flex justify-between gap-2 border-b py-1">
              <span>{row}</span>
              <span className="h-1.5 w-8 self-center rounded bg-black/15" />
            </li>
          ))}
        </ul>
        <div className="mt-auto grid gap-1 pt-2">
          {[100, 86, 92].map((w) => (
            <span key={w} className="h-1 rounded bg-black/10" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      <div className="relative hidden h-[58%] aspect-[1.41/1] flex-col rounded-sm bg-white p-3 text-[#141413] shadow-xl lg:flex">
        <p className="mb-1 text-[10px] font-medium">{t.sheet}</p>
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={VISTA} alt="" className="size-full object-cover opacity-70" />
        </div>
      </div>
    </div>
  );
}

function Phone({ tab, t }: { tab: TabId; t: Copy }) {
  const [frames, setFrames] = useState(0);
  useEffect(() => {
    if (tab !== "captura") return;
    const id = setInterval(() => setFrames((n) => (n >= 186 ? 0 : n + 1)), 300);
    return () => clearInterval(id);
  }, [tab]);
  return (
    <div className="absolute bottom-[-20px] left-3 z-10 h-[300px] w-[142px] rounded-[26px] border-[4px] border-[#141413] bg-black shadow-2xl outline outline-1 outline-white/20 sm:left-6 sm:h-[400px] sm:w-[190px] sm:rounded-[32px] md:left-[212px]">
      <div className="relative size-full overflow-hidden rounded-[22px] bg-[#f7f6f2] text-[#141413] sm:rounded-[28px]">
        {tab === "captura" ? (
          <div className="relative size-full bg-black text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PHOTO} alt="" className="a-pan absolute inset-0 size-full object-cover" />
            <span className="absolute inset-x-0 bottom-[86px] mx-auto w-fit rounded-full bg-black/60 px-2.5 py-1 text-[10px] sm:bottom-[100px]">{t.good}</span>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent px-3 pt-8 pb-4">
              <span className="w-9 text-[10px] tabular-nums">0:{String(Math.floor(frames / 1.25) % 60).padStart(2, "0")}</span>
              <span className="grid size-11 place-items-center rounded-full border-[3px] border-white">
                <span className="size-4 rounded-sm bg-red-500" />
              </span>
              <span className="grid w-9 justify-items-center leading-none">
                <span className="text-[15px] font-medium tabular-nums">{frames}</span>
                <span className="text-[8px] text-white/75">{t.frames}</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex size-full flex-col gap-2 p-3 pt-8">
            <p className="text-[10px] text-black/55">{t.project}</p>
            {tab === "modelo" && (
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-[12px] leading-tight font-medium">{t.processing}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
                  <div className="a-fill h-full bg-[#141413]" />
                </div>
              </div>
            )}
            {tab === "nuvem" && (
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="flex items-center gap-1 text-[12px] leading-tight font-medium">
                  <Check className="size-3.5 shrink-0" /> {t.ready}
                </p>
                <span className="mt-3 block rounded-lg bg-[#141413] py-2 text-center text-[10.5px] text-white">{t.open}</span>
              </div>
            )}
            {tab === "mapa" && (
              <>
                <p className="text-[12px] font-medium">{t.suggestions}</p>
                {t.damages.slice(0, 3).map(([name, color]) => (
                  <div key={name} className="flex items-center gap-2 rounded-lg bg-white p-2 text-[10.5px] shadow-sm">
                    <span className="size-2 shrink-0 rounded-sm" style={{ background: color }} />
                    <span className="min-w-0 flex-1 truncate">{name}</span>
                  </div>
                ))}
                <span className="mt-auto block rounded-lg bg-[#141413] py-2 text-center text-[10.5px] text-white">{t.accept}</span>
              </>
            )}
            {tab === "laudo" && (
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="flex items-center gap-1 text-[12px] leading-tight font-medium">
                  <Check className="size-3.5 shrink-0" /> {t.reportReady}
                </p>
                <span className="mt-3 block rounded-lg bg-[#141413] py-2 text-center text-[10.5px] text-white">{t.download}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Demonstração da Home: uma simulação do ArchRay em abas, com o celular sobre a janela do aplicativo. */
export function AppShowcase({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const [tab, setTab] = useState<TabId>("captura");
  const [paused, setPaused] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (paused || touched || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setTab((c) => IDS[(IDS.indexOf(c) + 1) % IDS.length]!), AUTO_MS);
    return () => clearInterval(id);
  }, [paused, touched]);

  const [, text, href] = t.tabs[tab];

  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8" aria-labelledby="showcase">
      <div className="text-center">
        <p className="a-label">{t.kicker}</p>
        <h2 id="showcase" className="mt-3 a-fluid [--a:32] [--b:46] leading-[1.1]">
          <em className="a-serif italic">{t.titleA}</em> {t.titleB}
        </h2>
      </div>

      <div role="tablist" aria-label={t.kicker} className="no-scrollbar -mx-4 mt-7 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
        {IDS.map((id) => {
          const Icon = ICONS[id];
          return (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => {
                setTab(id);
                setTouched(true);
              }}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors",
                tab === id ? "border-transparent bg-[var(--site-accent)] text-white" : "border-foreground/70 hover:bg-[var(--site-pill)]",
              )}
            >
              <Icon className="size-[18px]" /> {t.tabs[id][0]}
            </button>
          );
        })}
      </div>

      <p className="mx-auto mt-6 min-h-[3.2em] max-w-[64ch] text-center text-[15.5px] leading-6 text-muted-foreground sm:min-h-0">
        {text}{" "}
        <Link href={href} className="font-medium whitespace-nowrap text-foreground underline underline-offset-4">
          {t.more}
        </Link>
      </p>

      <div className="relative mt-8 pb-5" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
        <div className="flex h-[440px] overflow-hidden rounded-[12px] border border-foreground/25 bg-[#141414] text-white sm:h-[540px]">
          <aside className="hidden w-[190px] shrink-0 flex-col gap-1 border-r border-white/10 bg-[#1c1c1b] p-4 text-[12.5px] md:flex">
            <p className="font-medium">{t.project}</p>
            <p className="mt-3 mb-1 text-[11px] text-white/55">{t.layers}</p>
            {IDS.map((id) => (
              <span key={id} className={cn("flex items-center justify-between gap-2 rounded-md px-2 py-1.5", tab === id ? "bg-white/12" : "text-white/60")}>
                <span className="truncate">{t.layerNames[id]}</span>
                <Eye className="size-3.5 shrink-0" />
              </span>
            ))}
          </aside>
          <div key={tab} className="a-scene-in relative min-w-0 flex-1">
            {tab === "captura" && <CaptureScene t={t} />}
            {tab === "modelo" && <ModelScene />}
            {tab === "nuvem" && (
              <div className="size-full pl-[30%] sm:pl-[200px]">
                <PointCloud />
              </div>
            )}
            {tab === "mapa" && <MapScene t={t} />}
            {tab === "laudo" && <ReportScene t={t} />}
          </div>
        </div>
        <Phone tab={tab} t={t} />
      </div>
      <p className="mt-5 text-center text-[12px] text-muted-foreground">{t.caption}</p>
    </section>
  );
}
