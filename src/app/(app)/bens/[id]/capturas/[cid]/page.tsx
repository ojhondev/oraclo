import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { capturers, editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { CHECKLIST, getCaptureDetail, IMPORT_DEVICE } from "@/lib/captures";
import { fmtBytes, fmtDate } from "@/lib/format";
import { captureModes } from "@/lib/labels";
import { CaptureWorkspace } from "./workspace";
import { CaptureResults } from "./results";

export const metadata: Metadata = { title: "Captura" };

export default async function CapturePage({ params }: PageProps<"/bens/[id]/capturas/[cid]">) {
  const { id, cid } = await params;
  const user = await requireUser();
  const site = await getSite(user.orgId, id);
  const { capture, campaign, elementName, files, distances, results, report } = await getCaptureDetail(id, cid);

  return (
    <div className="px-4 pt-5 pb-16 sm:px-8 lg:px-10">
      <div className="mx-auto mb-5 grid max-w-2xl gap-1">
        <Link href={`/bens/${id}`} className="mb-2 inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {site.name}
        </Link>
        <p className="label">
          {campaign.name} · {fmtDate(campaign.date)}
        </p>
        <h1 className="h-display text-[24px] sm:text-[28px]">{elementName ?? "Captura sem área definida"}</h1>
        <p className="text-[13px] text-muted-foreground">
          {capture.mode === "laser"
            ? "Modelo 3D importado (laser, drone ou outro software)"
            : capture.device === IMPORT_DEVICE
              ? `Fotos enviadas do computador · ${capture.fileCount} fotos · ${fmtBytes(capture.totalBytes)}`
              : `${captureModes[capture.mode]}${capture.device ? ` · ${capture.device}` : ""} · ${capture.fileCount} fotos · ${fmtBytes(capture.totalBytes)}`}
        </p>
      </div>
      {capture.mode !== "laser" && (
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
        importMode={capture.device === IMPORT_DEVICE}
      />
      )}
      {(results.length > 0 || capture.mode === "laser" || (editors.includes(user.role) && capture.status !== "rascunho")) && (
        <div className="mx-auto mt-4 max-w-2xl">
          <CaptureResults
            siteId={id}
            orgId={user.orgId}
            captureId={cid}
            status={capture.status}
            results={results}
            report={report}
            distances={distances}
            canEdit={editors.includes(user.role)}
            imported={capture.mode === "laser"}
          />
        </div>
      )}
    </div>
  );
}
