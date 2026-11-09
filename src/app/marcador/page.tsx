import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MARKER_SVG, SCALE_BAR, SCALE_MARKER } from "@/lib/scale-marker";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Marcador de escala" };

// o SVG tem 10 módulos e o quadrado preto ocupa 8: a caixa precisa de 10/8 do lado real
const box = (sideMm: number) => (sideMm * 10) / 8;
const PAGE_H = 297;

function Marker({ id, sideMm, topMm }: { id: number; sideMm: number; topMm: number }) {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2"
      style={{ top: `${topMm}mm`, width: `${box(sideMm)}mm`, height: `${box(sideMm)}mm` }}
      dangerouslySetInnerHTML={{ __html: MARKER_SVG[id]!.replace("<svg ", '<svg width="100%" height="100%" shape-rendering="crispEdges" ') }}
    />
  );
}

/** Régua de 10 cm para conferir se a impressora não reduziu a página. */
function Ruler() {
  return (
    <div className="relative h-[8mm] w-[100mm] border-x-[0.4mm] border-b-[0.4mm] border-black">
      {Array.from({ length: 11 }, (_, k) => (
        <span key={k} className="absolute bottom-0 w-[0.3mm] bg-black" style={{ left: `${k * 10}mm`, height: k % 5 === 0 ? "6mm" : "3.5mm", transform: "translateX(-50%)" }} />
      ))}
    </div>
  );
}

const Sheet = ({ children }: { children: React.ReactNode }) => (
  <div className="relative mx-auto mb-6 h-[297mm] w-[210mm] overflow-hidden bg-white text-black shadow-sm break-after-page print:mb-0 print:shadow-none">{children}</div>
);

/**
 * Marcadores de escala para imprimir em tamanho real. Presos à fachada durante a gravação, deixam o
 * motor calcular a escala sozinho. As medidas vêm de src/lib/scale-marker.ts (as mesmas do motor).
 */
export default async function MarkerPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const bar = (await searchParams).tipo === "barra";
  const folhaBox = box(SCALE_MARKER.sideMm);
  const c1 = PAGE_H / 2 - SCALE_MARKER.gapMm / 2;
  const c2 = PAGE_H / 2 + SCALE_MARKER.gapMm / 2;
  const barBox = box(SCALE_BAR.sideMm);
  const barTop = 20;

  return (
    <div className="min-h-dvh bg-muted py-6 print:bg-white print:p-0">
      <style>{`@page { size: A4; margin: 0 } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact } }`}</style>

      <div className="mx-auto mb-5 grid max-w-[210mm] gap-3 px-4 text-[14px] print:hidden">
        <h1 className="text-[22px] font-semibold">Marcador de escala ArchRay</h1>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-background p-1 text-[13.5px]">
          <Link href="/marcador" className={cn("rounded-md px-3 py-2 text-center", !bar && "bg-foreground text-background")}>
            Folha única · fachadas pequenas
          </Link>
          <Link href="/marcador?tipo=barra" className={cn("rounded-md px-3 py-2 text-center", bar && "bg-foreground text-background")}>
            Barra de 1 m · fachadas grandes
          </Link>
        </div>
        <ol className="grid list-decimal gap-1 pl-5 text-muted-foreground">
          <li>
            Imprima em <b className="text-foreground">tamanho real (100%)</b>, sem &quot;ajustar à página&quot;. Papel A4 branco, de preferência fosco.
          </li>
          <li>
            Confira com uma trena: a régua impressa deve medir <b className="text-foreground">10 cm</b>. Se não medir, a escala sai errada.
          </li>
          {bar ? (
            <li>
              Cole as <b className="text-foreground">duas folhas lado a lado</b> na parede, na mesma altura (cintura ou peito), com as setas a{" "}
              <b className="text-foreground">exatamente 1,00 m</b> uma da outra, medindo com trena de seta a seta. Um sarrafo ou régua de alumínio de 1 m também serve de base.
            </li>
          ) : (
            <li>
              Prenda a folha lisa num trecho plano da fachada, <b className="text-foreground">na altura da cintura ou do peito</b> (não rente ao chão).
            </li>
          )}
          <li>
            <b className="text-foreground">Comece a gravação perto do marcador</b> ({bar ? "até uns 8 m" : "a 2 ou 3 m"}), passando por ele de ângulos diferentes; depois siga
            o roteiro normal. Ele precisa aparecer nítido em vários quadros. Evite sol batendo direto no papel.
          </li>
        </ol>
        <PrintButton />
      </div>

      {bar ? (
        SCALE_BAR.ids.map((id, i) => (
          <Sheet key={id}>
            <Marker id={id} sideMm={SCALE_BAR.sideMm} topMm={barTop} />
            {/* setas de centro: a distância de 1,00 m é medida entre elas */}
            {[barTop - 9, barTop + barBox + 1].map((t, k) => (
              <span key={k} className="absolute left-1/2 -translate-x-1/2 text-[22pt] leading-none" style={{ top: `${t}mm` }}>
                {k === 0 ? "▼" : "▲"}
              </span>
            ))}
            <div className="absolute inset-x-0 grid justify-items-center gap-[2mm] text-center" style={{ top: `${barTop + barBox + 14}mm` }}>
              <p className="text-[12pt] font-semibold tracking-wide">ARCHRAY · BARRA DE ESCALA · FOLHA {i + 1} DE 2</p>
              <Ruler />
              <p className="max-w-[170mm] text-[9pt]">
                Esta régua deve medir 10 cm. Cole esta folha e a outra na mesma altura, com as setas a exatamente 1,00 m uma da outra. Quadrado de {SCALE_BAR.sideMm / 10} cm.
              </p>
            </div>
          </Sheet>
        ))
      ) : (
        <Sheet>
          <Marker id={SCALE_MARKER.ids[0]} sideMm={SCALE_MARKER.sideMm} topMm={c1 - folhaBox / 2} />
          <Marker id={SCALE_MARKER.ids[1]} sideMm={SCALE_MARKER.sideMm} topMm={c2 - folhaBox / 2} />
          <div className="absolute inset-x-0 grid justify-items-center gap-[2mm]" style={{ top: `${c1 + folhaBox / 2 + 4}mm` }}>
            <p className="text-[11pt] font-semibold tracking-wide">ARCHRAY · MARCADOR DE ESCALA</p>
            <Ruler />
            <p className="text-[8.5pt]">
              Esta régua deve medir 10 cm. Quadrados de {SCALE_MARKER.sideMm / 10} cm · centros a {SCALE_MARKER.gapMm / 10} cm.
            </p>
            <p className="text-[8.5pt]">Prenda lisa na fachada, na altura da cintura, e deixe aparecer em vários quadros.</p>
          </div>
        </Sheet>
      )}
    </div>
  );
}
