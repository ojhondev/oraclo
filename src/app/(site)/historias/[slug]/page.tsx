import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { STORIES, fmtStoryDate } from "@/lib/site/stories";
import { CARMO } from "@/lib/site/carmo";
import { fmtBRL, priority } from "@/lib/pricing";
import { DamageMap } from "@/components/site/damage-map";

export function generateStaticParams() {
  return STORIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/historias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = STORIES.find((x) => x.slug === slug);
  return s ? { title: s.title, description: s.summary } : {};
}

export default async function StoryPage({ params }: PageProps<"/historias/[slug]">) {
  const { slug } = await params;
  const story = STORIES.find((s) => s.slug === slug);
  if (!story || slug !== "carmo-da-horta") notFound();

  const all = [...CARMO.convento.damages, ...CARMO.igreja.damages];
  const areaTotal = all.reduce((s, d) => s + (d.areaM2 ?? 0), 0);
  const urgent = all.filter((d) => d.gut >= 64).length;
  const sorted = [...all].sort((a, b) => b.gut - a.gut);

  return (
    <article className="pb-24">
      <header className="px-4 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        <Link href="/historias" className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Histórias
        </Link>
        <p className="mt-8 text-[14px]">
          <span className="font-medium">{story.segment}</span>
          <span className="ml-2 text-muted-foreground">{fmtStoryDate(story.date)}</span>
        </p>
        <h1 className="mt-3 max-w-[22ch] text-[36px] leading-[1.06] font-medium tracking-[-0.035em] text-balance sm:text-[58px]">{story.title}</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-8 text-muted-foreground sm:text-[19px]">{story.summary}</p>
      </header>

      <div className="relative mt-10 aspect-[16/9] overflow-hidden bg-muted sm:mx-8 sm:rounded-3xl lg:mx-12">
        <Image src={story.cover} alt={story.coverAlt} fill priority sizes="100vw" className="object-cover" />
      </div>

      {/* números */}
      <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden border-y bg-border sm:grid-cols-4">
        {[
          ["Danos mapeados", String(all.length)],
          ["Área afetada", `${areaTotal.toFixed(1).replace(".", ",")} m²`],
          ["Orçamento estimado", fmtBRL(CARMO.totalCents)],
          ["Prioridade alta (GUT ≥ 64)", String(urgent)],
        ].map(([k, v]) => (
          <div key={k} className="bg-background px-4 py-6 sm:px-8 lg:px-12">
            <dt className="text-[13px] text-muted-foreground">{k}</dt>
            <dd className="mt-1 text-[26px] font-medium tracking-[-0.02em] tabular-nums sm:text-[32px]">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-16 px-4 pt-16 sm:px-8 lg:grid-cols-[1fr_minmax(0,640px)_1fr] lg:px-12">
        <div className="hidden lg:block" />
        <div className="grid gap-6 text-[17px] leading-8">
          <h2 className="text-[26px] leading-tight font-medium tracking-[-0.02em]">O imóvel</h2>
          <p>
            A Igreja de Nossa Senhora do Carmo, na cidade da Horta (ilha do Faial, Açores), foi o primeiro templo carmelita português erguido fora do continente.
            As obras começaram em 1698 e só terminaram em 1797; o convento anexo é de 1651. Hoje o conjunto é Imóvel de Interesse Público.
          </p>
          <p>
            Depois de décadas fechada, a igreja quase ruiu no sismo de 9 de julho de 1998. O restauro parou por falta de verba e só foi retomado quase vinte anos
            depois, com a reabertura em 2018. As fotos de 2010 mostram exatamente o estado que um mapa de danos precisa registrar: manchas, colonização biológica,
            desagregação da pedra, pintura descolando e vegetação nas cornijas.
          </p>

          <h2 className="mt-6 text-[26px] leading-tight font-medium tracking-[-0.02em]">Como montamos o diagnóstico</h2>
          <p>
            Usamos só duas fotos públicas de 27 de agosto de 2010. A fachada da igreja foi retificada no próprio ArchRay: quatro cliques nos cantos e as medidas
            estimadas de 18 × 18,7 m. A fachada do pátio do convento, quase frontal, foi calibrada pela largura de um vão de janela.
          </p>
          <p>
            Os danos de área foram contornados com o Contorno IA, que roda no navegador; os de vegetação foram marcados como pontos. Cada dano recebeu gravidade,
            urgência e tendência, e o orçamento saiu da tabela de preços sugerida.
          </p>
          <p className="rounded-2xl bg-muted p-5 text-[15px] leading-7">
            As medidas são estimadas — ninguém foi a campo. Num trabalho real, uma cota medida com trena calibra a vista em segundos e todas as áreas e custos se
            recalculam.
          </p>
        </div>
        <div className="hidden lg:block" />
      </div>

      {/* vistas */}
      <div className="mt-16 grid gap-6 px-4 sm:px-8 lg:grid-cols-[1.35fr_1fr] lg:px-12">
        <figure>
          <div className="overflow-hidden rounded-2xl bg-[#1a1a1a]">
            <DamageMap {...CARMO.convento} alt="Convento do Carmo com os danos mapeados" className="block h-auto w-full" />
          </div>
          <figcaption className="mt-2 text-[13px] text-muted-foreground">Convento — fachada do pátio (2010), 7 danos.</figcaption>
        </figure>
        <figure>
          <div className="overflow-hidden rounded-2xl bg-[#1a1a1a]">
            <DamageMap {...CARMO.igreja} alt="Fachada da igreja retificada com os danos mapeados" className="block h-auto w-full" />
          </div>
          <figcaption className="mt-2 text-[13px] text-muted-foreground">Fachada principal retificada (2010), 4 danos.</figcaption>
        </figure>
      </div>

      {/* prioridades */}
      <div className="mt-16 px-4 sm:px-8 lg:px-12">
        <h2 className="text-[26px] leading-tight font-medium tracking-[-0.02em]">Prioridades e orçamento</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[560px] text-[14px]">
            <thead className="bg-muted/60 text-left text-[12.5px] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Dano</th>
                <th className="px-3 py-3 text-right font-medium">Quantidade</th>
                <th className="px-3 py-3 font-medium">Prioridade (GUT)</th>
                <th className="px-4 py-3 text-right font-medium">Custo</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} />
                      {d.name}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{d.areaM2 != null ? `${d.areaM2.toFixed(2).replace(".", ",")} m²` : "1 un."}</td>
                  <td className="px-3 py-3 tabular-nums">
                    {d.gut} · <span className="text-muted-foreground">{priority(d.gut).label}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(d.costCents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/40 font-medium">
                <td className="px-4 py-3" colSpan={3}>
                  Total
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(CARMO.totalCents)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* depois */}
      <div className="mt-16 grid gap-6 px-4 sm:px-8 lg:grid-cols-2 lg:px-12">
        <figure>
          <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-muted">
            <Image src="/site/carmo-igreja-2010.jpg" alt="Igreja do Carmo em 2010, antes do restauro" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <figcaption className="mt-2 text-[13px] text-muted-foreground">2010 — antes do restauro.</figcaption>
        </figure>
        <figure>
          <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-muted">
            <Image src="/site/carmo-igreja-2021.jpg" alt="Igreja do Carmo em 2021, restaurada" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <figcaption className="mt-2 text-[13px] text-muted-foreground">2021 — restaurada e reaberta ao culto.</figcaption>
        </figure>
      </div>

      <footer className="mt-16 border-t px-4 pt-8 sm:px-8 lg:px-12">
        <p className="text-[13px] font-medium">Fontes e créditos</p>
        <ul className="mt-2 grid gap-1 text-[13px] leading-6 text-muted-foreground">
          {story.credits.map((c) => (
            <li key={c}>{c}</li>
          ))}
          <li>História do imóvel: Wikipedia (pt), “Igreja de Nossa Senhora do Carmo (Horta)”.</li>
        </ul>
        <Link href="/cadastro" className="mt-10 inline-flex h-11 items-center rounded-full bg-foreground px-6 text-[15px] font-medium text-background hover:opacity-85">
          Monte o seu mapa de danos
        </Link>
      </footer>
    </article>
  );
}
