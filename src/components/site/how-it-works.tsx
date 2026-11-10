import { Box, Calculator, Camera, Clock, FileCheck2, FileText, PenTool, RotateCcw, ScanSearch, Table, Video, type LucideIcon } from "lucide-react";
import type { Lang } from "@/lib/site/lang";

/**
 * "Como funciona": esquema animado de como o diagnóstico é feito hoje (várias ferramentas,
 * idas e vindas) e com o ArchRay (uma esteira só). Só ilustração e SVG animado (SMIL), sem
 * fotos de projeto e sem números: o contraste é de processo.
 */

const C = { ink: "#141413", oat: "#e3dacc", ivory: "#faf9f5", lilac: "#83809a", heather: "#cbcadb", fig: "#c46686", olive: "#788c5d", sky: "#6a9bcc" };

const COPY = {
  pt: {
    eyebrow: "Como funciona",
    title: "Hoje, o diagnóstico passa por várias ferramentas. Com o ArchRay, por uma esteira só.",
    today: "Hoje",
    todayNote: "Cada etapa num programa diferente, com o arquivo indo e voltando.",
    todaySlow: "dias de escritório",
    archray: "Com o ArchRay",
    archrayNote: "Da gravação ao laudo no mesmo lugar, cada etapa alimentando a próxima.",
    archraySlow: "no mesmo fluxo",
    swipe: "Arraste para ver o caminho →",
    todaySteps: ["Fotos soltas", "Programa de fotogrametria", "Danos desenhados à mão no CAD", "Quantitativos na planilha", "Laudo no Word", "Revisões e retrabalho"],
    archraySteps: ["Vídeo no celular", "Modelo 3D em escala", "Danos sugeridos com IA", "Quantitativos e orçamento", "Laudo em PDF"],
    rows: [
      ["Várias ferramentas e licenças", "Uma plataforma, no navegador"],
      ["Cada dano contornado à mão", "Sugestão automática, você revisa"],
      ["Áreas copiadas para a planilha", "Quantitativos e orçamento automáticos"],
      ["Laudo montado do zero", "Laudo gerado do próprio mapa"],
    ],
    before: "Antes",
    after: "Com o ArchRay",
  },
  en: {
    eyebrow: "How it works",
    title: "Today, a diagnosis goes through many tools. With ArchRay, through a single pipeline.",
    today: "Today",
    todayNote: "Each step in a different program, files going back and forth.",
    todaySlow: "days at the office",
    archray: "With ArchRay",
    archrayNote: "From recording to report in one place, each step feeding the next.",
    archraySlow: "in one flow",
    swipe: "Swipe to follow the path →",
    todaySteps: ["Loose photos", "Photogrammetry software", "Damage drawn by hand in CAD", "Quantities in a spreadsheet", "Report in Word", "Revisions and rework"],
    archraySteps: ["Phone video", "3D model to scale", "AI-suggested damage", "Quantities and budget", "PDF report"],
    rows: [
      ["Many tools and licences", "One platform, in the browser"],
      ["Every defect outlined by hand", "Automatic suggestions, you review"],
      ["Areas copied into a spreadsheet", "Automatic quantities and budget"],
      ["Report written from scratch", "Report generated from the map"],
    ],
    before: "Before",
    after: "With ArchRay",
  },
};

/** Estação: círculo com ícone e rótulo embaixo. */
function Station({ x, y, icon: Icon, label, fill = C.oat, pulse }: { x: number; y: number; icon: LucideIcon; label: string; fill?: string; pulse?: { at: number; dur: number } }) {
  const words = label.split(" ");
  // quebra o rótulo em até duas linhas
  const mid = Math.ceil(words.length / 2);
  const lines = words.length > 2 ? [words.slice(0, mid).join(" "), words.slice(mid).join(" ")] : [label];
  return (
    <g>
      <circle cx={x} cy={y} r={30} fill={fill} stroke={C.ink} strokeWidth={1.4}>
        {pulse && (
          <animate
            attributeName="fill"
            values={`${fill};${C.heather};${fill};${fill}`}
            keyTimes={`0;${pulse.at.toFixed(3)};${Math.min(0.99, pulse.at + 0.08).toFixed(3)};1`}
            dur={`${pulse.dur}s`}
            repeatCount="indefinite"
          />
        )}
      </circle>
      <Icon x={x - 12} y={y - 12} width={24} height={24} color={C.ink} strokeWidth={1.6} />
      {lines.map((l, i) => (
        <text key={l} x={x} y={y + 50 + i * 17} textAnchor="middle" fontSize={14} fill="currentColor" fontFamily="inherit">
          {l}
        </text>
      ))}
    </g>
  );
}

/** Hoje: estações espalhadas, caminho emaranhado, o arquivo trava e volta (retrabalho). */
function TodayArt({ steps }: { steps: string[] }) {
  const S = [
    [70, 70],
    [240, 46],
    [420, 92],
    [600, 52],
    [560, 220],
    [300, 226],
  ] as const;
  const path =
    "M70 70 C120 10, 170 120, 240 46 C300 -10, 330 150, 420 92 C470 60, 500 0, 600 52 C690 100, 640 170, 560 220 C480 270, 400 170, 300 226 C230 262, 330 120, 420 92";
  const icons = [Camera, Box, PenTool, Table, FileText, RotateCcw];
  return (
    <svg viewBox="0 0 700 300" className="h-auto w-full min-w-[640px]" role="img" aria-label={steps.join(", ")}>
      <path d={path} fill="none" stroke={C.ink} strokeOpacity={0.35} strokeWidth={1.4} strokeDasharray="4 6">
        <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="3s" repeatCount="indefinite" />
      </path>
      {/* volta do retrabalho, em destaque */}
      <path d="M300 226 C230 262, 330 120, 420 92" fill="none" stroke={C.fig} strokeWidth={1.8} strokeDasharray="3 5" />
      {S.map(([x, y], i) => (
        <Station key={i} x={x} y={y} icon={icons[i]!} label={steps[i]!} fill={i === 5 ? "#ebcece" : C.oat} />
      ))}
      {/* o arquivo: anda devagar, para em cada programa e volta no fim */}
      <g>
        <rect x={-9} y={-11} width={18} height={22} rx={2} fill={C.ivory} stroke={C.ink} strokeWidth={1.3} />
        <path d="M-5 -4 H5 M-5 1 H5 M-5 6 H2" stroke={C.ink} strokeWidth={1} />
        <animateMotion
          dur="14s"
          repeatCount="indefinite"
          path={path}
          calcMode="linear"
          keyPoints="0;0;0.13;0.13;0.3;0.3;0.46;0.46;0.62;0.62;0.8;0.8;1;1"
          keyTimes="0;0.06;0.14;0.24;0.32;0.44;0.52;0.6;0.68;0.74;0.82;0.88;0.96;1"
        />
      </g>
    </svg>
  );
}

/** Com o ArchRay: esteira contínua; a fachada passa por todas as etapas sem parar. */
function ArchRayArt({ steps }: { steps: string[] }) {
  const xs = [80, 215, 350, 485, 620];
  const icons = [Video, Box, ScanSearch, Calculator, FileCheck2];
  const start = 50;
  const end = 650;
  const dur = 7;
  return (
    <svg viewBox="0 0 700 250" className="h-auto w-full min-w-[640px]" role="img" aria-label={steps.join(", ")}>
      {/* moldura: tudo dentro do ArchRay */}
      <rect x={10} y={8} width={680} height={234} rx={22} fill="none" stroke={C.lilac} strokeWidth={1.5} strokeDasharray="2 0" />
      {/* esteira */}
      <rect x={start - 20} y={168} width={end - start + 40} height={22} rx={11} fill={C.heather} stroke={C.ink} strokeWidth={1.3} />
      <line x1={start - 8} y1={179} x2={end + 8} y2={179} stroke={C.ink} strokeOpacity={0.55} strokeWidth={2} strokeDasharray="10 12">
        <animate attributeName="stroke-dashoffset" from="0" to="-22" dur="0.7s" repeatCount="indefinite" />
      </line>
      {xs.map((x, i) => (
        <line key={`l${i}`} x1={x} y1={112} x2={x} y2={166} stroke={C.ink} strokeOpacity={0.3} strokeWidth={1.2} strokeDasharray="3 4" />
      ))}
      {xs.map((x, i) => (
        <Station key={i} x={x} y={62} icon={icons[i]!} label="" pulse={{ at: Math.max(0.01, (x - start) / (end - start)), dur }} />
      ))}
      {/* a fachada correndo na esteira, ganhando cor a cada etapa */}
      <g>
        <path d="M-16 6 V-12 L0 -22 L16 -12 V6 Z" fill={C.ivory} stroke={C.ink} strokeWidth={1.3}>
          <animate attributeName="fill" values={`${C.ivory};${C.oat};${C.heather};#bcd1ca;#ebcece;${C.ivory}`} dur={`${dur}s`} repeatCount="indefinite" />
        </path>
        <rect x={-5} y={-6} width={10} height={12} fill="none" stroke={C.ink} strokeWidth={1} />
        <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={`M${start} 160 L${end} 160`} />
      </g>
      {steps.map((s, i) => {
        const words = s.split(" ");
        const mid = Math.ceil(words.length / 2);
        const lines = words.length > 2 ? [words.slice(0, mid).join(" "), words.slice(mid).join(" ")] : [s];
        return lines.map((l, k) => (
          <text key={`${i}${k}`} x={xs[i]} y={212 + k * 16} textAnchor="middle" fontSize={13.5} fill="currentColor">
            {l}
          </text>
        ));
      })}
    </svg>
  );
}

export function HowItWorks({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  return (
    <section className="bg-[#83809a] px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8" aria-labelledby="como-funciona">
      <p className="a-tag text-white/80" data-reveal>
        {t.eyebrow}
      </p>
      <h2 id="como-funciona" className="mt-4 max-w-[30ch] a-fluid [--a:30] [--b:46] leading-[1.1]" data-reveal data-reveal-delay={60}>
        {t.title}
      </h2>

      <div className="mt-10 grid gap-5 xl:grid-cols-2">
        {/* hoje */}
        <div className="a-card overflow-hidden p-5 text-foreground sm:p-7" data-reveal>
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-[20px] font-semibold">{t.today}</h3>
            <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Clock className="size-4 animate-[spin_3s_linear_infinite]" /> {t.todaySlow}
            </span>
          </div>
          <p className="mt-1 text-[14.5px] text-muted-foreground">{t.todayNote}</p>
          <div className="no-scrollbar -mx-5 mt-5 overflow-x-auto px-5 sm:-mx-7 sm:px-7">
            <TodayArt steps={t.todaySteps} />
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground xl:hidden">{t.swipe}</p>
        </div>

        {/* com o ArchRay */}
        <div className="a-card overflow-hidden p-5 text-foreground sm:p-7" data-reveal data-reveal-delay={120}>
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-[20px] font-semibold">{t.archray}</h3>
            <span className="text-[13px] text-muted-foreground">{t.archraySlow}</span>
          </div>
          <p className="mt-1 text-[14.5px] text-muted-foreground">{t.archrayNote}</p>
          <div className="no-scrollbar -mx-5 mt-5 overflow-x-auto px-5 sm:-mx-7 sm:px-7">
            <ArchRayArt steps={t.archraySteps} />
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground xl:hidden">{t.swipe}</p>
        </div>
      </div>

      {/* antes × depois, em linhas */}
      <div className="mt-8 overflow-hidden rounded-[14px] border border-white/20 bg-[var(--site-elev)] text-foreground" data-reveal>
        <div className="grid grid-cols-2 border-b bg-muted/50 text-[13px] font-medium">
          <span className="px-4 py-2.5 text-muted-foreground sm:px-6">{t.before}</span>
          <span className="border-l px-4 py-2.5 sm:px-6">{t.after}</span>
        </div>
        {t.rows.map(([a, b]) => (
          <div key={a} className="grid grid-cols-2 border-b text-[14.5px] leading-snug last:border-b-0">
            <span className="px-4 py-3.5 text-muted-foreground line-through decoration-foreground/25 sm:px-6">{a}</span>
            <span className="border-l px-4 py-3.5 font-medium sm:px-6">{b}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
