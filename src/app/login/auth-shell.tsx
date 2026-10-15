import { BrandLogo } from "@/components/brand";

/** Moldura das telas de entrada: cartão central minimalista sobre o papel claro. */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo className="mb-6 h-8" />
          <p className="mb-1 text-[13px] text-muted-foreground">{eyebrow}</p>
          <h1 className="text-[26px] leading-tight font-normal tracking-[-0.015em]">{title}</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-(--shadow-soft)">{children}</div>
        <p className="mt-6 text-center text-[14px] text-muted-foreground">{footer}</p>
      </div>
      <p className="mt-10 max-w-sm text-center text-[12.5px] text-muted-foreground/80">
        ArchRay · mapa de danos com IA — aponte os danos, e o orçamento e o laudo saem prontos.
      </p>
    </div>
  );
}
