import "server-only";
import { cookies, headers } from "next/headers";
import { SITE_LANG_COOKIE, type Lang } from "./lang";

/** Idioma do site: o escolhido (cookie) ou, na primeira visita, o idioma preferido do navegador. */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(SITE_LANG_COOKIE)?.value;
  if (v === "pt" || v === "en") return v;
  const accept = ((await headers()).get("accept-language") ?? "").toLowerCase();
  const first = accept.split(",")[0]?.trim() ?? "";
  return first.startsWith("en") ? "en" : "pt";
}
