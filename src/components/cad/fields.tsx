"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export const fmtM = (n: number, d = 3) => (Number.isFinite(n) ? n.toFixed(d).replace(/\.?0+$/, "").replace(".", ",") : "");

/** Campo numérico (metros ou graus): aceita vírgula ou ponto, confirma no Enter ou ao sair; setas ajustam. */
export function NumField({ label, value, onCommit, step = 0.01, min, suffix, className, autoFocus }: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  step?: number;
  min?: number;
  suffix?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState(fmtM(value));
  const [last, setLast] = useState(value);
  if (last !== value) {
    setLast(value);
    setText(fmtM(value));
  }
  const commit = (raw = text) => {
    const v = Number(raw.replace(",", "."));
    if (Number.isFinite(v) && (min === undefined || v >= min) && Math.abs(v - value) > 1e-9) onCommit(Math.round(v * 10000) / 10000);
    else setText(fmtM(value));
  };
  return (
    <label className={cn("grid gap-0.5", className)}>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="flex items-center rounded-md border bg-background focus-within:ring-1 focus-within:ring-ring">
        <input
          autoFocus={autoFocus}
          value={text}
          inputMode="decimal"
          onChange={(e) => setText(e.target.value)}
          onBlur={() => commit()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setText(fmtM(value));
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              const v = value + (e.key === "ArrowUp" ? step : -step);
              if (min === undefined || v >= min) onCommit(Math.round(v * 10000) / 10000);
            }
          }}
          className="h-7 w-full min-w-0 bg-transparent px-2 text-[12.5px] tabular-nums outline-none"
        />
        {suffix && <span className="pr-2 text-[11px] text-muted-foreground">{suffix}</span>}
      </span>
    </label>
  );
}
