import { cn } from "@/lib/utils";

/**
 * Marca do Oraclo: um arco (portal de igreja) desenhado só com pontos —
 * o patrimônio visto como nuvem de pontos.
 */
export function BrandMark({ className }: { className?: string }) {
  const dots: [number, number][] = [];
  // pilares
  for (let y = 38; y >= 18; y -= 5) {
    dots.push([4, y], [32, y]);
  }
  // arco semicircular
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI - (i * Math.PI) / 8;
    dots.push([18 + 14 * Math.cos(a), 18 - 14 * Math.sin(a)]);
  }
  return (
    <svg viewBox="0 0 36 42" aria-hidden className={cn("h-6 w-auto", className)}>
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r="2.3" fill="var(--brand)" />
      ))}
      <circle cx="18" cy="30" r="3.2" fill="currentColor" />
    </svg>
  );
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className="h-7" />
      <span className="text-[22px] font-medium leading-none tracking-tight">Oraclo</span>
    </span>
  );
}
