"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronUp, Loader2, Play, RotateCcw, Sparkles, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { restartDemo, startDemo } from "@/app/(app)/demo-actions";
import type { DemoStatus } from "@/lib/demo";
import { DEMO_RECT_EVENT } from "@/lib/demo-events";

/**
 * Demonstração guiada (caso Carmo): missões em sequência sobre as telas reais. Cada missão é
 * concluída pelo que a pessoa faz de verdade no projeto de demonstração (lido do servidor) ou
 * pela tela em que ela está. O progresso fica neste aparelho; o projeto pode ser recriado do zero.
 */

const KEY = "archray:demo-tour";
export const DEMO_EVENT = "archray:demo-tour";

type Saved = { active: boolean; step: number; xp: number; startedAt: number; laudo?: boolean; precos?: boolean; ia?: boolean; cantos?: boolean; lente?: boolean; conferencia?: boolean; finishedAt?: number; min?: boolean };
type Ctx = { s: DemoStatus; path: string; saved: Saved };
type Mission = {
  id: string;
  title: string;
  how: string[];
  xp: number;
  /** Para onde o botão "Ir para lá" leva. */
  href: (s: DemoStatus) => string | null;
  /** Elemento destacado na tela (seletor CSS). */
  target?: string;
  done: (c: Ctx) => boolean;
};

const site = (s: DemoStatus) => (s.siteId ? `/bens/${s.siteId}` : null);
const nova = (s: DemoStatus) => (s.siteId ? `/bens/${s.siteId}/ortofotos/nova?tipo=fachada` : null);
const editor = (s: DemoStatus) => (s.siteId && s.vistaId ? `/bens/${s.siteId}/ortofotos/${s.vistaId}` : null);

export const MISSIONS: Mission[] = [
  {
    id: "projeto",
    title: "Conheça o projeto",
    how: ["Este é o painel do imóvel: áreas, vistorias, vistas e, depois, indicadores e orçamento.", "O projeto já tem as áreas e a vistoria de 2010 cadastradas."],
    xp: 50,
    href: site,
    done: ({ s, path }) => !!s.siteId && path === `/bens/${s.siteId}`,
  },
  {
    id: "nova-vista",
    title: "Crie a vista da fachada",
    how: ["Clique em Nova vista, no topo do projeto.", "A vista é a imagem em escala onde os danos são apontados."],
    xp: 50,
    href: (s) => (s.siteId ? `/bens/${s.siteId}/ortofotos/nova?tipo=fachada` : null),
    target: '[data-tour="nova-vista"]',
    done: ({ s, path }) => !!s.vistaId || (!!s.siteId && path.startsWith(`/bens/${s.siteId}/ortofotos/nova`)),
  },
  {
    id: "cantos",
    title: "Marque os cantos e as medidas",
    how: [
      "A foto de 2010 está em perspectiva. Arraste os 4 pontos brancos até os alvos tracejados, nos cantos da fachada — a lupa mostra os pixels de perto.",
      "Digite as medidas da trena: largura 18 m, altura 18,7 m.",
    ],
    xp: 100,
    href: nova,
    target: '[data-tour="retificar-foto"]',
    done: ({ s, saved }) => !!saved.cantos || !!s.vistaId,
  },
  {
    id: "lente",
    title: "Corrija a lente",
    how: [
      "Clique na ferramenta Linha reta.",
      "Clique 3 ou mais pontos ao longo da cornija (a guia azul tracejada), de uma ponta à outra. Enter conclui.",
      "No painel, veja a retidão melhorar: a lente do celular encurva as linhas retas, e o ArchRay desfaz isso.",
    ],
    xp: 150,
    href: nova,
    target: '[data-tour="ferramenta-linha"]',
    done: ({ s, saved }) => !!saved.lente || !!s.vistaId,
  },
  {
    id: "conferencia",
    title: "Confira a escala",
    how: [
      "Clique na ferramenta Conferência.",
      "Clique nos 2 alvos amarelos, nas bordas da porta central.",
      "Digite a medida de trena: 1,55 m. O erro real aparece em cm, e a precisão estimada vira medida.",
    ],
    xp: 150,
    href: nova,
    target: '[data-tour="ferramenta-conferencia"]',
    done: ({ s, saved }) => !!saved.conferencia || !!s.vistaId,
  },
  {
    id: "retificar",
    title: "Retifique a foto",
    how: ["Confira a prévia e a precisão estimada.", "Clique em Retificar e abrir no editor: a imagem sai plana, em escala, e abre pronta para apontar os danos."],
    xp: 100,
    href: (s) => editor(s) ?? nova(s),
    target: '[data-tour="retificar"]',
    done: ({ s }) => !!s.vistaId,
  },
  {
    id: "dano-manual",
    title: "Aponte um dano à mão",
    how: [
      "Na biblioteca à esquerda, escolha Sujidade / crosta negra.",
      "Clique em volta da mancha escura na pedra, entre as portas. Duplo clique (ou Enter) conclui.",
      "Repare: a área em m² e o custo aparecem na hora, à direita.",
    ],
    xp: 150,
    href: editor,
    target: '[data-tour="biblioteca-danos"]',
    done: ({ s }) => s.areas >= 1,
  },
  {
    id: "contorno-ia",
    title: "Contorne com a IA",
    how: [
      "Clique na varinha (Contorno IA) na barra sobre a imagem.",
      "Escolha o modo Mancha e clique sobre uma mancha de umidade ou de pintura descascada.",
      "Ajuste a tolerância se precisar e clique em Salvar dano.",
    ],
    xp: 200,
    href: editor,
    target: '[aria-label^="Contorno IA"]',
    done: ({ saved }) => !!saved.ia,
  },
  {
    id: "ponto",
    title: "Marque a vegetação",
    how: ["Na biblioteca, escolha Vegetação parasita (é um dano de ponto).", "Clique sobre as plantas no alto da fachada ou na base. Cada clique é uma ocorrência."],
    xp: 100,
    href: editor,
    target: '[data-tour="biblioteca-danos"]',
    done: ({ s }) => s.points >= 1,
  },
  {
    id: "gut",
    title: "Defina a prioridade (GUT)",
    how: [
      "Clique num dano da imagem (ou na lista à direita).",
      "Ajuste Gravidade, Urgência e Tendência. O produto das três é a nota GUT, de 1 a 125.",
      "A partir de 64 a prioridade é imediata.",
    ],
    xp: 150,
    href: editor,
    target: '[data-tour="gut"], [data-tour="painel-orcamento"]',
    done: ({ s }) => s.gutEdited,
  },
  {
    id: "orcamento",
    title: "Entenda o orçamento",
    how: [
      "O orçamento da vista está no alto do painel à direita: quantidade medida × preço do tratamento.",
      "Abra Danos e preços, no menu, para ver e ajustar o preço de cada tratamento do seu escritório.",
    ],
    xp: 100,
    href: () => "/biblioteca",
    target: '[data-tour="nav-biblioteca"]',
    done: ({ saved }) => !!saved.precos,
  },
  {
    id: "painel",
    title: "Volte ao painel do projeto",
    how: ["Os números de todas as vistas se juntam aqui: danos, área afetada, orçamento e a lista de prioridades GUT."],
    xp: 50,
    href: site,
    done: ({ s, path }) => !!s.siteId && path === `/bens/${s.siteId}`,
  },
  {
    id: "laudo",
    title: "Gere o laudo",
    how: ["Clique em Gerar laudo. O PDF abre em outra aba, com capa, vistas com os danos, tabela por prioridade e orçamento."],
    xp: 200,
    href: site,
    target: '[data-tour="gerar-laudo"]',
    done: ({ saved }) => !!saved.laudo,
  },
];
const TOTAL_XP = MISSIONS.reduce((a, m) => a + m.xp, 0);

function read(): Saved | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return v && typeof v.step === "number" ? v : null;
  } catch {
    return null;
  }
}
function write(v: Saved | null) {
  try {
    if (v) localStorage.setItem(KEY, JSON.stringify(v));
    else localStorage.removeItem(KEY);
  } catch {
    // sem armazenamento: o tour vale só enquanto a página estiver aberta
  }
  window.dispatchEvent(new Event(DEMO_EVENT));
}
const fresh = (): Saved => ({ active: true, step: 0, xp: 0, startedAt: Date.now() });

/** Botão que cria/abre o projeto de demonstração e começa o tour da missão 1. */
export function useStartDemo() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = useCallback(
    (restart = false) =>
      start(async () => {
        try {
          const id = restart ? await restartDemo() : await startDemo();
          write(fresh());
          router.push(`/bens/${id}`);
        } catch {
          toast.error("A demonstração é para quem pode editar projetos (administrador ou técnico).");
        }
      }),
    [router],
  );
  return { run, pending };
}

export function DemoTour() {
  const path = usePathname();
  const [saved, setSaved] = useState<Saved | null>(null);
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [celebrate, setCelebrate] = useState<{ title: string; xp: number } | null>(null);
  // o painel fica no canto inferior esquerdo da área de conteúdo, ao lado do menu lateral
  const [left, setLeft] = useState(16);
  useEffect(() => {
    const measure = () => {
      // desvia do menu lateral e, no editor, da biblioteca de danos (aberta ou recolhida)
      let right = 0;
      for (const el of document.querySelectorAll("[data-app-sidebar], [data-tour=\"biblioteca-danos\"], [aria-label=\"Mostrar biblioteca de danos\"]")) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) right = Math.max(right, r.right);
      }
      setLeft(Math.round(right) + 16);
    };
    measure();
    const t = setInterval(measure, 600);
    return () => clearInterval(t);
  }, []);
  const { run, pending } = useStartDemo();
  const advancing = useRef(false);

  // estado salvo (e mudanças vindas de outros componentes)
  useEffect(() => {
    const load = () => setSaved(read());
    load();
    window.addEventListener(DEMO_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(DEMO_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const active = !!saved?.active;
  const mission = active && saved!.step < MISSIONS.length ? MISSIONS[saved!.step]! : null;

  // progresso no servidor: ao trocar de tela e a cada poucos segundos
  useEffect(() => {
    if (!active) return;
    let off = false;
    const poll = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/demo", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((s: DemoStatus | null) => !off && s && setStatus(s))
        .catch(() => {});
    };
    poll();
    const t = setInterval(poll, 2500);
    return () => {
      off = true;
      clearInterval(t);
    };
  }, [active, path]);

  // marcas que vêm da navegação/cliques: Danos e preços aberto, laudo gerado
  useEffect(() => {
    if (!saved?.active || !mission) return;
    if (mission.id === "orcamento" && path.startsWith("/biblioteca") && !saved.precos) write({ ...saved, precos: true });
  }, [path, mission, saved]);
  useEffect(() => {
    if (!saved?.active) return;
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.('[data-tour="gerar-laudo"]')) {
        const cur = read();
        if (cur?.active && MISSIONS[cur.step]?.id === "laudo") write({ ...cur, laudo: true });
      }
    };
    const onAi = () => {
      const cur = read();
      if (cur?.active && MISSIONS[cur.step]?.id === "contorno-ia") write({ ...cur, ia: true });
    };
    document.addEventListener("click", onClick, true);
    // a retificação (modo demonstração) avisa quando cantos, lente e conferência estão certos
    const onRect = (e: Event) => {
      const d = (e as CustomEvent<{ cantos: boolean; lente: boolean; conferencia: boolean }>).detail;
      const cur = read();
      if (!cur?.active) return;
      const next = { ...cur, cantos: cur.cantos || d.cantos, lente: cur.lente || d.lente, conferencia: cur.conferencia || d.conferencia };
      if (next.cantos !== cur.cantos || next.lente !== cur.lente || next.conferencia !== cur.conferencia) write(next);
    };
    window.addEventListener("archray:contorno-ia", onAi);
    window.addEventListener(DEMO_RECT_EVENT, onRect);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("archray:contorno-ia", onAi);
      window.removeEventListener(DEMO_RECT_EVENT, onRect);
    };
  }, [saved?.active]);

  // conclui a missão atual quando a condição é atendida
  useEffect(() => {
    if (!saved?.active || !mission || !status || advancing.current) return;
    if (!mission.done({ s: status, path, saved })) return;
    advancing.current = true;
    const show = setTimeout(() => setCelebrate({ title: mission.title, xp: mission.xp }), 0);
    const next: Saved = { ...saved, step: saved.step + 1, xp: saved.xp + mission.xp, min: false };
    if (next.step >= MISSIONS.length) next.finishedAt = Date.now();
    const t = setTimeout(() => {
      write(next);
      setCelebrate(null);
      advancing.current = false;
    }, 1400);
    return () => {
      clearTimeout(show);
      clearTimeout(t);
      advancing.current = false;
    };
  }, [status, path, saved, mission]);

  // destaque do elemento da missão
  useEffect(() => {
    if (!mission?.target || saved?.min) return;
    const find = () => {
      const el = [...document.querySelectorAll(mission.target!)].find((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 2 && r.height > 2;
      });
      setRect(el ? el.getBoundingClientRect() : null);
    };
    find();
    const t = setInterval(find, 400);
    return () => clearInterval(t);
  }, [mission, path, saved?.min]);

  const href = useMemo(() => (mission && status ? mission.href(status) : null), [mission, status]);
  if (!saved?.active) return null;

  const minimize = (min: boolean) => write({ ...saved, min });
  const quit = () => write(null);
  const pct = Math.round((saved.xp / TOTAL_XP) * 100);
  const here = href ? path === href.split("?")[0] : true;

  // ── fim: conquista ──
  if (!mission) {
    const mins = saved.finishedAt ? Math.max(1, Math.round((saved.finishedAt - saved.startedAt) / 60000)) : null;
    return (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Demonstração concluída">
        <div className="w-full max-w-md rounded-2xl border bg-popover p-6 text-popover-foreground shadow-2xl">
          <div className="mb-4 grid size-12 place-items-center rounded-full bg-foreground text-background">
            <Trophy className="size-6" />
          </div>
          <p className="text-[12.5px] text-muted-foreground">Demonstração concluída{mins ? ` em ${mins} min` : ""}</p>
          <h2 className="mt-1 text-[22px] leading-tight font-medium">Você fez o fluxo inteiro do ArchRay</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Da foto em perspectiva ao laudo: retificação com lente e conferência, danos à mão e com IA, prioridade GUT, orçamento e painel.{" "}
            <b className="font-medium text-foreground">{saved.xp} de {TOTAL_XP} XP.</b>
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-1.5 text-[12.5px]">
            {MISSIONS.map((m) => (
              <li key={m.id} className="flex items-center gap-1.5">
                <Check className="size-3.5 shrink-0" /> <span className="truncate">{m.title}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button onClick={() => run(true)} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />} Refazer do zero
            </Button>
            <Button variant="outline" onClick={quit}>
              Usar o ArchRay
            </Button>
          </div>
          <p className="mt-3 text-[11.5px] text-muted-foreground">
            Refazer apaga a vista e os danos da demonstração e começa de novo da missão 1. Seus outros projetos não são tocados.
          </p>
        </div>
      </div>
    );
  }

  const pad = 6;
  return (
    <>
      {rect && mission.target && !saved.min && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[55] rounded-xl ring-2 ring-foreground transition-all duration-300"
          style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        >
          <span className="absolute inset-0 animate-ping rounded-xl ring-2 ring-foreground/60" />
        </div>
      )}

      <div className="fixed bottom-4 z-[56] w-[min(340px,calc(100vw-32px))]" style={{ left }}>
        {celebrate && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-foreground px-3 py-2 text-[13px] text-background shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <Sparkles className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">Missão concluída: {celebrate.title}</span>
            <b className="tabular-nums">+{celebrate.xp} XP</b>
          </div>
        )}
        <div className="overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl">
          <div className="flex items-center gap-2 border-b px-3.5 py-2.5">
            <span className="grid size-6 place-items-center rounded-full bg-foreground text-[11px] font-medium text-background tabular-nums">{saved.step + 1}</span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[11.5px] text-muted-foreground">Demonstração · Igreja do Carmo</p>
              <p className="truncate text-[13.5px] font-medium">{mission.title}</p>
            </div>
            <button onClick={() => minimize(!saved.min)} aria-label={saved.min ? "Abrir missão" : "Minimizar missão"} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
              {saved.min ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            <button onClick={quit} aria-label="Sair da demonstração" title="Sair (o projeto continua lá)" className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          {/* progresso */}
          <div className="px-3.5 pt-2.5">
            <div className="flex items-center justify-between text-[11.5px] text-muted-foreground tabular-nums">
              <span>
                Missão {saved.step + 1} de {MISSIONS.length}
              </span>
              <span>
                {saved.xp} / {TOTAL_XP} XP
              </span>
            </div>
            <div className="mt-1 flex gap-1" aria-hidden>
              {MISSIONS.map((m, i) => (
                <span key={m.id} className={cn("h-1.5 flex-1 rounded-full", i < saved.step ? "bg-foreground" : i === saved.step ? "bg-foreground/45" : "bg-muted")} />
              ))}
            </div>
            <span className="sr-only">{pct}% concluído</span>
          </div>
          {!saved.min && (
            <div className="px-3.5 pt-3 pb-3.5">
              <ol className="grid gap-1.5 text-[13px] leading-snug">
                {mission.how.map((h, i) => (
                  <li key={i} className="grid grid-cols-[18px_1fr] gap-1">
                    <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {href && !here && (
                  <Button size="sm" asChild>
                    <Link href={href}>
                      <Play /> Ir para lá
                    </Link>
                  </Button>
                )}
                <span className="ml-auto text-[11.5px] text-muted-foreground">+{mission.xp} XP</span>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t pt-2.5 text-[12px] text-muted-foreground">
                <button onClick={() => write({ ...saved, step: saved.step + 1 })} className="hover:text-foreground">
                  Pular missão
                </button>
                <button onClick={() => run(true)} disabled={pending} className="inline-flex items-center gap-1 hover:text-foreground">
                  {pending ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />} Recomeçar do zero
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Cartão/botão para começar a demonstração (início do app e Ajuda). */
export function DemoLauncher({ variant = "card" }: { variant?: "card" | "button" }) {
  const { run, pending } = useStartDemo();
  if (variant === "button")
    return (
      <Button size="sm" onClick={() => run(false)} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Play />} Começar a demonstração
      </Button>
    );
  return (
    <button
      onClick={() => run(false)}
      disabled={pending}
      className="group flex w-full items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-left transition-colors hover:border-foreground/40"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium">Aprenda na prática: demonstração guiada</span>
        <span className="block text-[12.5px] text-muted-foreground">13 missões com a Igreja do Carmo (Horta) — da foto em perspectiva ao laudo, com retificação profissional. Dá para refazer quantas vezes quiser.</span>
      </span>
    </button>
  );
}
