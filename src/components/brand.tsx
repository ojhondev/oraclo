import { cn } from "@/lib/utils";

/**
 * Símbolo do Oraclo: elipse inclinada vazada num retângulo. Vetorizado do arquivo
 * original (public/brand) — usa as cores do tema, então inverte sozinho no modo escuro.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 723 508" aria-hidden className={cn("h-6 w-auto", className)}>
      <rect width="723" height="508" fill="var(--foreground)" />
      <ellipse cx="360.2" cy="253.5" rx="372.4" ry="193.7" transform="rotate(-24.82 360.2 253.5)" fill="var(--background)" />
    </svg>
  );
}

/** Logotipo "oraclo" (preto; invertido no tema escuro). */
export function BrandLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/logo.png" alt="Oraclo" width={468} height={120} className={cn("h-6 w-auto dark:invert", className)} />
  );
}
