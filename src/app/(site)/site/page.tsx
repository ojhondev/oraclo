import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, FileText, Frame, WandSparkles } from "lucide-react";
import { POSTS } from "@/lib/updates";
import { STORIES } from "@/lib/site/stories";
import { CARMO } from "@/lib/site/carmo";
import { fmtBRL, priority } from "@/lib/pricing";
import { DamageMap } from "@/components/site/damage-map";
import { ProductShot } from "@/components/site/product-shot";
import { PostRow, SectionHead, SegmentCard, StoryCard } from "@/components/site/blocks";

// Servida em "/" para quem não está logado (reescrita em src/proxy.ts).
export const metadata: Metadata = {
  title: { absolute: "ArchRay · Mapa de danos com IA" },
  description:
    "Fotos de fachadas e plantas viram mapas de danos em escala, com área medida, orçamento do tratamento, prioridade GUT e laudo em PDF. Direto no navegador.",
};

const AUDIENCES = ["Estúdios de restauro", "Inspeção predial", "Retrofit", "Patrimônio histórico", "Condomínios", "Construtoras"];

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

export default function SiteHome() {
  const igr = CARMO.igreja;
  const rows = [...CARMO.convento.damages, ...igr.damages].filter((d) => d.geometry === "area").sort((a, b) => b.gut - a.gut).slice(0, 6);

  return (
    <>
      {/* hero */}
      <section className="px-4 pt-16 pb-14 text-center sm:px-8 sm:pt-24 lg:px-12">
        <h1 className="mx-auto max-w-[14ch] text-[44px] leading-[1.02] font-medium tracking-[-0.045em] text-balance sm:text-[72px] lg:text-[96px]">
          Do dano apontado ao laudo pronto
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-7 text-muted-foreground sm:text-[19px] sm:leading-8">
          O ArchRay transforma fotos de fachadas e plantas em mapas de danos em escala — com área medida, orçamento do tratamento, prioridade e laudo em PDF. Direto no navegador.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/cadastro" className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-[15px] font-medium text-background hover:opacity-85">
            Começar grátis
          </Link>
          <Link href="#produto" className="inline-flex h-11 items-center gap-1.5 rounded-full border px-6 text-[15px] font-medium hover:bg-muted">
            Ver como funciona
          </Link>
        </div>
        <div className="mt-16 sm:mt-20">
          <p className="text-[13px] text-muted-foreground">Feito para quem diagnostica edificações existentes</p>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[17px] font-medium tracking-[-0.01em] text-foreground/70 sm:text-[19px]">
            {AUDIENCES.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* produto */}
      <section id="produto" className="scroll-mt-16 bg-muted px-4 pt-16 pb-10 sm:px-8 sm:pt-24 lg:px-12">
        <div className="text-center">
          <h2 className="text-[38px] leading-tight font-medium tracking-[-0.03em] sm:text-[52px]">ArchRay</h2>
          <p className="mx-auto mt-3 max-w-xl text-[16px] leading-7 text-muted-foreground sm:text-[17px]">
            A central visual de diagnóstico de edificações: o imóvel aparece na tela, você aponta os danos e a plataforma mede, orça, prioriza e documenta.
          </p>
          <Link href="/cadastro" className="mt-6 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-[14.5px] font-medium text-background hover:opacity-85">
            Experimentar
          </Link>
        </div>
        <ul className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {PILLARS.map((p) => (
            <li key={p.title}>
              <p.icon className="mx-auto size-[18px]" strokeWidth={1.6} />
              <p className="mt-2 text-[15px] font-medium">{p.title}</p>
              <p className="text-[13.5px] text-muted-foreground">{p.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-12 sm:mt-16">
          <ProductShot />
          <p className="mt-4 text-center text-[12.5px] text-muted-foreground">
            Case real: Convento do Carmo, Horta (Açores), foto de 2010. Os danos foram contornados com o Contorno IA.
          </p>
        </div>
      </section>

      {/* dores */}
      <section className="px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div>
            <h2 className="text-[34px] leading-[1.08] font-medium tracking-[-0.03em] text-balance sm:text-[46px]">
              Um mapa de danos ainda leva dias. Não deveria.
            </h2>
            <p className="mt-5 max-w-md text-[16.5px] leading-7 text-muted-foreground">
              O diagnóstico é o que vende a obra. Mas montá-lo hoje é colar fotos, medir no olho e refazer contas a cada revisão.
            </p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2">
            {PAINS.map((p, i) => (
              <li key={p.title} className="bg-background p-6 sm:p-7">
                <span className="text-[13px] text-muted-foreground tabular-nums">0{i + 1}</span>
                <h3 className="mt-3 text-[19px] leading-snug font-medium tracking-[-0.01em]">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-14 text-center text-[22px] leading-snug font-medium tracking-[-0.02em] sm:text-[28px]">
          Com o ArchRay, é um lugar só: <span className="text-muted-foreground">aponte, e o resto sai pronto.</span>
        </p>
      </section>

      {/* recurso: fachada */}
      <Feature
        id="fachada"
        kicker="Fachada em escala"
        title="Uma foto de celular vira fachada em escala"
        text="Arraste quatro pontos até os cantos de um retângulo real da parede e informe largura e altura. A perspectiva é corrigida no seu navegador — sem enviar a foto para processamento, sem custo."
        bullets={["Fachadas, plantas e imagens em escala", "Calibração por uma cota conhecida", "Foto original guardada junto com a vista"]}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image src="/site/carmo-igreja-2010.jpg" alt="Foto original da Igreja do Carmo, em perspectiva" fill sizes="(min-width:1024px) 25vw, 45vw" className="object-cover" />
            <span className="absolute top-2 left-2 rounded-full bg-black/65 px-2.5 py-0.5 text-[11px] text-white">Foto</span>
          </div>
          <ArrowRight className="size-5 text-muted-foreground" />
          <div className="relative aspect-[4/4.15] overflow-hidden rounded-xl">
            <Image src="/site/carmo-fachada-retificada.jpg" alt="Fachada da Igreja do Carmo retificada e em escala" fill sizes="(min-width:1024px) 25vw, 45vw" className="object-cover" />
            <span className="absolute top-2 left-2 rounded-full bg-black/65 px-2.5 py-0.5 text-[11px] text-white">Em escala · 8,7 mm/px</span>
          </div>
        </div>
      </Feature>

      {/* recurso: contorno */}
      <Feature
        id="contorno"
        reverse
        kicker="Contorno com IA"
        title="Clique na mancha. A IA contorna."
        text="Escolha o tipo de dano e clique sobre ele: a IA desenha o contorno e a área já sai medida. Mais cliques incluem ou excluem partes. O modelo roda no seu computador, inclusive nos mais simples."
        bullets={["Sem envio de imagens para servidores", "Ajuste de vértices à mão quando quiser", "Ponto, linha e área para cada tipo de dano"]}
      >
        <div className="overflow-hidden rounded-xl bg-[#1a1a1a]">
          <DamageMap src={igr.src} w={igr.w} h={igr.h} damages={igr.damages} alt="Fachada da igreja com danos contornados" className="block h-auto w-full" />
        </div>
      </Feature>

      {/* recurso: orçamento */}
      <Feature
        id="orcamento"
        kicker="Orçamento e prioridade"
        title="Custo e prioridade enquanto você desenha"
        text="Cada tipo de dano tem um tratamento e um preço por m², metro ou unidade na tabela do seu escritório. A matriz GUT (gravidade × urgência × tendência) diz o que tratar primeiro."
        bullets={["Orçamento por vista, vistoria e projeto", "Preços sugeridos como ponto de partida", "Painel do projeto com urgentes e custos por tipo"]}
      >
        <div className="overflow-hidden rounded-xl border bg-background">
          <table className="w-full table-fixed text-[13px]">
            <thead className="bg-muted/60 text-left text-[11.5px] text-muted-foreground">
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
              <tr className="border-t bg-muted/40 font-medium">
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

      {/* recurso: laudo */}
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

      {/* história em destaque (no lugar de um depoimento) */}
      <section className="px-4 pb-20 sm:px-8 sm:pb-28 lg:px-12">
        <Link href="/historias/carmo-da-horta" className="group relative block overflow-hidden rounded-3xl bg-foreground text-background">
          <div className="grid lg:grid-cols-2">
            <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[420px]">
              <Image src="/site/carmo-igreja-2021.jpg" alt="Igreja do Carmo da Horta restaurada, em 2021" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-col justify-between gap-10 p-8 sm:p-12">
              <p className="text-[13px] text-background/60">História · Patrimônio</p>
              <div>
                <p className="text-[26px] leading-[1.15] font-medium tracking-[-0.02em] text-balance sm:text-[34px]">
                  Fechada por décadas, quase ruiu no sismo de 1998 e reabriu restaurada em 2018. Refizemos o diagnóstico de 2010 no ArchRay.
                </p>
                <p className="mt-5 text-[15px] text-background/70">Igreja e Convento do Carmo · Horta, Açores</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[15px] font-medium">
                Ler a história <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* Index · Histórias · Para empresas (padrão OpenAI) */}
      <section className="grid gap-20 border-t px-4 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div>
          <SectionHead title="Index" href="/index" />
          <ul className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {POSTS.slice(0, 6).map((p) => (
              <li key={p.slug}>
                <PostRow post={p} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionHead title="Histórias" href="/historias" />
          <ul className="mt-8 grid gap-8 md:grid-cols-3">
            {STORIES.slice(0, 3).map((s) => (
              <li key={s.slug}>
                <StoryCard story={s} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionHead title="ArchRay para empresas" href="/empresas" />
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            <li>
              <SegmentCard index={0} href="/empresas#restauro" title="Estúdios de restauro" text="Mapa de danos e orçamento que vendem a obra." />
            </li>
            <li>
              <SegmentCard index={1} href="/empresas#inspecao" title="Inspeção predial" text="Vistorias e laudos com prioridade clara para o síndico." />
            </li>
            <li>
              <SegmentCard index={2} href="/empresas#patrimonio" title="Patrimônio" text="Estado de conservação e monitoramento entre visitas." />
            </li>
          </ul>
        </div>
      </section>

      {/* chamada final */}
      <section className="px-4 pb-24 text-center sm:px-8 lg:px-12">
        <div className="rounded-3xl bg-muted px-6 py-16 sm:py-24">
          <h2 className="mx-auto max-w-[18ch] text-[34px] leading-[1.08] font-medium tracking-[-0.03em] text-balance sm:text-[52px]">
            Comece pelo seu próximo laudo
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-7 text-muted-foreground">Crie a conta, suba uma foto da fachada e marque o primeiro dano em minutos.</p>
          <Link href="/cadastro" className="mt-8 inline-flex h-11 items-center rounded-full bg-foreground px-6 text-[15px] font-medium text-background hover:opacity-85">
            Começar grátis
          </Link>
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
    <section id={id} className="scroll-mt-16 px-4 pb-20 sm:px-8 sm:pb-28 lg:px-12">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <div className={reverse ? "min-w-0 lg:order-2" : "min-w-0"}>
          <p className="text-[13.5px] font-medium text-muted-foreground">{kicker}</p>
          <h2 className="mt-3 text-[32px] leading-[1.08] font-medium tracking-[-0.03em] text-balance sm:text-[44px]">{title}</h2>
          <p className="mt-5 max-w-lg text-[16.5px] leading-7 text-muted-foreground">{text}</p>
          <ul className="mt-6 grid gap-2.5 text-[15px]">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-foreground" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 rounded-3xl bg-muted p-4 sm:p-8">{children}</div>
      </div>
    </section>
  );
}

/** Folhas do laudo A4, desenhadas (sem print), com dados do case. */
function LaudoMock() {
  const v = CARMO.convento;
  return (
    <div className="relative mx-auto aspect-[4/3.4] max-w-md">
      <div className="absolute top-6 left-10 aspect-[210/297] w-[52%] rotate-[4deg] rounded-md bg-background p-3 shadow-md" aria-hidden>
        <div className="h-2 w-1/2 rounded bg-foreground/80" />
        <div className="mt-2 grid gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex gap-1">
              <span className="size-1.5 rounded-sm" style={{ background: v.damages[i % v.damages.length]!.color }} />
              <span className="h-1.5 flex-1 rounded bg-foreground/10" />
              <span className="h-1.5 w-6 rounded bg-foreground/15" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute top-0 left-0 aspect-[210/297] w-[56%] -rotate-[3deg] rounded-md bg-background p-3 shadow-lg">
        <p className="text-[8px] font-medium tracking-wide text-muted-foreground uppercase">Laudo de estado de conservação</p>
        <p className="mt-1 text-[11px] leading-tight font-medium">Igreja e Convento do Carmo</p>
        <div className="mt-2 overflow-hidden rounded-sm">
          <DamageMap src={v.src} w={v.w} h={v.h} damages={v.damages} alt="" labels={false} className="block h-auto w-full" />
        </div>
        <div className="mt-2 grid gap-1" aria-hidden>
          <div className="h-1.5 w-full rounded bg-foreground/10" />
          <div className="h-1.5 w-5/6 rounded bg-foreground/10" />
          <div className="h-1.5 w-2/3 rounded bg-foreground/10" />
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t pt-1.5">
          <span className="text-[8px] text-muted-foreground">Orçamento</span>
          <span className="text-[10px] font-medium tabular-nums">{fmtBRL(CARMO.totalCents)}</span>
        </div>
      </div>
      <div className="absolute right-0 bottom-0 w-[46%] rounded-md border bg-background p-2 shadow-md" aria-hidden>
        <p className="text-[8px] font-medium text-muted-foreground">Prancha A3 · DXF</p>
        <div className="mt-1 overflow-hidden rounded-sm">
          <DamageMap src={CARMO.igreja.src} w={CARMO.igreja.w} h={CARMO.igreja.h} damages={CARMO.igreja.damages} alt="" labels={false} className="block h-auto w-full" />
        </div>
      </div>
    </div>
  );
}
