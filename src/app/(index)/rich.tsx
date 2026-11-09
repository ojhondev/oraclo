import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Texto dos artigos com links e negrito no formato curto: [texto](/endereco) e **negrito**.
 * Links internos usam a navegação do Next; externos abrem em nova aba.
 */
export function Rich({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[3]) out.push(<strong key={k++}>{m[3]}</strong>);
    else {
      const href = m[2]!;
      const cls = "underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground";
      out.push(
        href.startsWith("/") ? (
          <Link key={k++} href={href} className={cls}>
            {m[1]}
          </Link>
        ) : (
          <a key={k++} href={href} target="_blank" rel="noopener" className={cls}>
            {m[1]}
          </a>
        ),
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/** Remove a marcação (para resumos, metadados e dados estruturados). */
export const plain = (text: string) => text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");
