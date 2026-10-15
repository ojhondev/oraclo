import type { CaseDamage } from "@/lib/site/carmo";

/**
 * Vista com os danos desenhados por cima, como no editor do ArchRay. Pontos em pixels da imagem
 * original (`w` × `h`); a imagem pode estar em outra resolução porque o SVG usa o viewBox original.
 */
export function DamageMap({
  src,
  w,
  h,
  damages,
  alt,
  className,
  labels = true,
}: {
  src: string;
  w: number;
  h: number;
  damages: CaseDamage[];
  alt: string;
  className?: string;
  labels?: boolean;
}) {
  const u = w / 900; // 1 "pixel de tela" num quadro de ~900 px
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} role="img" aria-label={alt}>
      <image href={src} x={0} y={0} width={w} height={h} preserveAspectRatio="none" />
      {damages.map((d, i) =>
        d.geometry === "area" ? (
          <polygon
            key={i}
            className="dm-shape"
            pathLength={1}
            style={{ "--i": i } as React.CSSProperties}
            points={d.points.map((p) => p.join(",")).join(" ")}
            fill={d.color}
            fillOpacity={0.38}
            stroke={d.color}
            strokeWidth={2.2 * u}
            strokeLinejoin="round"
          />
        ) : d.geometry === "ponto" ? (
          <g key={i} className="dm-dot" style={{ "--i": i } as React.CSSProperties}>
            <circle cx={d.points[0]![0]} cy={d.points[0]![1]} r={9 * u} fill={d.color} stroke="#fff" strokeWidth={2 * u} />
          </g>
        ) : null,
      )}
      {labels &&
        damages.map((d, i) => {
          const [x, y] = centroid(d.points);
          const label = d.code;
          return (
            <g key={`l${i}`} transform={`translate(${x} ${y})`}>
              <g className="dm-label" style={{ "--i": i } as React.CSSProperties}>
              <rect x={-17 * u} y={d.geometry === "ponto" ? -32 * u : -10 * u} width={34 * u} height={20 * u} rx={10 * u} fill="#0a0a0a" fillOpacity={0.82} />
              <text
                y={d.geometry === "ponto" ? -18 * u : 4 * u}
                textAnchor="middle"
                fontSize={11 * u}
                fontWeight={600}
                fill="#fff"
                fontFamily="var(--font-geist), sans-serif"
              >
                {label}
              </text>
              </g>
            </g>
          );
        })}
    </svg>
  );
}

function centroid(points: [number, number][]): [number, number] {
  if (points.length < 3) return points[0] ?? [0, 0];
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]!;
    const [x2, y2] = points[(i + 1) % points.length]!;
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  return a ? [cx / (3 * a), cy / (3 * a)] : points[0]!;
}
