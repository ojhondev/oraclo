"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand";
import { markOnboarded } from "@/app/(app)/tour-actions";
import { TOUR_EVENT } from "@/components/help";

type Step = { target?: string; title: string; body: string };

/** Alvos marcados com data-tour="…" na interface. Sem alvo visível, o passo aparece centralizado. */
const STEPS: Step[] = [
  {
    title: "Bem-vindo ao Oraclo",
    body: "Do scan ao BIM: capture com o celular (fotos ou vídeo), drone ou laser, receba a nuvem de pontos e o modelo, meça, gere ortofotos e documentação. Vamos ver onde fica cada coisa — leva 1 minuto.",
  },
  { target: "novo", title: "Comece por um projeto", body: "Em Novo você cria o projeto — reforma, retrofit, galpão, loja, edifício ou patrimônio — e divide em áreas (fachadas, pavimentos, cobertura…)." },
  { target: "busca", title: "Encontre qualquer coisa", body: "Busque projetos por nome, cidade ou endereço — ou troque para Mapas de danos." },
  { target: "nav-capturas", title: "Capturas", body: "Fotos do celular, fotos que você já tinha e modelos importados de todos os projetos, com o status de cada um (em campo, aguardando processamento, concluída)." },
  { target: "nav-modelos", title: "Modelos 3D", body: "Nuvens de pontos e malhas — suas ou processadas pela equipe. Abra no navegador para medir e gerar ortofotos em escala em três cliques." },
  { target: "nav-mapas", title: "Mapas de danos", body: "Desenhe danos e patologias sobre a ortofoto. Áreas, comprimentos e legenda saem sozinhos — exporte a prancha em PDF e o DXF." },
  { target: "nav-biblioteca", title: "Biblioteca de danos", body: "A legenda padronizada: fissuras, umidade, corrosão, perda de revestimento e mais, cada um com código, cor e hachura." },
  { target: "nav-equipe", title: "Equipe", body: "Convide arquitetos, engenheiros, técnicos e a equipe de campo, cada um com o papel certo." },
  { target: "ajuda", title: "Sempre que precisar", body: "O botão Ajuda abre os tópicos da ferramenta, com sugestões para a tela em que você está. Dá para refazer este tour por lá." },
];

function visibleRect(sel?: string) {
  if (!sel) return null;
  const el = document.querySelector(`[data-tour="${sel}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null; // escondido (ex.: barra lateral no celular)
  return r;
}

export function Tour({ autoStart }: { autoStart: boolean }) {
  const [i, setI] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [vw, setVw] = useState(1024);
  const [vh, setVh] = useState(768);

  // abre no primeiro acesso (depois de a página assentar) e quando pedem pela Ajuda
  useEffect(() => {
    const t = autoStart ? setTimeout(() => setI(0), 700) : null;
    const open = () => setI(0);
    window.addEventListener(TOUR_EVENT, open);
    return () => {
      if (t) clearTimeout(t);
      window.removeEventListener(TOUR_EVENT, open);
    };
  }, [autoStart]);

  const step = i == null ? null : STEPS[i]!;

  useLayoutEffect(() => {
    if (!step) return;
    const update = () => {
      setRect(visibleRect(step.target));
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  const finish = useCallback(() => {
    setI(null);
    void markOnboarded().catch(() => {});
  }, []);

  useEffect(() => {
    if (i == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setI((x) => (x == null ? x : Math.min(STEPS.length - 1, x + 1)));
      if (e.key === "ArrowLeft") setI((x) => (x == null ? x : Math.max(0, x - 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, finish]);

  if (i == null || !step) return null;

  const W = Math.min(340, vw - 32);
  const pad = 8;
  // posição do cartão: à direita de alvos na barra lateral, senão acima/abaixo do alvo
  let style: React.CSSProperties = { left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: W };
  if (rect) {
    if (rect.right < vw * 0.35) style = { left: rect.right + 16, top: Math.max(16, Math.min(rect.top - 8, vh - 260)), width: W };
    else if (rect.top > vh * 0.55) style = { left: Math.max(16, Math.min(rect.right - W, vw - W - 16)), bottom: vh - rect.top + 14, width: W };
    else style = { left: Math.max(16, Math.min(rect.left, vw - W - 16)), top: rect.bottom + 14, width: W };
  }
  const last = i === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={step.title}>
      {/* fundo escurecido com recorte no alvo */}
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-xl transition-all duration-200"
          style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)" }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/55" />
      )}
      <div className="fixed rounded-2xl border bg-popover p-5 text-popover-foreground shadow-2xl" style={style}>
        <button onClick={finish} aria-label="Fechar tour" className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
        {i === 0 && <BrandMark className="mb-3 h-6" />}
        <p className="mb-1 text-[12px] text-muted-foreground">
          {i + 1} de {STEPS.length}
        </p>
        <h2 className="mb-1.5 pr-6 text-[17px] font-medium leading-tight">{step.title}</h2>
        <p className="text-[14px] leading-relaxed text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center gap-2">
          <button onClick={finish} className="text-[13px] text-muted-foreground hover:text-foreground">
            Pular
          </button>
          <span className="ml-auto flex gap-1.5">
            {i > 0 && (
              <Button size="sm" variant="outline" onClick={() => setI(i - 1)}>
                Voltar
              </Button>
            )}
            <Button size="sm" onClick={() => (last ? finish() : setI(i + 1))}>
              {last ? "Começar a usar" : "Próximo"}
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}
