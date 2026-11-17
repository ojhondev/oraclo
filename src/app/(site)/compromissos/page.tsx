import type { Metadata } from "next";
import { getLang } from "@/lib/site/get-lang";
import { SITE } from "@/lib/site/site-copy";
import { EngCta, EngPageHero, EngPinnedSteps, type Step } from "@/components/eng/blocks";
import type { ObjectName } from "@/components/eng/contour";

export async function generateMetadata(): Promise<Metadata> {
  const t = SITE[await getLang()].commitments;
  return { title: t.metaTitle, description: t.statement, alternates: { canonical: "/compromissos" } };
}

const OBJ: Record<string, ObjectName> = { precisao: "fachada", revisao: "notebook", transparencia: "laudo", dados: "torre" };

/** Compromissos (v2): topo escuro e um compromisso por etapa, presos na tela. */
export default async function CommitmentsPage() {
  const lang = await getLang();
  const en = lang === "en";
  const t = SITE[lang].commitments;
  const steps: Step[] = t.items.map((it, i) => ({ id: it.id, eyebrow: `${String(i + 1).padStart(2, "0")} · ${it.title}`, title: it.title, text: it.text, object: OBJ[it.id] ?? "fachada" }));
  return (
    <>
      <EngPageHero eyebrow={t.metaTitle} title={en ? "Trust is measured, not promised." : "Confiança se mede, não se promete."} text={t.statement} object="laudo" />
      <EngPinnedSteps steps={steps} eyebrow={t.metaTitle} />
      <EngCta
        title={en ? "Questions about method or data?" : "Dúvidas sobre método ou dados?"}
        text={en ? "Talk to the team. We explain how each number is produced." : "Fale com a equipe. Explicamos como cada número é produzido."}
        cta={{ href: "/contato", label: en ? "Talk to us" : "Fale com a gente" }}
        object="laudo"
      />
    </>
  );
}
