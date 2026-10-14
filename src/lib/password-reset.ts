import "server-only";
import { db, schema } from "@/lib/db";
import { appUrl, emailLayout, newToken, sendEmail } from "@/lib/email";

const RESET_MINUTES = 60;

/**
 * Cria um link de redefinição de senha (uso único, 1 hora) e manda por e-mail.
 * Fica fora de arquivos "use server" de propósito: não pode virar ação chamável pelo navegador.
 */
export async function createResetFor(userId: string, email: string, name: string) {
  const { token, hash } = newToken();
  await db.insert(schema.passwordResets).values({ userId, tokenHash: hash, expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) });
  const url = `${await appUrl()}/redefinir-senha/${token}`;
  const { html, text } = emailLayout({
    title: "Redefinir sua senha",
    intro: `Olá, ${name.split(" ")[0]}. Recebemos um pedido para criar uma nova senha para a sua conta no Oraclo.`,
    button: "Criar nova senha",
    url,
    footer: "O link vale por 1 hora e só pode ser usado uma vez. Se não foi você, ignore este e-mail — sua senha atual continua valendo.",
  });
  const r = await sendEmail({ to: email, subject: "Redefinir sua senha no Oraclo", html, text });
  return { sent: r.sent, url };
}
