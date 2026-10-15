import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Calculator, Lock, MonitorSmartphone, Smartphone, Users } from "lucide-react";
import { STORIES } from "@/lib/site/stories";
import { SectionHead, StoryCard } from "@/components/site/blocks";

export const metadata: Metadata = {
  title: "ArchRay para empresas",
  description: "Mapa de danos, orçamento e laudo para estúdios de restauro, inspeção predial, retrofit e patrimônio — com equipe, papéis e tabela de preços do escritório.",
};

const SEGMENTS = [
  {
    id: "restauro",
    title: "Estúdios de restauro",
    pain: "O mapa de danos é o que vende a obra, mas leva dias entre CAD, planilha e editor de texto — e o orçamento muda a cada visita.",
    gain: [
      "Fachada retificada a partir de foto, sem levantamento caro",
      "Hachuras e legenda por tipo de dano, como na prancha tradicional",
      "Orçamento do tratamento sai junto com o mapa",
    ],
  },
  {
    id: "inspecao",
    title: "Inspeção predial e patologia",
    pain: "Vistorias de condomínio e cautelares pedem rapidez, rastreabilidade e prioridade clara do que corrigir primeiro.",
    gain: [
      "Prioridade pela matriz GUT em cada dano",
      "Fotos de campo pelo celular, organizadas por vistoria",
      "Laudo em PDF com vistas, tabela de prioridades e recomendações",
    ],
  },
  {
    id: "retrofit",
    title: "Retrofit e manutenção",
    pain: "Antes de orçar a obra é preciso quantificar: quantos m² de reboco, quantos metros de fissura, quantas esquadrias.",
    gain: [
      "Áreas e comprimentos medidos na vista em escala",
      "Quantitativos por tipo de dano, por área e por projeto",
      "DXF em metros para seguir no CAD",
    ],
  },
  {
    id: "patrimonio",
    title: "Patrimônio — dioceses, museus e órgãos",
    pain: "Imóveis protegidos precisam de estado de conservação documentado e de comparação entre visitas ao longo dos anos.",
    gain: [
      "Projetos com proteção, órgão e processo registrados",
      "Vistorias datadas para comparar antes e agora",
      "Laudo de estado de conservação pronto para arquivar",
    ],
  },
];

const TEAM = [
  { icon: Users, title: "Equipe e papéis", text: "Administrador, técnico, campo e leitor. Cada pessoa vê e edita só o que deve." },
  { icon: Smartphone, title: "Campo pelo celular", text: "A equipe tira as fotos da vistoria no celular; o envio continua quando o sinal volta." },
  { icon: Calculator, title: "Preços do escritório", text: "Tratamento e preço por tipo de dano, em m², metro ou unidade. O orçamento usa a sua tabela." },
  { icon: Building2, title: "Uma organização, vários projetos", text: "Todos os imóveis, vistorias e laudos do escritório num lugar só, com busca." },
  { icon: Lock, title: "Dados separados por organização", text: "Cada escritório só acessa os próprios projetos. Convites e senhas com link seguro." },
  { icon: MonitorSmartphone, title: "Nada para instalar", text: "Roda no navegador, inclusive em computadores simples. A IA de contorno também." },
];

export default function EmpresasPage() {
  return (
    <>
      <section className="px-4 pt-20 pb-20 sm:px-6 sm:pt-28 lg:px-8">
        <p className="site-fade-in text-[14px] font-medium text-muted-foreground">ArchRay para empresas</p>
        <h1 className="site-fade-in mt-4 max-w-[18ch] text-[42px] leading-[1.03] font-medium tracking-[-0.045em] text-balance sm:text-[80px]" style={{ "--d": "120ms" } as React.CSSProperties}>
          Diagnóstico de edificações para o escritório inteiro
        </h1>
        <p className="site-fade-in mt-6 max-w-2xl text-[17px] leading-7 text-muted-foreground sm:text-[19px] sm:leading-8" style={{ "--d": "260ms" } as React.CSSProperties}>
          Do campo ao laudo, a mesma plataforma para quem fotografa, quem desenha os danos e quem aprova o orçamento.
        </p>
        <div className="site-fade-in mt-8 flex flex-wrap gap-3" style={{ "--d": "380ms" } as React.CSSProperties}>
          <Link href="/cadastro" className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-[15px] font-medium text-background hover:opacity-85">
            Criar a conta do escritório
          </Link>
          <Link href="/#produto" className="inline-flex h-11 items-center rounded-full border px-6 text-[15px] font-medium hover:bg-secondary">
            Conhecer o produto
          </Link>
        </div>
      </section>

      <section className="border-t">
        {SEGMENTS.map((s, i) => (
          <div key={s.id} id={s.id} className="grid scroll-mt-16 gap-8 border-b px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:gap-20 lg:px-8 lg:py-24">
            <div data-reveal>
              <span className="text-[13px] text-muted-foreground tabular-nums">0{i + 1}</span>
              <h2 className="mt-2 text-[30px] leading-[1.1] font-medium tracking-[-0.025em] sm:text-[40px]">{s.title}</h2>
            </div>
            <div data-reveal data-reveal-delay={120}>
              <p className="text-[18px] leading-8 text-balance sm:text-[20px]">{s.pain}</p>
              <ul className="mt-6 grid gap-3 border-t pt-6 text-[15.5px]">
                {s.gain.map((g) => (
                  <li key={g} className="flex items-start gap-3">
                    <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-foreground" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      <section className="px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <h2 className="max-w-[20ch] text-[32px] leading-[1.08] font-medium tracking-[-0.03em] text-balance sm:text-[56px]" data-reveal>Feito para trabalhar em equipe</h2>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((t, i) => (
            <li key={t.title} className="rounded-lg border bg-[var(--site-elev)] p-6 sm:p-7" data-reveal data-reveal-delay={(i % 3) * 100}>
              <t.icon className="size-[18px]" strokeWidth={1.6} />
              <h3 className="mt-4 text-[17px] font-medium">{t.title}</h3>
              <p className="mt-1.5 text-[14.5px] leading-6 text-muted-foreground">{t.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <SectionHead title="Histórias" href="/historias" />
        <ul className="mt-8 grid gap-8 md:grid-cols-3">
          {STORIES.map((s) => (
            <li key={s.slug} className={STORIES.length === 1 ? "md:col-span-3" : undefined}>
              <StoryCard story={s} large={STORIES.length === 1} />
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-foreground px-6 py-20 text-center text-background sm:py-28" data-reveal="scale">
          <h2 className="mx-auto max-w-[20ch] text-[32px] leading-[1.08] font-medium tracking-[-0.03em] text-balance sm:text-[48px]">
            Traga o próximo projeto do escritório
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-7 text-background/70">Crie a organização, convide a equipe e monte o primeiro mapa de danos hoje.</p>
          <Link href="/cadastro" className="mt-8 inline-flex h-11 items-center rounded-full bg-background px-6 text-[15px] font-medium text-foreground hover:opacity-90">
            Começar grátis
          </Link>
        </div>
      </section>
    </>
  );
}
