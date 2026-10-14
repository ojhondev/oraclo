import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { capturers, editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { CHECKLIST, getCaptureDetail } from "@/lib/captures";
import { fmtBytes, fmtDate } from "@/lib/format";
import { captureModes } from "@/lib/labels";
import { CaptureWorkspace } from "./workspace";

export const metadata: Metadata = { title: "Captura" };

export default async function CapturePage({ params }: PageProps<"/bens/[id]/capturas/[cid]">) {
  const { id, cid } = await params;
  const user = await requireUser();
  const site = await getSite(user.orgId, id);
  const { capture, campaign, elementName, files, distances } = await getCaptureDetail(id, cid);

  return (
    <div className="px-4 pt-5 pb-16 sm:px-8 lg:px-10">
      <div className="mx-auto mb-5 grid max-w-2xl gap-1">
        <Link href={`/bens/${id}`} className="mb-2 inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {site.name}
        </Link>
        <p className="label">
          {campaign.name} · {fmtDate(campaign.date)}
        </p>
        <h1 className="h-display text-[24px] sm:text-[28px]">{elementName ?? "Captura sem parte definida"}</h1>
        <p className="text-[13px] text-muted-foreground">
          {captureModes[capture.mode]}
          {capture.device && ` · ${capture.device}`} · {fmtBytes(capture.totalBytes)} enviados
        </p>
      </div>
      <CaptureWorkspace
        siteId={id}
        orgId={user.orgId}
        capture={capture}
        checklistItems={CHECKLIST}
        distances={distances}
        files={files.map((f) => ({ id: f.id, url: f.url, sharpness: f.sharpness, pass: f.pass, width: f.width, height: f.height, bytes: f.bytes }))}
        canCapture={capturers.includes(user.role)}
        canEdit={editors.includes(user.role)}
        isAdmin={user.role === "admin"}
      />
    </div>
  );
}
