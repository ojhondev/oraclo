import type { Metadata } from "next";
import { Camera, CircleDot, Ruler, Repeat, Sun, UploadCloud } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageBody, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "App de captura" };

/** Protocolo de captura v1 (PRD §4 e Fase 0) — o app vai guiar cada passo. */
const STEPS = [
  { icon: CircleDot, title: "Posicione os alvos", text: "Cole 4 a 6 alvos impressos espalhados pela parede ou ambiente, visíveis de vários ângulos." },
  { icon: Ruler, title: "Meça as distâncias de controle", text: "Com trena a laser, meça 3 a 10 distâncias entre pares de alvos e anote no app. É o que dá escala e mede o erro." },
  { icon: Camera, title: "Primeira volta — de longe", text: "Fotografe o conjunto inteiro, andando em arco, com ~70% de sobreposição entre uma foto e a próxima." },
  { icon: Repeat, title: "Segunda volta — de perto", text: "Repita mais próximo, cobrindo detalhes, ornamentos e áreas danificadas. Feche o percurso no ponto de partida." },
  { icon: Sun, title: "Luz e nitidez", text: "Evite contraluz e sombras duras. O app descarta fotos tremidas e avisa onde faltou cobertura." },
  { icon: UploadCloud, title: "Envio", text: "As fotos sobem sozinhas em segundo plano — mesmo sem sinal na igreja, o envio continua quando houver Wi-Fi." },
];

export default async function CaptureAppPage() {
  await requireUser();
  return (
    <>
      <PageHeader
        eyebrow="Celular"
        title="App de captura"
        description="O app do Oraclo transforma o celular em um instrumento de levantamento: ele guia a captura e envia tudo para a plataforma."
        actions={<Badge variant="outline">em desenvolvimento</Badge>}
      />
      <PageBody>
        <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="grid content-start gap-2 rounded-xl border bg-card p-5">
              <span className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand">
                  <Icon className="size-4" />
                </span>
                <span className="label">Passo {i + 1}</span>
              </span>
              <h2 className="font-serif text-xl">{title}</h2>
              <p className="text-[13.5px] text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </PageBody>
    </>
  );
}
