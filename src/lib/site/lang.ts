/** Idiomas do site público. O app (área logada) continua em português. */
export type Lang = "pt" | "en";
export const LANGS: Lang[] = ["pt", "en"];

/** Cookie com o idioma escolhido no site ("pt" | "en"). Sem cookie: idioma do navegador. */
export const SITE_LANG_COOKIE = "archray_lang";

/** Locale para datas e números. */
export const locale = (lang: Lang) => (lang === "en" ? "en-US" : "pt-BR");

/** Escolhe o texto do idioma: tr(lang, { pt: "…", en: "…" }). */
export const tr = <T,>(lang: Lang, v: { pt: T; en: T }): T => v[lang];
