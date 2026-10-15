import "server-only";
import crypto from "node:crypto";
import { headers } from "next/headers";

/**
 * Envio de e-mail pela API do Resend (sem SDK). Sem RESEND_API_KEY + EMAIL_FROM roda em
 * **modo simulado**: nada é enviado, o conteúdo vai para o log do servidor e quem chama
 * recebe `sent: false` (a UI então mostra o link para copiar, quando isso for seguro).
 */
export const emailEnabled = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export async function sendEmail(msg: { to: string; subject: string; html: string; text: string }) {
  if (!emailEnabled()) {
    console.info(`[email simulado] para=${msg.to} assunto="${msg.subject}"\n${msg.text}`);
    return { sent: false as const };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
  });
  if (!res.ok) {
    console.error("[email] falha no envio", res.status, await res.text().catch(() => ""));
    return { sent: false as const, error: `Falha no envio do e-mail (${res.status}).` };
  }
  return { sent: true as const };
}

/** URL pública do app (para links em e-mails): APP_URL ou o host da requisição. */
export async function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "oraclo-app.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Token aleatório para o link + hash guardado no banco (o token em si nunca é salvo). */
export function newToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Layout simples em preto e branco, compatível com clientes de e-mail. */
export function emailLayout({ title, intro, button, url, footer }: { title: string; intro: string; button: string; url: string; footer: string }) {
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#ffffff;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0a0a0a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:480px" cellpadding="0" cellspacing="0">
<tr><td style="font-size:22px;font-weight:600;letter-spacing:-0.02em;padding-bottom:28px">archray</td></tr>
<tr><td style="font-size:20px;font-weight:500;padding-bottom:12px">${esc(title)}</td></tr>
<tr><td style="font-size:15px;line-height:1.55;color:#3a3a3a;padding-bottom:24px">${esc(intro)}</td></tr>
<tr><td style="padding-bottom:24px"><a href="${esc(url)}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:15px;padding:12px 22px;border-radius:999px">${esc(button)}</a></td></tr>
<tr><td style="font-size:12.5px;line-height:1.5;color:#6b6b6b">${esc(footer)}<br><br>Se o botão não funcionar, copie este endereço:<br><span style="word-break:break-all">${esc(url)}</span></td></tr>
</table></td></tr></table></body></html>`;
  const text = `${title}\n\n${intro}\n\n${button}: ${url}\n\n${footer}`;
  return { html, text };
}
