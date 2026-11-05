import katex from "katex";
import "katex/dist/katex.min.css";

/** Fórmula renderizada no servidor; rola na horizontal em vez de estourar a tela do celular. */
export function Formula({ tex, className }: { tex: string; className?: string }) {
  const html = katex.renderToString(tex, { displayMode: true, throwOnError: true, strict: "ignore" });
  return <div className={`a-formula ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
