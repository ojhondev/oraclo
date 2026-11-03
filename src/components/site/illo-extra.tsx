/**
 * Ilustrações extras (arquitetura, engenharia e patrimônio), no mesmo estilo de illo.tsx:
 * fundo chapado da paleta, branco-marfim e traço fino grafite. SVG 200×200.
 * Também usadas para gerar as imagens de posts (scripts/ilustracoes.mjs).
 */

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
  gray: "#b0aea5",
};

export const EXTRA_NAMES = [
  "coluna",
  "frontao",
  "janela",
  "porta",
  "cupula",
  "torre",
  "rosacea",
  "escada",
  "balaustre",
  "telhado",
  "sobrado",
  "azulejo",
  "cornija",
  "capitel",
  "arcada",
  "planta",
  "corte",
  "esquadro",
  "trena",
  "nivel",
  "prumo",
  "lupa",
  "mapa",
  "hachuras",
  "drone",
  "camera",
  "tablet",
  "andaime",
  "estrutura",
  "trelica",
  "fundacao",
  "tijolos",
  "umidade",
  "vegetacao",
  "checklist",
  "capacete",
  "guindaste",
  "igreja",
  "casario",
] as const;
export type ExtraName = (typeof EXTRA_NAMES)[number];

const S = { stroke: C.ink, strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const line = { ...S, fill: "none" } as const;
const solid = (fill: string) => ({ ...S, fill });
const bg = (fill: string) => <rect width="200" height="200" fill={fill} />;

export function ExtraArt({ name }: { name: ExtraName }) {
  switch (name) {
    case "coluna":
      return (
        <>
          {bg(C.oat)}
          <rect x="66" y="38" width="68" height="10" {...solid(C.ivory)} />
          <path d="M72 48h56l-8 12H80z" {...solid(C.ivory)} />
          <rect x="80" y="60" width="40" height="102" {...solid(C.ivory)} />
          {[88, 96, 104, 112].map((x) => (
            <path key={x} d={`M${x} 64v94`} {...line} strokeWidth={0.9} />
          ))}
          <rect x="74" y="162" width="52" height="8" {...solid(C.ivory)} />
          <rect x="66" y="170" width="68" height="10" {...solid(C.lilac)} />
          <path d="M28 180h144" {...line} />
        </>
      );
    case "frontao":
      return (
        <>
          {bg(C.sky)}
          <path d="M28 82L100 34l72 48z" {...solid(C.ivory)} />
          <path d="M52 76l48-30 48 30z" {...line} strokeWidth={0.9} />
          <circle cx="100" cy="64" r="7" fill={C.lilac} />
          <rect x="28" y="82" width="144" height="14" {...solid(C.ivory)} />
          {[44, 76, 108, 140].map((x) => (
            <rect key={x} x={x} y="96" width="16" height="74" {...solid(C.ivory)} />
          ))}
          <rect x="24" y="170" width="152" height="10" {...solid(C.ivory)} />
        </>
      );
    case "janela":
      return (
        <>
          {bg(C.cactus)}
          <rect x="44" y="36" width="24" height="128" fill={C.lilac} {...S} />
          <rect x="132" y="36" width="24" height="128" fill={C.lilac} {...S} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <g key={i}>
              <path d={`M44 ${46 + i * 15}h24`} {...line} strokeWidth={0.8} />
              <path d={`M132 ${46 + i * 15}h24`} {...line} strokeWidth={0.8} />
            </g>
          ))}
          <rect x="72" y="36" width="56" height="128" {...solid(C.ivory)} />
          <path d="M100 36v128M72 78h56M72 120h56" {...line} />
          <rect x="64" y="164" width="72" height="8" {...solid(C.ivory)} />
        </>
      );
    case "porta":
      return (
        <>
          {bg(C.coral)}
          <path d="M56 180V80a44 44 0 0188 0v100z" {...solid(C.ivory)} />
          <path d="M100 36v144" {...line} />
          {[0, 1].flatMap((c) =>
            [0, 1].map((r) => <rect key={`${c}${r}`} x={66 + c * 40} y={92 + r * 42} width="24" height="32" {...line} strokeWidth={1} />),
          )}
          <circle cx="94" cy="132" r="3" fill={C.ink} />
          <circle cx="106" cy="132" r="3" fill={C.ink} />
          <path d="M70 66a30 30 0 0160 0" fill={C.lilac} {...S} />
          <path d="M40 180h120" {...line} />
        </>
      );
    case "cupula":
      return (
        <>
          {bg(C.heather)}
          <path d="M44 120a56 56 0 01112 0z" {...solid(C.ivory)} />
          {[-36, -18, 0, 18, 36].map((dx) => (
            <path key={dx} d={`M${100 + dx * 0.15} 64 Q${100 + dx} 90 ${100 + dx * 1.45} 120`} {...line} strokeWidth={0.9} />
          ))}
          <rect x="88" y="44" width="24" height="20" {...solid(C.ivory)} />
          <path d="M88 44l12-12 12 12" {...solid(C.ivory)} />
          <rect x="40" y="120" width="120" height="50" {...solid(C.ivory)} />
          {[56, 84, 112, 140].map((x) => (
            <path key={x} d={`M${x - 6} 158v-16a6 6 0 0112 0v16z`} fill={C.lilac} {...S} />
          ))}
          <path d="M30 170h140" {...line} />
        </>
      );
    case "torre":
      return (
        <>
          {bg(C.sky)}
          <path d="M66 70L100 22l34 48z" fill={C.lilac} {...S} />
          <rect x="70" y="70" width="60" height="110" {...solid(C.ivory)} />
          <path d="M84 120v-26a16 16 0 0132 0v26z" {...solid(C.ink)} />
          <path d="M92 106a8 8 0 0116 0v6H92z" fill={C.oat} {...S} />
          <path d="M70 128h60M70 136h60" {...line} />
          <rect x="88" y="150" width="24" height="30" {...line} />
          <path d="M40 180h120" {...line} />
        </>
      );
    case "rosacea":
      return (
        <>
          {bg(C.lilac)}
          <circle cx="100" cy="100" r="74" {...solid(C.ivory)} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            return <circle key={i} cx={100 + 44 * Math.cos(a)} cy={100 + 44 * Math.sin(a)} r="20" fill={i % 2 ? C.sky : C.oat} {...S} />;
          })}
          <circle cx="100" cy="100" r="18" fill={C.lilac} {...S} />
          <circle cx="100" cy="100" r="74" {...line} strokeWidth={2} />
        </>
      );
    case "escada":
      return (
        <>
          {bg(C.oat)}
          <path d="M30 170h28v-20h28v-20h28v-20h28v-20h28v100H30z" {...solid(C.ivory)} />
          <path d="M44 132l120-80" {...line} strokeWidth={2} />
          {[44, 72, 100, 128, 156].map((x, i) => (
            <path key={x} d={`M${x} ${132 - i * 18.7}v${22 + 0}`} {...line} />
          ))}
          <rect x="146" y="70" width="24" height="20" fill={C.lilac} />
        </>
      );
    case "balaustre":
      return (
        <>
          {bg(C.cactus)}
          <rect x="24" y="54" width="152" height="12" {...solid(C.ivory)} />
          <rect x="24" y="150" width="152" height="12" {...solid(C.ivory)} />
          {[44, 72, 100, 128, 156].map((x) => (
            <path
              key={x}
              d={`M${x - 6} 66h12l-2 8c10 8 10 26 2 40l-2 14c4 4 4 12 0 16v6h-12v-6c-4-4-4-12 0-16l-2-14c-8-14-8-32 2-40z`}
              {...solid(C.ivory)}
            />
          ))}
          <path d="M20 176h160" {...line} />
          <rect x="24" y="162" width="152" height="6" fill={C.lilac} />
        </>
      );
    case "telhado":
      return (
        <>
          {bg(C.coral)}
          <path d="M20 120L100 50l80 70z" {...solid(C.ivory)} />
          {[66, 82, 98, 114].map((y, r) => {
            const half = (y - 50) * (80 / 70);
            const n = Math.max(2, Math.round(half / 9));
            return (
              <path
                key={y}
                d={Array.from({ length: n * 2 }).map((_, i) => `M${100 - half + i * (half / n)} ${y} a${half / n / 2} 5 0 0 0 ${half / n} 0`).join(" ")}
                {...line}
                strokeWidth={0.9}
                opacity={r % 2 ? 0.8 : 1}
              />
            );
          })}
          <rect x="130" y="56" width="16" height="30" fill={C.lilac} {...S} />
          <rect x="40" y="120" width="120" height="56" {...solid(C.ivory)} />
          <rect x="88" y="138" width="24" height="38" {...line} />
        </>
      );
    case "sobrado":
      return (
        <>
          {bg(C.olive)}
          <rect x="26" y="52" width="148" height="128" {...solid(C.ivory)} />
          <path d="M18 52h164l-8-14H26z" fill={C.oat} {...S} />
          <path d="M26 112h148" {...line} />
          {[42, 86, 130].map((x) => (
            <g key={x}>
              <rect x={x} y="66" width="28" height="36" {...line} />
              <path d={`M${x + 14} 66v36M${x - 4} 102h36`} {...line} strokeWidth={1} />
              <path d={`M${x} 180v-42a14 14 0 0128 0v42`} {...line} />
            </g>
          ))}
          <rect x="86" y="138" width="28" height="42" fill={C.lilac} opacity="0.85" />
        </>
      );
    case "azulejo":
      return (
        <>
          {bg(C.ivory)}
          {[0, 1].flatMap((r) =>
            [0, 1].map((c) => {
              const x = 20 + c * 82;
              const y = 20 + r * 82;
              const q = 16;
              return (
                <g key={`${r}${c}`}>
                  <rect x={x} y={y} width="78" height="78" fill={C.ivory} stroke={C.sky} strokeWidth="2" />
                  <circle cx={x + 39} cy={y + 39} r="16" fill="none" stroke={C.sky} strokeWidth="3" />
                  <circle cx={x + 39} cy={y + 39} r="5" fill={C.lilac} />
                  {/* quartos de círculo nos cantos: juntos, formam o desenho que continua de uma peça para outra */}
                  <path
                    d={`M${x + q} ${y}A${q} ${q} 0 0 1 ${x} ${y + q}M${x + 78 - q} ${y}A${q} ${q} 0 0 0 ${x + 78} ${y + q}M${x} ${y + 78 - q}A${q} ${q} 0 0 1 ${x + q} ${y + 78}M${x + 78} ${y + 78 - q}A${q} ${q} 0 0 0 ${x + 78 - q} ${y + 78}`}
                    fill="none"
                    stroke={C.sky}
                    strokeWidth="3"
                  />
                  <path d={`M${x + 39} ${y + 8}v12M${x + 39} ${y + 58}v12M${x + 8} ${y + 39}h12M${x + 58} ${y + 39}h12`} stroke={C.sky} strokeWidth="3" strokeLinecap="round" />
                </g>
              );
            }),
          )}
        </>
      );
    case "cornija":
      return (
        <>
          {bg(C.sand)}
          <path d="M20 40h160v14H20zM20 54h150v10H20z" {...solid(C.ivory)} />
          <path d="M20 64h140c0 14 -10 22 -24 22H20z" {...solid(C.ivory)} />
          <path d="M20 86h116v10H20z" {...solid(C.ivory)} />
          {Array.from({ length: 10 }).map((_, i) => (
            <rect key={i} x={24 + i * 13} y="96" width="7" height="10" {...solid(C.ivory)} />
          ))}
          <path d="M20 106h104v8H20z" {...solid(C.ivory)} />
          <rect x="20" y="114" width="96" height="66" fill={C.lilac} />
          <path d="M20 40v140" {...line} strokeDasharray="4 4" />
        </>
      );
    case "capitel":
      return (
        <>
          {bg(C.heather)}
          <rect x="34" y="52" width="132" height="12" {...solid(C.ivory)} />
          <path d="M40 64h120c0 14-10 20-20 20H60c-10 0-20-6-20-20z" {...solid(C.ivory)} />
          {[56, 144].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="86" r="22" {...solid(C.ivory)} />
              <circle cx={cx} cy="86" r="14" {...line} />
              <circle cx={cx} cy="86" r="7" {...line} />
              <circle cx={cx} cy="86" r="2.5" fill={C.lilac} />
            </g>
          ))}
          <rect x="72" y="104" width="56" height="76" {...solid(C.ivory)} />
          {[82, 92, 100, 108, 118].map((x) => (
            <path key={x} d={`M${x} 110v70`} {...line} strokeWidth={0.8} />
          ))}
        </>
      );
    case "arcada":
      return (
        <>
          {bg(C.oat)}
          <rect x="16" y="56" width="168" height="124" {...solid(C.ivory)} />
          {[28, 80, 132].map((x) => (
            <path key={x} d={`M${x} 180v-66a20 20 0 0140 0v66z`} fill={C.lilac} opacity="0.9" {...S} />
          ))}
          <path d="M16 56h168M16 66h168" {...line} />
          <path d="M8 180h184" {...line} />
        </>
      );
    case "planta":
      return (
        <>
          {bg(C.ivory)}
          <rect x="30" y="30" width="140" height="140" fill={C.sand} />
          <rect x="100" y="100" width="66" height="66" fill={C.lilac} opacity="0.55" />
          <path d="M30 30h140v140H30z" fill="none" stroke={C.ink} strokeWidth="6" />
          <path d="M100 30v54M100 112v58M30 100h40M100 100h70" stroke={C.ink} strokeWidth="5" />
          <path d="M70 100a30 30 0 0030 -30" {...line} strokeDasharray="3 3" />
          <path d="M100 84a28 28 0 0128 28" {...line} strokeDasharray="3 3" />
          <path d="M130 30v-6M150 30v-6" stroke={C.ivory} strokeWidth="6" />
        </>
      );
    case "corte":
      return (
        <>
          {bg(C.sky)}
          <path d="M40 160V80l60-40 60 40v80z" {...solid(C.ivory)} />
          <path d="M40 120h120M40 160h120" {...line} strokeWidth={2.4} />
          <rect x="60" y="130" width="22" height="30" fill={C.lilac} />
          <rect x="118" y="88" width="22" height="22" {...line} />
          <path d="M28 80v80M24 80h8M24 120h8M24 160h8" {...line} />
          <path d="M40 176h120M40 172v8M100 172v8M160 172v8" {...line} />
          <circle cx="28" cy="100" r="2" fill={C.ink} />
          <circle cx="28" cy="140" r="2" fill={C.ink} />
        </>
      );
    case "esquadro":
      return (
        <>
          {bg(C.lilac)}
          <path d="M34 166V46l120 120z" {...solid(C.ivory)} />
          <path d="M54 146V94l52 52z" fill={C.lilac} {...S} />
          {Array.from({ length: 11 }).map((_, i) => (
            <path key={i} d={`M34 ${56 + i * 10}h${i % 5 === 0 ? 10 : 6}`} {...line} strokeWidth={1} />
          ))}
          <path d="M150 34l-30 112M150 34l20 112" {...line} strokeWidth={2} />
          <circle cx="150" cy="34" r="6" {...solid(C.oat)} />
        </>
      );
    case "trena":
      return (
        <>
          {bg(C.olive)}
          <rect x="34" y="66" width="76" height="76" rx="18" {...solid(C.oat)} />
          <circle cx="72" cy="104" r="20" {...solid(C.ivory)} />
          <circle cx="72" cy="104" r="6" fill={C.lilac} />
          <rect x="108" y="122" width="72" height="16" {...solid(C.ivory)} />
          {Array.from({ length: 14 }).map((_, i) => (
            <path key={i} d={`M${112 + i * 5} 122v${i % 5 === 0 ? 9 : 5}`} {...line} strokeWidth={0.9} />
          ))}
          <path d="M180 118v24" {...line} strokeWidth={2.4} />
        </>
      );
    case "nivel":
      return (
        <>
          {bg(C.cactus)}
          <rect x="20" y="84" width="160" height="32" rx="4" {...solid(C.ivory)} />
          <rect x="78" y="90" width="44" height="20" rx="10" {...solid(C.oat)} />
          <ellipse cx="102" cy="100" rx="8" ry="6" fill={C.lilac} />
          <path d="M92 90v20M112 90v20" {...line} />
          <rect x="34" y="94" width="12" height="12" rx="6" fill={C.sky} {...S} />
          <rect x="154" y="94" width="12" height="12" rx="6" fill={C.sky} {...S} />
        </>
      );
    case "prumo":
      return (
        <>
          {bg(C.coral)}
          <path d="M60 20h80" {...line} strokeWidth={2.4} />
          <path d="M100 20v110" {...line} />
          <path d="M100 130l-16 8 16 44 16-44z" fill={C.ink} />
          <rect x="92" y="122" width="16" height="10" fill={C.lilac} {...S} />
          <path d="M140 30v150" {...line} strokeDasharray="4 5" />
          <rect x="150" y="40" width="30" height="140" fill={C.ivory} {...S} />
        </>
      );
    case "lupa":
      return (
        <>
          {bg(C.oat)}
          <path d="M20 40l20 30-8 18 18 22-6 20 18 24" {...line} strokeWidth={1.6} />
          <circle cx="96" cy="88" r="50" {...solid(C.ivory)} />
          <path d="M66 50l14 22-6 14 14 18-4 16 12 18" {...line} strokeWidth={3} />
          <path d="M132 124l40 40" stroke={C.ink} strokeWidth="12" strokeLinecap="round" />
          <circle cx="96" cy="88" r="50" fill="none" stroke={C.lilac} strokeWidth="8" />
        </>
      );
    case "mapa":
      return (
        <>
          {bg(C.sand)}
          <rect x="24" y="30" width="152" height="120" {...solid(C.ivory)} />
          {[44, 92, 140].map((x) => (
            <rect key={x} x={x} y="48" width="20" height="30" {...line} />
          ))}
          <path d="M34 140c10-20 30-24 40-14s20 6 22 14z" fill={C.sky} opacity="0.75" {...S} />
          <path d="M120 96c12-6 30-2 36 10s-6 26-20 22-26-24-16-32z" fill={C.lilac} opacity="0.8" {...S} />
          <path d="M70 40l6 14-4 10 8 12" {...line} stroke={C.fig} strokeWidth={2} />
          <path d="M140 140h30" stroke={C.olive} strokeWidth="6" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={24 + i * 52} y="164" width="10" height="10" fill={[C.sky, C.lilac, C.fig][i]} />
              <rect x={38 + i * 52} y="167" width="30" height="4" fill={C.gray} />
            </g>
          ))}
        </>
      );
    case "hachuras": {
      const box = (x: number, y: number, kind: number, frame: string) => {
        const lines: string[] = [];
        for (let i = 0; i <= 12; i++) {
          const t = i * 6.5;
          if (kind === 0) lines.push(`M${x} ${y + t}L${x + t} ${y}M${x + t} ${y + 78}L${x + 78} ${y + t}`);
          if (kind === 1) lines.push(`M${x} ${y + t}h78M${x + t} ${y}v78`);
          if (kind === 3) lines.push(`M${x} ${y + t}h78`);
        }
        return (
          <g key={`${x}${y}`}>
            <rect x={x} y={y} width="78" height="78" fill={C.ivory} />
            {kind === 2 ? (
              Array.from({ length: 49 }).map((_, i) => <circle key={i} cx={x + 6 + (i % 7) * 11} cy={y + 6 + Math.floor(i / 7) * 11} r="1.8" fill={C.ink} />)
            ) : (
              <path d={lines.join("")} stroke={C.ink} strokeWidth="0.9" />
            )}
            <rect x={x} y={y} width="78" height="78" fill="none" stroke={frame} strokeWidth="5" />
          </g>
        );
      };
      return (
        <>
          {bg(C.ivory)}
          {box(18, 18, 0, C.lilac)}
          {box(104, 18, 1, C.sky)}
          {box(18, 104, 2, C.olive)}
          {box(104, 104, 3, C.fig)}
        </>
      );
    }
    case "drone":
      return (
        <>
          {bg(C.sky)}
          {[
            [56, 56],
            [144, 56],
            [56, 144],
            [144, 144],
          ].map(([x, y], i) => (
            <g key={i}>
              <path d={`M100 100L${x} ${y}`} stroke={C.ink} strokeWidth="6" strokeLinecap="round" />
              <circle cx={x} cy={y} r="24" fill={C.ivory} fillOpacity="0.55" {...S} />
              <path d={`M${x - 18} ${y}h36`} {...line} />
            </g>
          ))}
          <rect x="82" y="82" width="36" height="36" rx="8" {...solid(C.ivory)} />
          <circle cx="100" cy="100" r="8" fill={C.lilac} {...S} />
        </>
      );
    case "camera":
      return (
        <>
          {bg(C.heather)}
          <path d="M70 62l8-14h44l8 14z" {...solid(C.ivory)} />
          <rect x="30" y="62" width="140" height="90" rx="10" {...solid(C.ivory)} />
          <circle cx="100" cy="106" r="32" {...solid(C.ink)} />
          <circle cx="100" cy="106" r="20" fill={C.lilac} {...S} />
          <circle cx="94" cy="100" r="5" fill={C.ivory} opacity="0.8" />
          <rect x="140" y="72" width="18" height="10" fill={C.oat} {...S} />
        </>
      );
    case "tablet":
      return (
        <>
          {bg(C.olive)}
          <rect x="40" y="24" width="120" height="152" rx="12" {...solid(C.ink)} />
          <rect x="48" y="34" width="104" height="132" {...solid(C.ivory)} />
          <rect x="60" y="56" width="80" height="96" {...line} />
          <path d="M60 88h80M60 120h80" {...line} strokeWidth={0.9} />
          {[70, 94, 118].map((x) => (
            <rect key={x} x={x} y="64" width="12" height="16" {...line} strokeWidth={1} />
          ))}
          <path d="M66 148c6-14 22-16 30-8s14 4 14 8z" fill={C.lilac} opacity="0.85" {...S} />
          <circle cx="100" cy="171" r="2.5" fill={C.ivory} />
        </>
      );
    case "andaime":
      return (
        <>
          {bg(C.oat)}
          <rect x="120" y="20" width="60" height="160" fill={C.ivory} />
          {[30, 70, 110].map((x) => (
            <path key={x} d={`M${x} 180V24`} stroke={C.ink} strokeWidth="3" />
          ))}
          {[60, 100, 140].map((y) => (
            <g key={y}>
              <rect x="26" y={y - 4} width="88" height="8" fill={C.lilac} {...S} />
              <path d={`M30 ${y + 40}L70 ${y}M70 ${y + 40}L110 ${y}`} {...line} />
            </g>
          ))}
          <path d="M14 180h172" {...line} />
        </>
      );
    case "estrutura":
      return (
        <>
          {bg(C.sand)}
          <rect x="40" y="64" width="16" height="104" {...solid(C.gray)} />
          <rect x="144" y="64" width="16" height="104" {...solid(C.gray)} />
          <rect x="32" y="48" width="136" height="18" {...solid(C.ivory)} />
          <path d="M36 168h28M136 168h28" {...line} strokeWidth={2} />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${68 + i * 16} 24v18M${64 + i * 16} 38l4 4 4-4`} {...line} stroke={C.lilac} strokeWidth={2} />
          ))}
          <path d="M40 186h120M40 182v8M160 182v8" {...line} />
        </>
      );
    case "trelica":
      return (
        <>
          {bg(C.heather)}
          <path d="M20 140h160L100 60z" fill={C.ivory} fillOpacity="0.6" {...S} strokeWidth={3} />
          {[0, 1, 2, 3, 4].map((i) => {
            const x = 20 + (i + 1) * 26.7;
            const yTop = x < 100 ? 140 - (x - 20) : 140 - (180 - x);
            return <path key={i} d={`M${x} 140V${yTop}`} {...line} strokeWidth={2} />;
          })}
          <path d="M46.7 140L73.3 113.3M73.3 140L100 60M126.7 140L100 60M153.3 140L126.7 113.3" {...line} strokeWidth={2} />
          <path d="M20 140l-8 16h16zM180 140l-8 16h16z" fill={C.lilac} {...S} />
        </>
      );
    case "fundacao":
      return (
        <>
          {bg(C.coral)}
          <rect x="40" y="40" width="120" height="50" {...solid(C.ivory)} />
          <rect x="30" y="90" width="140" height="14" {...solid(C.gray)} />
          <rect x="0" y="104" width="200" height="96" fill={C.oat} />
          {Array.from({ length: 12 }).map((_, i) => (
            <path key={i} d={`M${i * 18} 200l40 -96`} stroke={C.ink} strokeWidth="0.6" opacity="0.4" />
          ))}
          {[48, 96, 144].map((x) => (
            <rect key={x} x={x - 6} y="104" width="12" height="78" fill={C.lilac} {...S} />
          ))}
          <path d="M0 104h200" {...line} />
        </>
      );
    case "tijolos":
      return (
        <>
          {bg(C.oat)}
          {Array.from({ length: 9 }).flatMap((_, r) =>
            Array.from({ length: 6 }).map((_, c) => {
              const x = c * 40 - (r % 2 ? 20 : 0);
              const y = 12 + r * 20;
              const missing = (r === 3 && (c === 2 || c === 3)) || (r === 4 && c === 3) || (r === 5 && c === 2);
              return missing ? null : <rect key={`${r}${c}`} x={x + 2} y={y} width="36" height="16" fill={r % 3 === 0 && c % 2 ? C.lilac : C.ivory} {...S} strokeWidth={1} />;
            }),
          )}
        </>
      );
    case "umidade":
      return (
        <>
          {bg(C.sky)}
          <rect x="30" y="30" width="140" height="150" {...solid(C.ivory)} />
          <path d="M30 180v-46c18 8 30-10 48-4s26 18 44 8 34-6 48 2v40z" fill={C.lilac} opacity="0.75" />
          <path d="M30 134c18 8 30-10 48-4s26 18 44 8 34-6 48 2" {...line} strokeDasharray="4 3" />
          {[
            [70, 56],
            [100, 72],
            [130, 50],
          ].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y}c-6 10-8 14-8 18a8 8 0 0016 0c0-4-2-8-8-18z`} fill={C.sky} {...S} />
          ))}
        </>
      );
    case "vegetacao":
      return (
        <>
          {bg(C.ivory)}
          <rect x="0" y="0" width="200" height="200" fill={C.sand} />
          <path d="M60 20l10 30-8 20 14 26-6 24 12 30" {...line} strokeWidth={1.8} />
          <path d="M72 96c20-20 44-24 60-16" {...line} stroke={C.olive} strokeWidth={3} />
          {[
            [92, 84, -30],
            [112, 78, 10],
            [128, 82, 40],
            [100, 98, 60],
          ].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx="16" ry="8" transform={`rotate(${r} ${x} ${y})`} fill={C.olive} {...S} />
          ))}
          <path d="M66 120c-18-6-30 0-38 10" {...line} stroke={C.olive} strokeWidth={3} />
          <ellipse cx="40" cy="124" rx="12" ry="6" transform="rotate(-20 40 124)" fill={C.olive} {...S} />
        </>
      );
    case "checklist":
      return (
        <>
          {bg(C.cactus)}
          <rect x="44" y="30" width="112" height="148" rx="6" {...solid(C.ivory)} />
          <rect x="78" y="22" width="44" height="16" rx="4" fill={C.lilac} {...S} />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x="60" y={58 + i * 28} width="14" height="14" fill="none" {...S} />
              {i < 3 && <path d={`M62 ${65 + i * 28}l4 4 8-9`} {...line} strokeWidth={2} />}
              <rect x="82" y={62 + i * 28} width={60 - i * 8} height="6" fill={C.gray} />
            </g>
          ))}
        </>
      );
    case "capacete":
      return (
        <>
          {bg(C.lilac)}
          <path d="M44 126a56 56 0 01112 0z" {...solid(C.ivory)} />
          <path d="M100 70v56M84 74l6 52M116 74l-6 52" {...line} />
          <rect x="30" y="126" width="140" height="14" rx="7" {...solid(C.ivory)} />
          <path d="M60 140c0 20 80 20 80 0" {...line} strokeDasharray="4 4" />
        </>
      );
    case "guindaste":
      return (
        <>
          {bg(C.sky)}
          <path d="M70 180V40h16v140" {...solid(C.ivory)} />
          {[56, 80, 104, 128, 152].map((y) => (
            <path key={y} d={`M70 ${y}l16 ${16}`} {...line} strokeWidth={1} />
          ))}
          <path d="M30 40h150v10H30z" {...solid(C.ivory)} />
          <rect x="30" y="50" width="22" height="18" fill={C.ink} />
          <path d="M78 40L78 20M78 20L30 40M78 20L180 40" {...line} />
          <path d="M150 50v60" {...line} />
          <path d="M144 110h12l-6 10z" fill={C.ink} />
          <rect x="136" y="124" width="28" height="20" fill={C.lilac} {...S} />
          <path d="M40 180h120" {...line} />
        </>
      );
    case "igreja":
      return (
        <>
          {bg(C.olive)}
          <path d="M40 180V100l40-30 40 30v80z" {...solid(C.ivory)} />
          <rect x="120" y="60" width="40" height="120" {...solid(C.ivory)} />
          <path d="M120 60l20-30 20 30z" fill={C.oat} {...S} />
          <path d="M140 30v-14M134 22h12" {...line} strokeWidth={2} />
          <path d="M70 180v-34a10 10 0 0120 0v34z" fill={C.lilac} {...S} />
          <circle cx="80" cy="110" r="10" {...line} />
          <path d="M132 100v-14a8 8 0 0116 0v14z" {...line} />
          <path d="M20 180h160" {...line} />
        </>
      );
    case "casario":
      return (
        <>
          {bg(C.coral)}
          {[
            [10, 80, C.ivory],
            [56, 64, C.oat],
            [102, 88, C.ivory],
            [148, 72, C.heather],
          ].map(([x, y, fill], i) => (
            <g key={i}>
              <rect x={x as number} y={y as number} width="46" height={180 - (y as number)} fill={fill as string} {...S} />
              <path d={`M${(x as number) - 2} ${y}h50`} {...line} strokeWidth={2.4} />
              <rect x={(x as number) + 8} y={(y as number) + 14} width="10" height="16" {...line} strokeWidth={1} />
              <rect x={(x as number) + 28} y={(y as number) + 14} width="10" height="16" {...line} strokeWidth={1} />
              <path d={`M${(x as number) + 16} 180v-22a7 7 0 0114 0v22`} fill={i === 1 ? C.lilac : "none"} {...S} />
            </g>
          ))}
          <path d="M0 180h200" {...line} />
        </>
      );
  }
}
