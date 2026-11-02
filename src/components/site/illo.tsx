/**
 * Ilustrações originais do site (mídia própria, sem fotos de terceiros): fundos chapados da
 * paleta quente com o lilás da marca e desenho técnico em traço fino, no espírito das colagens da Anthropic.
 * Cada uma fala de uma parte da tecnologia do ArchRay. SVG 200×200, preenche o contêiner.
 */
import { cn } from "@/lib/utils";

const C = {
  lilac: "#83809a",
  olive: "#788c5d",
  sky: "#6a9bcc",
  oat: "#e3dacc",
  cactus: "#bcd1ca",
  heather: "#cbcadb",
  fig: "#c46686",
  coral: "#ebcece",
  ivory: "#faf9f5",
  sand: "#e8e6dc",
  ink: "#141413",
};

export type IlloName =
  | "retifica"
  | "fachada"
  | "fissura"
  | "contorno"
  | "deteccao"
  | "comparar"
  | "laudo"
  | "gut"
  | "escala"
  | "arco"
  | "grade"
  | "pontos"
  | "camadas";

const line = { fill: "none", stroke: C.ink, strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Art({ name }: { name: IlloName }) {
  switch (name) {
    case "retifica": {
      // fachada em perspectiva (trapézio) virando plano em escala (quadrado terracota)
      const q = [
        [34, 52],
        [128, 30],
        [140, 172],
        [26, 150],
      ];
      const lerp = (a: number[], b: number[], t: number) => [a[0]! + (b[0]! - a[0]!) * t, a[1]! + (b[1]! - a[1]!) * t];
      const v = [0.2, 0.4, 0.6, 0.8].map((t) => [lerp(q[0]!, q[1]!, t), lerp(q[3]!, q[2]!, t)]);
      const h = [0.2, 0.4, 0.6, 0.8].map((t) => [lerp(q[0]!, q[3]!, t), lerp(q[1]!, q[2]!, t)]);
      return (
        <>
          <rect width="200" height="200" fill={C.oat} />
          <rect x="96" y="70" width="84" height="84" fill={C.lilac} />
          <polygon points={q.map((p) => p.join(",")).join(" ")} {...line} fill={C.ivory} fillOpacity="0.55" />
          {[...v, ...h].map(([a, b], i) => (
            <line key={i} x1={a![0]} y1={a![1]} x2={b![0]} y2={b![1]} {...line} strokeWidth={0.8} />
          ))}
          {q.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.2" fill={C.ivory} stroke={C.ink} strokeWidth="1.2" />
          ))}
        </>
      );
    }
    case "fachada":
      return (
        <>
          <rect width="200" height="200" fill={C.sky} />
          <rect x="30" y="40" width="140" height="140" fill={C.ivory} />
          <path d="M30 40h140M30 70h140M30 120h140" {...line} />
          {[52, 92, 132].map((x) => (
            <path key={x} d={`M${x} 112V90a8 8 0 0116 0v22zM${x} 165v-28h16v28`} {...line} />
          ))}
          <path d="M62 40V22h76v18M100 22V12" {...line} />
          <rect x="128" y="132" width="26" height="22" fill={C.lilac} fillOpacity="0.85" />
        </>
      );
    case "fissura":
      return (
        <>
          <rect width="200" height="200" fill={C.ivory} />
          <rect x="0" y="0" width="200" height="200" fill={C.sand} fillOpacity="0.6" />
          <path d="M40 18l14 26-6 14 16 22-4 18 20 26-8 16 22 30 4 18" {...line} strokeWidth={2.2} />
          <path d="M70 80l18-6M84 124l-16 10" {...line} strokeWidth={1} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M150 ${30 + i * 22}h${i % 2 ? 10 : 18}`} stroke={C.lilac} strokeWidth="1.6" />
          ))}
          <path d="M150 30v132" stroke={C.lilac} strokeWidth="1.6" />
        </>
      );
    case "contorno":
      return (
        <>
          <rect width="200" height="200" fill={C.cactus} />
          <path d="M48 70l30-28 44 8 30 26-6 40 18 26-34 22-44-8-30-24 6-30z" fill={C.lilac} fillOpacity="0.7" stroke={C.ink} strokeWidth="1.4" strokeDasharray="5 4" />
          {[
            [48, 70],
            [78, 42],
            [122, 50],
            [152, 76],
            [146, 116],
            [164, 142],
            [130, 164],
            [86, 156],
            [56, 132],
            [62, 102],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill={C.ivory} stroke={C.ink} strokeWidth="1.1" />
          ))}
          <circle cx="104" cy="104" r="8" fill={C.ivory} stroke={C.ink} strokeWidth="1.4" />
          <path d="M100 104h8M104 100v8" {...line} />
        </>
      );
    case "deteccao":
      return (
        <>
          <rect width="200" height="200" fill={C.ink} />
          {[
            [22, 26, 56, 40],
            [96, 18, 70, 52],
            [36, 92, 44, 70],
            [104, 98, 74, 36],
            [120, 150, 54, 30],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill="none" stroke={C.ivory} strokeWidth="1.2" strokeDasharray="4 3" />
          ))}
          <path d="M30 120c8-6 14 4 22-4s12 2 20 0" stroke={C.lilac} strokeWidth="2" fill="none" />
          {[
            [130, 40],
            [150, 116],
            [60, 50],
            [146, 164],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4.5" fill={C.lilac} />
          ))}
        </>
      );
    case "comparar":
      return (
        <>
          <rect width="100" height="200" fill={C.oat} />
          <rect x="100" width="100" height="200" fill={C.ink} />
          {[0, 1].map((s) => (
            <g key={s} stroke={s ? C.ivory : C.ink} fill="none" strokeWidth="1.3">
              <path d={`M${20 + s * 100} 170V60h60v110M${32 + s * 100} 104v-14a8 8 0 0116 0v14M${32 + s * 100} 150v-24h36v24`} />
            </g>
          ))}
          <rect x="140" y="128" width="24" height="16" fill={C.lilac} />
          <rect x="38" y="132" width="10" height="8" fill={C.lilac} fillOpacity="0.6" />
          <path d="M100 0v200" stroke={C.ivory} strokeWidth="2" />
          <circle cx="100" cy="100" r="11" fill={C.ivory} />
          <path d="M94 100h12M94 100l3-3M94 100l3 3M106 100l-3-3M106 100l-3 3" stroke={C.ink} strokeWidth="1.3" fill="none" />
        </>
      );
    case "laudo":
      return (
        <>
          <rect width="200" height="200" fill={C.olive} />
          <g transform="rotate(-6 100 100)">
            <rect x="54" y="26" width="104" height="146" fill={C.sand} />
          </g>
          <g transform="rotate(4 100 100)">
            <rect x="46" y="30" width="104" height="146" fill={C.ivory} />
            <rect x="58" y="44" width="48" height="6" fill={C.ink} />
            <rect x="58" y="58" width="80" height="44" fill={C.oat} />
            <path d="M66 94l14-18 12 10 16-14 22 22" fill="none" stroke={C.ink} strokeWidth="1.2" />
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect x="58" y={112 + i * 12} width="6" height="6" fill={[C.lilac, C.sky, C.olive, C.fig][i]} />
                <rect x="70" y={113 + i * 12} width={56 - i * 8} height="4" fill={C.ink} fillOpacity="0.25" />
              </g>
            ))}
          </g>
        </>
      );
    case "gut":
      return (
        <>
          <rect width="200" height="200" fill={C.heather} />
          {[0, 1, 2].flatMap((r) =>
            [0, 1, 2].map((c) => {
              const k = r * 3 + c;
              const fill = [C.ivory, C.oat, C.lilac, C.oat, C.lilac, C.ink, C.lilac, C.ink, C.ink][k];
              return <rect key={k} x={34 + c * 46} y={34 + r * 46} width="40" height="40" fill={fill} />;
            }),
          )}
          <path d="M30 172h146M30 172V30" {...line} />
        </>
      );
    case "escala":
      return (
        <>
          <rect width="200" height="200" fill={C.lilac} />
          <g transform="rotate(-28 100 100)">
            <rect x="10" y="80" width="180" height="40" fill={C.ivory} />
            {Array.from({ length: 35 }).map((_, i) => (
              <path key={i} d={`M${16 + i * 5} 80v${i % 10 === 0 ? 20 : i % 5 === 0 ? 14 : 8}`} stroke={C.ink} strokeWidth="1" />
            ))}
          </g>
        </>
      );
    case "arco":
      return (
        <>
          <rect width="200" height="200" fill={C.coral} />
          <path d="M40 180V100a60 60 0 01120 0v80" fill={C.ivory} stroke={C.ink} strokeWidth="1.4" />
          <path d="M62 180V102a38 38 0 0176 0v78" fill={C.fig} fillOpacity="0.25" stroke={C.ink} strokeWidth="1.4" />
          {Array.from({ length: 9 }).map((_, i) => {
            const a = Math.PI - (i * Math.PI) / 8;
            return <path key={i} d={`M${100 + 38 * Math.cos(a)} ${100 - 38 * Math.sin(a)}L${100 + 60 * Math.cos(a)} ${100 - 60 * Math.sin(a)}`} {...line} />;
          })}
          <path d="M30 180h140" {...line} />
        </>
      );
    case "grade":
      return (
        <>
          <rect width="200" height="200" fill={C.sand} />
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={`v${i}`} d={`M${100 + (i - 4) * 9} 40L${100 + (i - 4) * 26} 190`} {...line} strokeWidth={0.9} />
          ))}
          {[48, 62, 80, 104, 136, 180].map((y, i) => (
            <path key={`h${i}`} d={`M${100 - (y - 40) * 0.69 - 36} ${y}H${100 + (y - 40) * 0.69 + 36}`} {...line} strokeWidth={0.9} />
          ))}
          <circle cx="100" cy="24" r="6" fill={C.lilac} />
        </>
      );
    case "pontos":
      return (
        <>
          <rect width="200" height="200" fill={C.olive} />
          {Array.from({ length: 220 }).map((_, i) => {
            // pontos espalhados formando o contorno de uma fachada com frontão
            const t = (i * 137.508) % 360;
            const r = ((i * 7919) % 100) / 100;
            const x = 40 + ((i * 53) % 120);
            const roof = x < 100 ? 70 - (x - 40) * 0.6 : 34 + (x - 100) * 0.6;
            const y = roof + r * (170 - roof);
            return <circle key={i} cx={x + Math.sin(t) * 1.5} cy={y} r={i % 9 ? 1.4 : 2.2} fill={i % 11 ? C.ivory : C.lilac} />;
          })}
        </>
      );
    case "camadas":
      return (
        <>
          <rect width="200" height="200" fill={C.sand} />
          {[C.sky, C.olive, C.lilac].map((fill, i) => (
            <polygon key={i} points={`100,${40 + i * 34} 168,${74 + i * 34} 100,${108 + i * 34} 32,${74 + i * 34}`} fill={fill} stroke={C.ink} strokeWidth="1.2" />
          ))}
        </>
      );
  }
}

export function Illo({ name, className, title }: { name: IlloName; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className={cn("block size-full", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <Art name={name} />
    </svg>
  );
}
