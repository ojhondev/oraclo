"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import type { Lang } from "@/lib/site/lang";
import { whatsappUrl } from "@/lib/site/whatsapp";

const KEY = "archray_aviso_analise";

const TEXT: Record<Lang, { msg: string; talk: string; close: string }> = {
  pt: {
    msg: "Todo projeto passa por uma análise prévia: edificações muito altas, complexas ou que exigem precisão milimétrica podem pedir laser scanner, e nesses casos indicamos por laser scanner convencional.",
    talk: "Fale com nosso time para saber mais.",
    close: "Fechar aviso",
  },
  en: {
    msg: "Every project goes through a prior assessment: very tall or complex buildings, or ones that need millimetre precision, may call for a laser scan, and in those cases we recommend a conventional laser scanner.",
    talk: "Talk to our team to learn more.",
    close: "Close notice",
  },
};

/**
 * Faixa fixa no rodapé da tela com o aviso de análise prévia (o serviço não serve para todo porte de
 * obra). Fecha com um clique e a escolha fica salva neste navegador.
 */
export function SiteNotice({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let closed = false;
    try {
      closed = localStorage.getItem(KEY) === "1";
    } catch {}
    if (closed) return;
    const id = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(id);
  }, []);
  if (!open) return null;
  const t = TEXT[lang];
  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };
  return (
    <div role="note" className="site-notice fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-[880px] items-start gap-3 rounded-[12px] border border-black/10 bg-white py-3 pr-2 pl-4 text-black shadow-[0_12px_40px_rgb(0_0_0/0.45)] sm:items-center sm:bottom-5">
      <Info className="mt-0.5 size-4 shrink-0 text-black/60 sm:mt-0" />
      <p className="flex-1 text-[13px] leading-[1.45] text-black/85 sm:text-[14px]">
        {t.msg}{" "}
        <a href={whatsappUrl(lang)} target="_blank" rel="noreferrer" className="font-medium text-black underline underline-offset-2 hover:no-underline">
          {t.talk}
        </a>
      </p>
      <button type="button" onClick={close} aria-label={t.close} className="grid size-8 shrink-0 place-items-center rounded-[8px] text-black/60 hover:bg-black/5 hover:text-black">
        <X className="size-4" />
      </button>
    </div>
  );
}
