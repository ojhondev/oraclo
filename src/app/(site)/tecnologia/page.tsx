import type { Metadata } from "next";
import Link from "next/link";
import { getLang } from "@/lib/site/get-lang";
import { SITE } from "@/lib/site/site-copy";
import { fmtPostDate, getPosts } from "@/lib/updates";
import { SCIENCE } from "@/lib/site/science";
import { Formula } from "@/components/site/formula";
import { EngBand, EngCta, EngHead, EngPageHero, EngPinnedSteps, type Step } from "@/components/eng/blocks";
import type { ObjectName } from "@/components/eng/contour";

export async function generateMetadata(): Promise<Metadata> {
  const t = SITE[await getLang()].tech;
  return { title: t.metaTitle, description: t.statement, alternates: { canonical: "/tecnologia" } };
}

// objeto em curvas de nível de cada frente técnica
const OBJECT: Record<string, ObjectName> = {
  captura: "celular",
  retificacao: "fachada",
  deteccao: "notebook",
  contorno: "igreja",
  comparacao: "torre",
  laudo: "laudo",
};

/** Nossa Tecnologia (v2): topo escuro, frentes técnicas presas na tela, transformação, matemática, IA e diferenciais. */
export default async function TechPage() {
  const lang = await getLang();
  const en = lang === "en";
  const t = SITE[lang].tech;
  const sci = SCIENCE[lang];
  const posts = getPosts(lang);

  const steps: Step[] = t.items.map((it, i) => ({
    id: it.id,
    eyebrow: `${String(i + 1).padStart(2, "0")} · ${it.name}`,
    title: it.summary,
    text: it.bullets[0]!,
    bullets: it.bullets.slice(1, 4),
    cta: it.more ? { href: it.more.href, label: it.more.label } : undefined,
    object: OBJECT[it.id] ?? "fachada",
  }));

  return (
    <>
      <EngPageHero
        eyebrow={t.title}
        title={t.headline}
        text={t.statement}
        object="notebook"
        video="fachada"
        ctas={[
          { href: "/contato", label: en ? "Request a diagnosis" : "Solicitar diagnóstico" },
          { href: "/docs", label: en ? "Documentation" : "Documentação" },
        ]}
      />

      <EngPinnedSteps steps={steps} eyebrow={t.sectionsLabel} title={t.sectionsTitle} id="fundamentos" />

      {/* a transformação: antes e depois, linha a linha */}
      <EngBand tone="white" id="transformacao">
        <EngHead eyebrow={sci.transform.label} title={sci.transform.title} text={sci.transform.text} />
        <div className="mt-16 border-t border-black">
          <div className="hidden gap-6 border-b py-3 font-mono text-[11px] tracking-[0.05em] text-[#575757] uppercase md:grid md:grid-cols-[1fr_1.5fr_1.8fr]">
            <span />
            <span>{sci.transform.before}</span>
            <span>{sci.transform.after}</span>
          </div>
          {sci.transform.rows.map(([topic, before, after]) => (
            <div key={topic} className="grid gap-2 border-b py-6 md:grid-cols-[1fr_1.5fr_1.8fr] md:gap-6" data-reveal>
              <p className="eng-eyebrow md:self-center">{topic}</p>
              <p className="text-[16px] leading-6 text-[#575757] line-through decoration-black/20 md:self-center md:no-underline">{before}</p>
              <p className="text-[19px] leading-snug sm:text-[21px]">{after}</p>
            </div>
          ))}
        </div>
      </EngBand>

      {/* a matemática de cada frente */}
      <EngBand tone="mist" id="matematica">
        <EngHead eyebrow={en ? "Under the hood" : "Por dentro"} title={en ? "The mathematics behind each step." : "A matemática por trás de cada etapa."} />
        <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {t.items.map((it, i) => (
            <article key={it.id} className="flex min-w-0 flex-col rounded-[16px] bg-white p-7" data-reveal data-reveal-delay={(i % 3) * 70}>
              <p className="eng-eyebrow">
                {String(i + 1).padStart(2, "0")} · {it.status}
              </p>
              <h3 className="mt-6 text-[22px] leading-[1.2]">{it.name}</h3>
              <ul className="mt-5 grid gap-4">
                {(sci.math[it.id] ?? []).map((eq) => (
                  <li key={eq.tex} className="min-w-0">
                    <Formula tex={eq.tex} className="a-formula-box" />
                    <p className="mt-2 text-[13.5px] leading-6 text-[#575757]">{eq.note}</p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </EngBand>

      {/* a IA em cada etapa */}
      <EngBand tone="dark" id="ia">
        <EngHead eyebrow={sci.ai.label} title={sci.ai.title} text={sci.ai.text} dark />
        <div className="mt-16 border-t border-white/30">
          <div className="hidden gap-6 border-b border-white/15 py-3 font-mono text-[11px] tracking-[0.05em] text-white/50 uppercase lg:grid lg:grid-cols-[1fr_1.4fr_1.3fr_1.4fr_1.4fr]">
            {sci.ai.headers.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {sci.ai.rows.map((row) => (
            <dl key={row.step} className="grid gap-3 border-b border-white/15 py-6 lg:grid-cols-[1fr_1.4fr_1.3fr_1.4fr_1.4fr] lg:gap-6" data-reveal>
              <div>
                <dt className="sr-only">{sci.ai.headers[0]}</dt>
                <dd className="text-[19px] leading-snug">{row.step}</dd>
              </div>
              {[row.method, row.nature, row.role, row.human].map((v, i) => (
                <div key={i} className="min-w-0">
                  <dt className="font-mono text-[11px] tracking-[0.05em] text-white/45 uppercase lg:sr-only">{sci.ai.headers[i + 1]}</dt>
                  <dd className="mt-1 text-[14.5px] leading-6 text-white/75 lg:mt-0">{v}</dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
        <p className="mt-8 max-w-[80ch] text-[15px] leading-6 text-white/55">{sci.ai.note}</p>
      </EngBand>

      {/* diferenciais */}
      <EngBand tone="white" id="diferenciais">
        <EngHead eyebrow={sci.diff.label} title={sci.diff.title} text={sci.diff.text} />
        <div className="mt-16 border-t border-black">
          <div className="hidden gap-6 border-b py-3 font-mono text-[11px] tracking-[0.05em] text-[#575757] uppercase lg:grid lg:grid-cols-[1fr_1.4fr_1.6fr_1.6fr]">
            {sci.diff.headers.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {sci.diff.rows.map(([aspect, ...cells]) => (
            <dl key={aspect} className="grid gap-3 border-b py-6 lg:grid-cols-[1fr_1.4fr_1.6fr_1.6fr] lg:gap-6" data-reveal>
              <div>
                <dt className="sr-only">{sci.diff.headers[0]}</dt>
                <dd className="text-[18px] leading-snug">{aspect}</dd>
              </div>
              {cells.map((v, i) => (
                <div key={i} className="min-w-0">
                  <dt className="font-mono text-[11px] tracking-[0.05em] text-[#575757] uppercase lg:sr-only">{sci.diff.headers[i + 1]}</dt>
                  <dd className={i === 2 ? "mt-1 text-[15px] leading-6 lg:mt-0" : "mt-1 text-[14.5px] leading-6 text-[#575757] lg:mt-0"}>{v}</dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
        <p className="mt-8 max-w-[80ch] text-[15px] leading-6 text-[#575757]">{sci.diff.note}</p>
      </EngBand>

      {/* publicações */}
      <EngBand tone="mist">
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-[clamp(30px,3.8vw,56px)] leading-[1.06] tracking-[-0.025em]">{t.postsLabel}</h2>
          <span className="eng-eyebrow">{t.postsCount(posts.length)}</span>
        </div>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/index/${p.slug}`} className="group flex h-full min-h-[240px] flex-col rounded-[16px] bg-white p-7 hover:bg-[#fafafa]">
                <p className="eng-eyebrow">
                  {p.category} · {fmtPostDate(p.date, "short", lang)}
                </p>
                <h3 className="mt-auto pt-10 text-[20px] leading-[1.25] group-hover:underline group-hover:underline-offset-4">{p.title}</h3>
                <p className="mt-3 line-clamp-3 text-[14.5px] leading-6 text-[#575757]">{p.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </EngBand>

      <EngCta
        title={en ? "See it working on your façade." : "Veja funcionando na sua fachada."}
        text={en ? "Tell us about the building. An architect from Estúdio Restaura replies with the path to a diagnosis." : "Conte sobre o edifício. Um arquiteto do Estúdio Restaura responde com o caminho do diagnóstico."}
        cta={{ href: "/contato", label: en ? "Request a diagnosis" : "Solicitar diagnóstico" }}
        object="fachada"
      />
    </>
  );
}
