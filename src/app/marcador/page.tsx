import type { Metadata } from "next";
import { MARKER_SVG, SCALE_MARKER } from "@/lib/scale-marker";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Marcador de escala" };

// o SVG tem 10 módulos e o quadrado preto ocupa 8: a caixa precisa de 10/8 do lado real
const BOX_MM = (SCALE_MARKER.sideMm * 10) / 8;
const PAGE_H = 297;
const top = (center: number) => center - BOX_MM / 2;
const C1 = PAGE_H / 2 - SCALE_MARKER.gapMm / 2;
const C2 = PAGE_H / 2 + SCALE_MARKER.gapMm / 2;

/**
 * Folha A4 para imprimir em tamanho real. Presa à fachada durante a gravação, deixa o motor
 * calcular a escala sozinho. As medidas vêm de src/lib/scale-marker.ts (as mesmas do motor).
 */
export default function MarkerPage() {
  return (
    <div className="min-h-dvh bg-muted py-6 print:bg-white print:p-0">
      <style>{`@page { size: A4; margin: 0 } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact } }`}</style>

      <div className="mx-auto mb-5 grid max-w-[210mm] gap-3 px-4 text-[14px] print:hidden">
        <h1 className="text-[22px] font-semibold">Marcador de escala ArchRay</h1>
        <ol className="grid list-decimal gap-1 pl-5 text-muted-foreground">
          <li>
            Imprima em <b className="text-foreground">tamanho real (100%)</b>, sem &quot;ajustar à página&quot;. Papel A4 branco, de preferência fosco.
          </li>
          <li>
            Confira com uma trena: a régua do meio da folha deve medir <b className="text-foreground">10 cm</b>. Se não medir, a escala sai errada.
          </li>
          <li>Prenda a folha na parede, perto da base da fachada, bem lisa (sem dobra). Também pode apoiar no chão, encostada na parede.</li>
          <li>Grave normalmente: o marcador precisa aparecer nítido em vários quadros, de ângulos diferentes. O ArchRay calcula a escala sozinho.</li>
        </ol>
        <PrintButton />
      </div>

      <div className="relative mx-auto h-[297mm] w-[210mm] overflow-hidden bg-white text-black shadow-sm print:shadow-none">
        {SCALE_MARKER.ids.map((id, i) => (
          <div
            key={id}
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: `${top(i === 0 ? C1 : C2)}mm`, width: `${BOX_MM}mm`, height: `${BOX_MM}mm` }}
            dangerouslySetInnerHTML={{ __html: MARKER_SVG[id]!.replace("<svg ", '<svg width="100%" height="100%" shape-rendering="crispEdges" ') }}
          />
        ))}

        {/* faixa do meio: régua de conferência e instruções curtas */}
        <div className="absolute inset-x-0 grid justify-items-center gap-[2mm]" style={{ top: `${top(C1) + BOX_MM + 4}mm` }}>
          <p className="text-[11pt] font-semibold tracking-wide">ARCHRAY · MARCADOR DE ESCALA</p>
          <div className="relative h-[8mm] w-[100mm] border-x-[0.4mm] border-b-[0.4mm] border-black">
            {Array.from({ length: 11 }, (_, k) => (
              <span key={k} className="absolute bottom-0 w-[0.3mm] bg-black" style={{ left: `${k * 10}mm`, height: k % 5 === 0 ? "6mm" : "3.5mm", transform: "translateX(-50%)" }} />
            ))}
          </div>
          <p className="text-[8.5pt]">Esta régua deve medir 10 cm. Quadrados de {SCALE_MARKER.sideMm / 10} cm · centros a {SCALE_MARKER.gapMm / 10} cm.</p>
          <p className="text-[8.5pt]">Prenda lisa na fachada e deixe aparecer em vários quadros.</p>
        </div>
      </div>
    </div>
  );
}
