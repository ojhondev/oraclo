import type { Lang } from "./lang";

/** WhatsApp comercial do ArchRay (Estúdio Restaura), no formato internacional do wa.me. */
export const WHATSAPP_NUMBER = "5514998570045";

const MESSAGE: Record<Lang, string> = {
  pt: "Olá! Vim pelo site do ArchRay e preciso de um orçamento.",
  en: "Hi! I came from the ArchRay website and I need a quote.",
};

/** Rótulo do botão de orçamento em todo o site. */
export const WHATSAPP_LABEL: Record<Lang, string> = {
  pt: "Orçamento no WhatsApp",
  en: "Quote on WhatsApp",
};

/** Link que abre a conversa no WhatsApp com a mensagem já escrita. */
export function whatsappUrl(lang: Lang = "pt") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE[lang])}`;
}

/** Atributos para abrir links externos (WhatsApp, sites parceiros) em nova aba. */
export const externalProps = (href: string) => (href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {});
