import { cn } from "@/lib/utils";

/**
 * Traçado do símbolo do ArchRay: retângulo com a elipse inclinada VAZADA (transparente), num
 * único caminho com regra par-ímpar — o furo mostra o que estiver atrás, em qualquer fundo.
 */
export const MARK_PATH = "M0 0H723V508H0Z M698.20 97.18A372.4 193.7 -24.82 1 0 22.20 409.82A372.4 193.7 -24.82 1 0 698.20 97.18Z";

/** Símbolo do ArchRay na cor do texto: preto no tema claro, branco no escuro. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 723 508" aria-hidden className={cn("h-6 w-auto text-foreground", className)}>
      <path d={MARK_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** Logotipo "archray" (preto; invertido no tema escuro). */
export function BrandLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/logo.png" alt="ArchRay" width={470} height={120} className={cn("h-6 w-auto dark:invert", className)} />
  );
}
