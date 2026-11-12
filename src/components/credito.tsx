/**
 * Assinatura "Desenvolvido por @devjhon" — leva para www.devjhon.tech.
 * P&B discreta; no hover a foto ganha cor e o texto gira no lugar,
 * virando o selo "Crie seu site ou aplicativo agora, fale comigo".
 * Em telas de toque (sem hover) os dois se alternam sozinhos.
 *
 * Uso: <Credito site="Nome do Site" />
 * Requer: /public/ojhondev.webp e o arquivo credito.css importado.
 */
const SITE = "https://www.devjhon.tech";

export function Credito({ site }: { site?: string }) {
  return (
    <a
      href={SITE}
      target="_blank"
      rel="noopener"
      className="credito"
      aria-label={`${site ? `${site} — d` : "D"}esenvolvido por @devjhon. Crie seu site ou aplicativo: www.devjhon.tech`}
    >
      <span className="credito-avatar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ojhondev.webp" alt="" width={32} height={32} className="credito-foto" />
        <span className="credito-ponto" />
      </span>
      <span className="credito-troca" aria-hidden>
        <span className="credito-texto">
          Desenvolvido por <strong>@devjhon</strong>
        </span>
        <span className="credito-cta">Crie seu site ou aplicativo agora, fale comigo</span>
      </span>
    </a>
  );
}
