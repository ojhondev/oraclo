import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, FileText, Frame, WandSparkles } from "lucide-react";
import { POSTS, fmtPostDate } from "@/lib/updates";
import { STORIES } from "@/lib/site/stories";
import { CARMO } from "@/lib/site/carmo";
import { fmtBRL, priority } from "@/lib/pricing";
import { DamageMap } from "@/components/site/damage-map";
import { ProductShot } from "@/components/site/product-shot";
import { HeroPrompt } from "@/components/site/hero-prompt";
import { Meta, PostRow, SectionHead, SegmentCard, SiteCover, StoryCard } from "@/components/site/blocks";

// Servida em "/" para quem não está logado (reescrita em src/proxy.ts).
export const metadata: Metadata = {
  title: { absolute: "ArchRay · Mapa de danos com IA" },
  description:
    "Fotos de fachadas e plantas viram mapas de danos em escala, com área medida, orçamento do tratamento, prioridade GUT e laudo em PDF. Direto no navegador.",
};

const CHIPS = [
  { href: "#fachada", label: "Fachada em escala" },
  { href: "#contorno", label: "Contorno com IA" },
  { href: "#orcamento", label: "Orçamento e GUT" },
  { href: "#laudo", label: "Laudo" },
  { href: "/empresas", label: "Para empresas" },
];

const AUDIENCES = ["Estúdios de restauro", "Inspeção predial", "Retrofit", "Patrimônio histórico", "Condomínios", "Construtoras", "Dioceses", "Museus"];

const PAINS = [
  { title: "Cinco programas para um laudo", text: "Foto no celular, desenho no CAD, conta na planilha, texto no editor. Cada passagem é retrabalho e uma chance de erro." },
  { title: "Medida no olho", text: "Sem escala, a área de uma mancha vira estimativa — e o orçamento do tratamento também." },
  { title: "Orçamento que nunca fecha", text: "Mudou um dano, muda a planilha inteira. Revisar o diagnóstico custa mais que fazê-lo." },
  { title: "Laudo que o cliente não lê", text: "Páginas de texto sem imagem e sem dizer o que tratar primeiro. A obra não sai do papel." },
];

const PILLARS = [
  { icon: Frame, title: "Retificar", text: "Foto comum vira vista em escala" },
  { icon: WandSparkles, title: "Apontar", text: "Contorno com IA em um clique" },
  { icon: Calculator, title: "Orçar", text: "Custo e GUT enquanto desenha" },
  { icon: FileText, title: "Laudar", text: "PDF, prancha A3 e DXF" },
];

const HERO = "Que dano vamos mapear hoje?";

export default function SiteHome() {
  const igr = CARMO.igreja;
  const rows = [...CARMO.convento.damages, ...igr.damages].filter((d) => d.geometry === "area").sort((a, b) => b.gut - a.gut).slice(0, 6);
  const post = POSTS[0];
  const story = STORIES[0]!;

  return (
    <>
      {/* hero: pergunta + campo de "prompt" (como a home da OpenAI) */}
      <section className="flex min-h-[calc(78svh-60px)] flex-col items-center justify-center px-4 pt-16 pb-10 text-center sm:px-6 lg:px-8">
        <h1 className="site-rise text-[34px] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-[44px]" aria-label={HERO}>
          {HERO.split(" ").map((w, i) => (
            <span key={i} style={{ "--w": i } as React.CSSProperties} aria-hidden>
              {w}&nbsp;
            </span>
          ))}
        </h1>
        <div className="site-fade-in mt-8 w-full" style={{ "--d": "450ms" } as React.CSSProperties}>
          <HeroPrompt />
        </div>
        <ul className="site-fade-in mt-5 flex flex-wrap justify-center gap-2" style={{ "--d": "650ms" } as React.CSSProperties}>
          {CHIPS.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="inline-flex h-9 items-center rounded-full border px-4 text-[13.5px] font-medium text-foreground/85 transition-colors hover:bg-secondary hover:text-foreground">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* destaque: card grande + coluna de cards */}
      <section className="grid gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
        <Link href={post ? `/index/${post.slug}` : "/#produto"} className="group block min-w-0" data-reveal="scale">
          <div className="overflow-hidden rounded-lg">
            <ProductShot />
          </div>
          <h2 className="mt-6 max-w-[22ch] text-[30px] leading-[1.08] font-medium tracking-[-0.03em] text-balance group-hover:underline group-hover:underline-offset-[6px] sm:text-[46px]">
            ArchRay: do dano apontado ao laudo pronto
          </h2>
          {post && (
            <div className="mt-3">
              <Meta label={post.category} date={fmtPostDate(post.date, "short")} extra="Leitura de 6 minutos" />
            </div>
          )}
        </Link>
        <div className="grid content-start gap-8 sm:grid-cols-2 lg:grid-cols-1">
          <Link href={`/historias/${story.slug}`} className="group block" data-reveal data-reveal-delay={150}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
              <Image src="/site/carmo-igreja-2021.jpg" alt="Igreja do Carmo da Horta restaurada" fill sizes="(min-width:1024px) 300px, 50vw" className="site-kenburns object-cover" />
            </div>
            <h3 className="mt-3 text-[16px] leading-snug font-medium group-hover:underline group-hover:underline-offset-4">Carmo da Horta: o diagnóstico de 2010, refeito no ArchRay</h3>
            <div className="mt-1.5">
              <Meta label="História" date="15 de out. de 2026" />
            </div>
          </Link>
          <Link href="#contorno" className="group block" data-reveal data-reveal-delay={300}>
            <div className="relative overflow-hidden rounded-lg bg-[#1a1a1a]">
              <DamageMap src={igr.src} w={igr.w} h={igr.h} damages={igr.damages} alt="Fachada retificada com danos" labels={false} className="block aspect-[4/3] h-auto w-full object-cover" />
            </div>
            <h3 className="mt-3 text-[16px] leading-snug font-medium group-hover:underline group-hover:underline-offset-4">Clique na mancha. A IA contorna — no seu navegador.</h3>
            <div className="mt-1.5">
              <Meta label="Produto" date="Contorno IA" />
            </div>
          </Link>
        </div>
      </section>

      {/* faixa contínua de públicos */}
      <section className="site-marquee-mask overflow-hidden border-y py-6" aria-label="Para quem é o ArchRay">
        <ul className="site-marquee gap-14 pr-14 text-[22px] font-medium tracking-[-0.02em] whitespace-nowrap text-foreground/45 sm:text-[28px]">
          {[...AUDIENCES, ...AUDIENCES].map((a, i) => (
            <li key={i} aria-hidden={i >= AUDIENCES.length}>
              {a}
            </li>
          ))}
        </ul>
      </section>

      {/* dores */}
      <section className="px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <h2 className="max-w-[16ch] text-[38px] leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-[64px]" data-reveal>
          Um mapa de danos ainda leva dias. Não deveria.
        </h2>
        <p className="mt-6 max-w-xl text-[17px] leading-7 text-muted-foreground" data-reveal data-reveal-delay={100}>
          O diagnóstico é o que vende a obra. Mas montá-lo hoje é colar fotos, medir no olho e refazer contas a cada revisão.
        </p>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PAINS.map((p, i) => (
            <li key={p.title} className="flex min-h-[220px] flex-col justify-between rounded-lg border bg-[var(--site-elev)] p-6" data-reveal data-reveal-delay={i * 110}>
              <span className="text-[13px] text-muted-foreground tabular-nums">0{i + 1}</span>
              <div>
                <h3 className="text-[19px] leading-snug font-medium tracking-[-0.01em]">{p.title}</h3>
                <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-16 max-w-[28ch] text-[28px] leading-[1.15] font-medium tracking-[-0.025em] text-balance sm:text-[40px]" data-reveal>
          Com o ArchRay, é um lugar só. <span className="text-muted-foreground">Aponte, e o resto sai pronto.</span>
        </p>
      </section>

      {/* produto */}
      <section id="produto" className="scroll-mt-16 border-t px-4 pt-24 sm:px-6 sm:pt-32 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <div data-reveal>
            <p className="text-[13.5px] font-medium text-muted-foreground">Produto</p>
            <h2 className="mt-3 text-[44px] leading-[1.02] font-medium tracking-[-0.045em] sm:text-[80px]">ArchRay</h2>
            <p className="mt-5 max-w-lg text-[17px] leading-7 text-muted-foreground">
              A central visual de diagnóstico de edificações: o imóvel aparece na tela, você aponta os danos e a plataforma mede, orça, prioriza e documenta.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
            {PILLARS.map((p, i) => (
              <li key={p.title} className="bg-background p-5" data-reveal data-reveal-delay={i * 90}>
                <p.icon className="size-[18px]" strokeWidth={1.6} />
                <p className="mt-6 text-[15px] font-medium">{p.title}</p>
                <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Feature
        id="fachada"
        kicker="Fachada em escala"
        title="Uma foto de celular vira fachada em escala"
        text="Arraste quatro pontos até os cantos de um retângulo real da parede e informe largura e altura. A perspectiva é corrigida no seu navegador — sem enviar a foto para processamento, sem custo."
        bullets={["Fachadas, plantas e imagens em escala", "Calibração por uma cota conhecida", "Foto original guardada junto com a vista"]}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md" data-reveal>
            <div className="absolute inset-0" data-parallax="0.05">
              <Image src="/site/carmo-igreja-2010.jpg" alt="Foto original da Igreja do Carmo, em perspectiva" fill sizes="(min-width:1024px) 25vw, 45vw" className="object-cover" />
            </div>
            <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] text-white">Foto</span>
          </div>
          <ArrowRight className="size-5 text-muted-foreground" />
          <div className="relative aspect-[4/4.15] overflow-hidden rounded-md" data-reveal data-reveal-delay={250}>
            <Image src="/site/carmo-fachada-retificada.jpg" alt="Fachada da Igreja do Carmo retificada e em escala" fill sizes="(min-width:1024px) 25vw, 45vw" className="object-cover" />
            <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] text-white">Em escala · 8,7 mm/px</span>
          </div>
        </div>
      </Feature>

      <Feature
        id="contorno"
        reverse
        kicker="Contorno com IA"
        title="Clique na mancha. A IA contorna."
        text="Escolha o tipo de dano e clique sobre ele: a IA desenha o contorno e a área já sai medida. Para manchas, uma varinha por cor; para elementos, um modelo de segmentação. Tudo roda no seu computador, inclusive nos mais simples."
        bullets={["Sem envio de imagens para servidores", "Ajuste de vértices à mão quando quiser", "Ponto, linha e área para cada tipo de dano"]}
      >
        <div className="overflow-hidden rounded-md bg-[#1a1a1a]" data-reveal="fade">
          <DamageMap src={CARMO.convento.src} w={CARMO.convento.w} h={CARMO.convento.h} damages={CARMO.convento.damages} alt="Convento com danos sendo contornados" className="block h-auto w-full" />
        </div>
      </Feature>

      <Feature
        id="orcamento"
        kicker="Orçamento e prioridade"
        title="Custo e prioridade enquanto você desenha"
        text="Cada tipo de dano tem um tratamento e um preço por m², metro ou unidade na tabela do seu escritório. A matriz GUT (gravidade × urgência × tendência) diz o que tratar primeiro."
        bullets={["Orçamento por vista, vistoria e projeto", "Preços sugeridos como ponto de partida", "Painel do projeto com urgentes e custos por tipo"]}
      >
        <div className="overflow-hidden rounded-md border bg-background" data-reveal>
          <table className="w-full table-fixed text-[13px]">
            <thead className="bg-secondary text-left text-[11.5px] text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Dano</th>
                <th className="w-[76px] px-2 py-2.5 text-right font-medium">Área</th>
                <th className="w-[48px] px-2 py-2.5 text-right font-medium">GUT</th>
                <th className="w-[96px] px-4 py-2.5 text-right font-medium">Custo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} />
                      <span className="truncate">{d.name}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{d.areaM2?.toFixed(2).replace(".", ",")} m²</td>
                  <td className="px-2 py-2.5 text-right tabular-nums" title={priority(d.gut).label}>
                    {d.gut}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtBRL(d.costCents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-secondary font-medium">
                <td className="px-4 py-3" colSpan={3}>
                  Orçamento do case (11 danos)
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(CARMO.totalCents)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-muted-foreground">Valores com a tabela sugerida de fábrica; cada escritório usa os próprios preços.</p>
      </Feature>

      <Feature
        id="laudo"
        reverse
        kicker="Laudo e pranchas"
        title="Um laudo que o cliente entende"
        text="Identificação, resumo, vistas com os danos, tabela com prioridade GUT, recomendações e orçamento — num PDF A4 gerado na hora. Para o projeto, prancha A3 e DXF com uma camada por tipo de dano."
        bullets={["Laudo de estado de conservação em PDF", "Prancha A3 com legenda e hachuras", "DXF em metros para o CAD"]}
      >
        <LaudoMock />
      </Feature>

      {/* história em tela cheia com paralaxe */}
      <section className="px-4 pb-24 sm:px-6 sm:pb-32 lg:px-8">
        <Link href={`/historias/${story.slug}`} className="group relative block overflow-hidden rounded-lg" data-reveal="fade">
          <div className="relative aspect-[4/5] sm:aspect-[21/9]">
            <div className="absolute inset-0" data-parallax="0.12">
              <Image src="/site/carmo-convento-2010.jpg" alt="Convento do Carmo da Horta em 2010" fill sizes="100vw" className="object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-12">
              <p className="text-[13px] text-white/70">História · Patrimônio · Horta, Açores</p>
              <p className="mt-3 max-w-[26ch] text-[26px] leading-[1.12] font-medium tracking-[-0.025em] text-balance sm:text-[44px]">
                Fechada por décadas, quase ruiu no sismo de 1998 e reabriu restaurada em 2018.
              </p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium">
                Ver o diagnóstico de 2010 no ArchRay <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* Index · Histórias · Para empresas (padrão OpenAI) */}
      <section className="grid gap-24 px-4 pb-24 sm:px-6 lg:px-8">
        <div>
          <SectionHead title="Index" href="/index" more="Ver mais" />
          <ul className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {POSTS.slice(0, 6).map((p, i) => (
              <li key={p.slug}>
                <PostRow post={p} delay={i * 80} />
              </li>
            ))}
            <li>
              <Link href="/historias/carmo-da-horta" className="group grid grid-cols-[104px_1fr] items-center gap-5 sm:grid-cols-[150px_1fr]" data-reveal data-reveal-delay={100}>
                <SiteCover className="aspect-square rounded-lg" />
                <div className="min-w-0">
                  <h3 className="text-[16px] leading-snug font-medium text-balance group-hover:underline group-hover:underline-offset-4 sm:text-[17px]">
                    Um case real com fotos públicas: o Carmo da Horta
                  </h3>
                  <div className="mt-2">
                    <Meta label="Histórias" date="15 de out. de 2026" />
                  </div>
                </div>
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <SectionHead title="Histórias" href="/historias" />
          <ul className="mt-8 grid gap-8 md:grid-cols-3">
            {STORIES.slice(0, 3).map((s, i) => (
              <li key={s.slug} className={STORIES.length === 1 ? "md:col-span-3" : undefined}>
                <StoryCard story={s} large={STORIES.length === 1} delay={i * 100} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionHead title="ArchRay para empresas" href="/empresas" />
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            <li>
              <SegmentCard index={0} href="/empresas#restauro" title="Estúdios de restauro" text="Mapa de danos e orçamento que vendem a obra." />
            </li>
            <li>
              <SegmentCard index={1} href="/empresas#inspecao" title="Inspeção predial" text="Vistorias e laudos com prioridade clara para o síndico." delay={100} />
            </li>
            <li>
              <SegmentCard index={2} href="/empresas#patrimonio" title="Patrimônio" text="Estado de conservação e monitoramento entre visitas." delay={200} />
            </li>
          </ul>
        </div>
      </section>

      {/* chamada final */}
      <section className="px-4 pb-24 text-center sm:px-6 lg:px-8">
        <div className="border-t pt-24 sm:pt-32">
          <h2 className="mx-auto max-w-[16ch] text-[38px] leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-[64px]" data-reveal>
            Comece pelo seu próximo laudo
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[16.5px] leading-7 text-muted-foreground" data-reveal data-reveal-delay={100}>
            Crie a conta, suba uma foto da fachada e marque o primeiro dano em minutos.
          </p>
          <div className="mt-9 flex justify-center gap-3" data-reveal data-reveal-delay={200}>
            <Link href="/cadastro" className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-[15px] font-medium text-background hover:opacity-85">
              Começar grátis
            </Link>
            <Link href="/empresas" className="inline-flex h-11 items-center rounded-full bg-secondary px-6 text-[15px] font-medium hover:bg-accent">
              Para empresas
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({
  id,
  kicker,
  title,
  text,
  bullets,
  reverse,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  text: string;
  bullets: string[];
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16 px-4 pt-24 sm:px-6 sm:pt-32 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={reverse ? "min-w-0 lg:order-2" : "min-w-0"}>
          <p className="text-[13.5px] font-medium text-muted-foreground" data-reveal>
            {kicker}
          </p>
          <h2 className="mt-3 text-[32px] leading-[1.06] font-medium tracking-[-0.035em] text-balance sm:text-[48px]" data-reveal data-reveal-delay={60}>
            {title}
          </h2>
          <p className="mt-5 max-w-lg text-[16.5px] leading-7 text-muted-foreground" data-reveal data-reveal-delay={120}>
            {text}
          </p>
          <ul className="mt-6 grid gap-2.5 text-[15px]">
            {bullets.map((b, i) => (
              <li key={b} className="flex items-start gap-2.5" data-reveal data-reveal-delay={180 + i * 60}>
                <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-foreground" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 rounded-lg border bg-[var(--site-elev)] p-4 sm:p-8">{children}</div>
      </div>
    </section>
  );
}

/** Folhas do laudo A4, desenhadas (sem print), com dados do case. */
function LaudoMock() {
  const v = CARMO.convento;
  return (
    <div className="relative mx-auto aspect-[4/3.4] max-w-md" data-reveal="fade">
      <div className="absolute top-6 left-10 aspect-[210/297] w-[52%] rotate-[4deg] rounded-md bg-white p-3 text-black shadow-2xl transition-transform duration-700 [.is-in_&]:rotate-[7deg]" aria-hidden>
        <div className="h-2 w-1/2 rounded bg-black/80" />
        <div className="mt-2 grid gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex gap-1">
              <span className="size-1.5 rounded-sm" style={{ background: v.damages[i % v.damages.length]!.color }} />
              <span className="h-1.5 flex-1 rounded bg-black/10" />
              <span className="h-1.5 w-6 rounded bg-black/15" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute top-0 left-0 aspect-[210/297] w-[56%] -rotate-[3deg] rounded-md bg-white p-3 text-black shadow-2xl transition-transform duration-700 [.is-in_&]:-rotate-[5deg]">
        <p className="text-[8px] font-medium tracking-wide text-black/55 uppercase">Laudo de estado de conservação</p>
        <p className="mt-1 text-[11px] leading-tight font-medium">Igreja e Convento do Carmo</p>
        <div className="mt-2 overflow-hidden rounded-sm">
          <DamageMap src={v.src} w={v.w} h={v.h} damages={v.damages} alt="" labels={false} className="block h-auto w-full" />
        </div>
        <div className="mt-2 grid gap-1" aria-hidden>
          <div className="h-1.5 w-full rounded bg-black/10" />
          <div className="h-1.5 w-5/6 rounded bg-black/10" />
          <div className="h-1.5 w-2/3 rounded bg-black/10" />
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t border-black/10 pt-1.5">
          <span className="text-[8px] text-black/55">Orçamento</span>
          <span className="text-[10px] font-medium tabular-nums">{fmtBRL(CARMO.totalCents)}</span>
        </div>
      </div>
      <div className="absolute right-0 bottom-0 w-[46%] rounded-md bg-white p-2 text-black shadow-2xl transition-transform duration-700 [.is-in_&]:translate-y-[-6px]" aria-hidden>
        <p className="text-[8px] font-medium text-black/55">Prancha A3 · DXF</p>
        <div className="mt-1 overflow-hidden rounded-sm">
          <DamageMap src={CARMO.igreja.src} w={CARMO.igreja.w} h={CARMO.igreja.h} damages={CARMO.igreja.damages} alt="" labels={false} className="block h-auto w-full" />
        </div>
      </div>
    </div>
  );
}
