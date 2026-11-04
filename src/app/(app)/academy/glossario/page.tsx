import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY, LESSONS } from "@/lib/academy";
import { PageBody, PageHeader } from "@/components/page-header";
import { GlossaryList } from "./glossary-list";

export const metadata: Metadata = { title: "Glossário · Academy" };

export default function GlossaryPage() {
  const titles = Object.fromEntries(LESSONS.map((l) => [l.id, l.title]));
  return (
    <>
      <PageHeader
        eyebrow="ArchRay Academy"
        title="Glossário"
        description={
          <>
            Os termos da plataforma, em linguagem simples, com as aulas onde cada um aparece.{" "}
            <Link href="/academy" className="underline underline-offset-4">
              Voltar à Academy
            </Link>
          </>
        }
      />
      <PageBody className="max-w-3xl">
        <GlossaryList terms={GLOSSARY} titles={titles} />
      </PageBody>
    </>
  );
}
