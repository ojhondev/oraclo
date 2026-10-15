import { Hand, Maximize, Ruler, Search, WandSparkles, ZoomIn } from "lucide-react";
import { CARMO } from "@/lib/site/carmo";
import { fmtBRL } from "@/lib/pricing";
import { DamageMap } from "./damage-map";

/**
 * Recorte do editor de danos montado com os dados reais do case Carmo da Horta
 * (mesma vista, mesmos polígonos e valores que estão na plataforma).
 */
export function ProductShot() {
  const v = CARMO.convento;
  const subtotal = v.damages.reduce((s, d) => s + d.costCents, 0);
  const area = v.damages.reduce((s, d) => s + (d.areaM2 ?? 0), 0);
  const byType = new Map<string, { name: string; color: string; n: number; cost: number; area: number }>();
  for (const d of v.damages) {
    const r = byType.get(d.code) ?? { name: d.name, color: d.color, n: 0, cost: 0, area: 0 };
    r.n++;
    r.cost += d.costCents;
    r.area += d.areaM2 ?? 0;
    byType.set(d.code, r);
  }
  const library = ["Umidade ascendente", "Desagregação do reboco", "Perda de reboco", "Sujidade / crosta negra", "Biodeterioração", "Vegetação parasita", "Vidro quebrado / ausente", "Fissura"];

  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]">
      {/* barra da janela */}
      <div className="flex items-center gap-3 border-b px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[11px] text-muted-foreground">Igreja e Convento do Carmo · mapa de danos</p>
          <p className="truncate text-[13px] font-medium">Convento — fachada do pátio (2010)</p>
        </div>
        <span className="ml-auto hidden items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] sm:inline-flex">
          <Ruler className="size-3" /> 4,0 mm/px
        </span>
        <span className="hidden rounded-full bg-foreground px-2.5 py-1 text-[11.5px] font-medium text-background sm:inline-flex">Prancha PDF</span>
      </div>
      <div className="grid lg:grid-cols-[200px_1fr_260px]">
        {/* biblioteca */}
        <aside className="hidden border-r bg-muted/40 p-3 lg:block">
          <div className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-[12px] text-muted-foreground">
            <Search className="size-3" /> Buscar dano
          </div>
          <p className="mt-3 px-1 text-[10.5px] font-medium text-muted-foreground">Biblioteca de danos</p>
          <ul className="mt-1 grid gap-0.5 text-[12px]">
            {library.map((n, i) => (
              <li key={n} className={i === 4 ? "rounded-md bg-background px-2 py-1 font-medium ring-1 ring-foreground/10" : "px-2 py-1"}>
                {n}
              </li>
            ))}
          </ul>
        </aside>
        {/* tela */}
        <div className="relative bg-[#1a1a1a]">
          <DamageMap src={v.src} w={v.w} h={v.h} damages={v.damages} alt="Fachada do convento com os danos contornados" className="block h-auto w-full" />
          <div className="absolute top-2.5 left-2.5 flex items-center gap-0.5 rounded-lg bg-black/60 p-1 text-white backdrop-blur" aria-hidden>
            {[Hand, ZoomIn, Maximize].map((I, i) => (
              <span key={i} className="grid size-7 place-items-center rounded-md">
                <I className="size-3.5" />
              </span>
            ))}
            <span className="grid size-7 place-items-center rounded-md bg-white/20">
              <WandSparkles className="size-3.5" />
            </span>
          </div>
          <p className="absolute right-2.5 bottom-2.5 left-2.5 hidden justify-center sm:flex" aria-hidden>
            <span className="rounded-full bg-black/65 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
              Biodeterioração: clique sobre a mancha para contornar
            </span>
          </p>
        </div>
        {/* painel */}
        <aside className="border-t p-4 lg:border-t-0 lg:border-l">
          <div className="rounded-xl border p-3">
            <p className="text-[10.5px] font-medium text-muted-foreground">Orçamento estimado</p>
            <p className="mt-0.5 text-[22px] font-medium tracking-[-0.01em] tabular-nums">{fmtBRL(subtotal)}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2 text-[11px]">
              <div>
                <p className="text-muted-foreground">Área afetada</p>
                <p className="text-[13px] font-medium tabular-nums">{area.toFixed(2).replace(".", ",")} m²</p>
              </div>
              <div>
                <p className="text-muted-foreground">Danos</p>
                <p className="text-[13px] font-medium tabular-nums">{v.damages.length}</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[10.5px] font-medium text-muted-foreground">Quantitativos</p>
          <ul className="mt-1.5 grid gap-1 text-[12px]">
            {[...byType.values()].map((r) => (
              <li key={r.name} className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: r.color }} />
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <span className="text-muted-foreground tabular-nums">{r.area ? `${r.area.toFixed(2).replace(".", ",")} m²` : `${r.n} un.`}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
