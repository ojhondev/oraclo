import Link from "next/link";
import { Fragment } from "react";
import { AlertTriangle, ExternalLink, Lightbulb } from "lucide-react";
import { GLOSSARY, imageSrc, type AcademyBlock, type AcademyImage } from "@/lib/academy";

const termById = new Map(GLOSSARY.map((t) => [t.id, t]));

/** Texto com **negrito** e [[termo]] / [[termo|texto]] (link para o glossário). */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-medium text-foreground">{part.slice(2, -2)}</strong>;
        if (part.startsWith("[[") && part.endsWith("]]")) {
          const [id, label] = part.slice(2, -2).split("|") as [string, string | undefined];
          const term = termById.get(id);
          return (
            <Link key={i} href={`/academy/glossario#${id}`} title={term?.definition} className="underline decoration-dotted underline-offset-4 hover:text-foreground">
              {label ?? term?.term ?? id}
            </Link>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/** Número das marcas dos prints (mesma cor do print). */
export function MarkBadge({ n }: { n: number }) {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#d97757] text-[11px] font-semibold text-white tabular-nums">{n}</span>
  );
}

function Figure({ img }: { img: AcademyImage }) {
  const src = imageSrc(img.src);
  return (
    <figure className="grid gap-3 lg:-mx-10 xl:-mx-24">
      <a href={src} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-xl border bg-muted" title="Abrir a imagem em tamanho real">
        {/* eslint-disable-next-line @next/next/no-img-element -- prints já otimizados (JPG), servidos como arquivo estático */}
        <img src={src} alt={img.alt} loading="lazy" className="block h-auto w-full" />
        <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-md bg-background/90 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          <ExternalLink className="size-3.5" />
        </span>
      </a>
      {(img.caption || img.marks?.length) && (
        <figcaption className="grid gap-2">
          {img.caption && <p className="text-[13px] text-muted-foreground">{img.caption}</p>}
          {img.marks?.length ? (
            <ol className="grid gap-1.5 sm:grid-cols-2">
              {img.marks.map((m, i) => (
                <li key={m} className="flex items-start gap-2 text-[13px] leading-snug">
                  <MarkBadge n={i + 1} />
                  <span className="pt-px">{m}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </figcaption>
      )}
    </figure>
  );
}

export function Block({ block }: { block: AcademyBlock }) {
  if ("h" in block) return <h2 className="pt-4 text-[19px] font-medium">{block.h}</h2>;
  if ("p" in block)
    return (
      <p className="text-[15px] leading-7 text-foreground/85">
        <Rich text={block.p} />
      </p>
    );
  if ("list" in block)
    return (
      <ul className="grid list-disc gap-1.5 pl-5 text-[15px] leading-7 text-foreground/85 marker:text-muted-foreground">
        {block.list.map((t) => (
          <li key={t}>
            <Rich text={t} />
          </li>
        ))}
      </ul>
    );
  if ("steps" in block)
    return (
      <ol className="grid gap-2.5">
        {block.steps.map((t, i) => (
          <li key={t} className="flex gap-3 rounded-xl border bg-card px-4 py-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-[12px] font-semibold text-background tabular-nums">{i + 1}</span>
            <span className="text-[14.5px] leading-6 text-foreground/85">
              <Rich text={t} />
            </span>
          </li>
        ))}
      </ol>
    );
  if ("img" in block) return <Figure img={block.img} />;
  if ("tip" in block)
    return (
      <div className="flex gap-3 rounded-xl bg-muted/70 px-4 py-3">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-[14px] leading-6 text-foreground/85">
          <Rich text={block.tip} />
        </p>
      </div>
    );
  if ("warn" in block)
    return (
      <div className="flex gap-3 rounded-xl bg-amber-500/10 px-4 py-3 text-amber-950 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p className="text-[14px] leading-6">
          <Rich text={block.warn} />
        </p>
      </div>
    );
  if ("keys" in block)
    return (
      <div className="overflow-hidden rounded-xl border">
        <p className="label border-b bg-muted/50 px-4 py-2">Atalhos</p>
        <dl className="divide-y">
          {block.keys.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-4 py-2 text-[14px]">
              <dt>
                <kbd className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[12px]">{k}</kbd>
              </dt>
              <dd className="text-foreground/85">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  if ("table" in block)
    return (
      <div className="thin-scroll overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[520px] text-left text-[14px]">
          <thead className="bg-muted/50">
            <tr>
              {block.table.head.map((h) => (
                <th key={h} className="px-4 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {block.table.rows.map((r) => (
              <tr key={r.join("|")}>
                {r.map((c, i) => (
                  <td key={i} className="px-4 py-2 align-top text-foreground/85">
                    <Rich text={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return null;
}

/** Barra de progresso fina. */
export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-muted ${className ?? ""}`} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
