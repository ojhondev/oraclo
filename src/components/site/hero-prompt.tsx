"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";

const PHRASES = [
  "Mancha de umidade na base da fachada norte",
  "Perda de reboco entre as janelas do 2º pavimento",
  "Fissuras na empena — quantos metros?",
  "Orçamento do tratamento da fachada principal",
  "Laudo de estado de conservação para o cliente",
];

/** Campo no estilo "prompt" com frases digitadas em sequência; leva ao cadastro. */
export function HeroPrompt() {
  const [text, setText] = useState("");

  // a digitação não desloca nada na tela, então roda mesmo com "reduzir movimento"
  useEffect(() => {
    let i = 0;
    let n = 0;
    let erasing = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const p = PHRASES[i]!;
      if (!erasing) {
        n++;
        setText(p.slice(0, n));
        if (n >= p.length) {
          erasing = true;
          timer = setTimeout(tick, 1800);
          return;
        }
        timer = setTimeout(tick, 38 + Math.random() * 40);
      } else {
        n = Math.max(0, n - 3);
        setText(p.slice(0, n));
        if (n === 0) {
          erasing = false;
          i = (i + 1) % PHRASES.length;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, 18);
      }
    };
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Link
      href="/cadastro"
      className="group relative mx-auto block w-full max-w-[640px] overflow-hidden rounded-[22px] border bg-secondary p-4 text-left transition-colors hover:border-foreground/25"
      aria-label="Começar grátis"
    >
      <span className="site-sheen pointer-events-none absolute inset-0" aria-hidden />
      <span className="relative block min-h-[52px] text-[15px] leading-6 text-foreground/85 sm:text-[16px]">
        {text}
        <span className="site-caret ml-0.5 inline-block h-[1.1em] w-px translate-y-[3px] bg-foreground" aria-hidden />
      </span>
      <span className="relative mt-2 flex items-center justify-between">
        <span className="text-[12.5px] text-muted-foreground">Aponte, e o ArchRay mede, orça e documenta.</span>
        <span className="grid size-8 place-items-center rounded-full bg-foreground text-background transition-transform group-hover:-translate-y-0.5">
          <ArrowUp className="size-4" />
        </span>
      </span>
    </Link>
  );
}
