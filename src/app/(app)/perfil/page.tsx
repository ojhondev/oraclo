import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { roles } from "@/lib/labels";
import { PageBody, PageHeader } from "@/components/page-header";
import { PasswordForm, ProfileForm } from "./forms";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [u] = await db
    .select({ professionalId: schema.users.professionalId })
    .from(schema.users)
    .where(eq(schema.users.id, user.id));
  const stamp = `${user.name}${u?.professionalId ? ` · ${u.professionalId}` : ""}`;

  return (
    <>
      <PageHeader eyebrow={`${user.orgName} · ${roles[user.role]}`} title="Meu perfil" />
      <PageBody className="grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="grid content-start gap-5 rounded-xl border bg-card p-5">
          <div>
            <h2 className="font-serif text-2xl">Dados do responsável técnico</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Saem no carimbo das pranchas de mapa de danos que você gerar.</p>
          </div>
          <ProfileForm name={user.name} email={user.email} professionalId={u?.professionalId ?? null} />
        </section>

        <div className="grid content-start gap-5">
          <section className="grid gap-2 rounded-xl border bg-card p-5">
            <p className="label">Prévia no carimbo</p>
            <div className="rounded-md border border-foreground/70 p-3 font-[Helvetica,Arial,sans-serif]">
              <p className="text-[9px] font-bold tracking-wide text-muted-foreground">RESPONSÁVEL</p>
              <p className="text-[13px]">{stamp}</p>
            </div>
          </section>
          <section className="grid gap-4 rounded-xl border bg-card p-5">
            <h2 className="font-serif text-2xl">Senha</h2>
            <PasswordForm />
          </section>
        </div>
      </PageBody>
    </>
  );
}
