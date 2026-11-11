/**
 * Assinatura "Desenvolvido por @ojhondev".
 * P&B discreta; no hover a foto ganha cor e o texto gira no lugar,
 * virando o selo "Crie seu site ou aplicativo agora, fale comigo".
 * Em telas de toque (sem hover) os dois se alternam sozinhos.
 *
 * Uso: <Credito site="Nome do Site" />
 * Requer: /public/ojhondev.webp e o arquivo credito.css importado.
 */
const WHATSAPP = "5514998570045";

export function Credito({ site = "seu site" }: { site?: string }) {
  const link = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Olá, Jhonatan! Vi o site ${site} e quero criar meu site ou aplicativo.`,
  )}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="credito"
      aria-label="Desenvolvido por @ojhondev — crie seu site ou aplicativo agora, fale comigo no WhatsApp"
    >
      <span className="credito-avatar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ojhondev.webp" alt="" width={32} height={32} className="credito-foto" />
        <span className="credito-ponto" />
      </span>
      <span className="credito-troca" aria-hidden>
        <span className="credito-texto">
          Desenvolvido por <strong>@ojhondev</strong>
        </span>
        <span className="credito-cta">Crie seu site ou aplicativo agora, fale comigo</span>
      </span>
    </a>
  );
}
