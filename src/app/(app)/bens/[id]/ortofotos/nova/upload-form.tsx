"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { ImageUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, SimpleSelect } from "@/components/form";
import { fmtBytes } from "@/lib/format";
import { createOrthophoto } from "../actions";

type Props = { siteId: string; orgId: string; elements: { id: string; name: string }[] };

function readSize(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    img.src = url;
  });
}

export function UploadForm({ siteId, orgId, elements }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  async function pick(f: File | undefined) {
    setError(null);
    setFile(null);
    setSize(null);
    if (!f) return;
    if (!["image/jpeg", "image/png"].includes(f.type)) {
      setError("Envie a ortofoto em JPG ou PNG. (GeoTIFF entra numa próxima versão — exporte como JPG no software de origem.)");
      return;
    }
    try {
      setSize(await readSize(f));
      setFile(f);
      if (nameRef.current && !nameRef.current.value) nameRef.current.value = f.name.replace(/\.[^.]+$/, "");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function submit(form: FormData) {
    if (!file || !size) return setError("Escolha a imagem da ortofoto.");
    const name = String(form.get("name") || "").trim();
    const elementId = String(form.get("elementId") || "");
    const mmRaw = String(form.get("mmPerPixel") || "").replace(",", ".");
    const mmPerPixel = mmRaw ? Number(mmRaw) : null;
    if (mmPerPixel !== null && !(mmPerPixel > 0)) return setError("Escala inválida.");
    setError(null);
    start(async () => {
      try {
        const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
        const blob = await upload(`orgs/${orgId}/sites/${siteId}/ortofotos/${safe}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          clientPayload: JSON.stringify({ siteId }),
          multipart: file.size > 20 * 1024 * 1024,
          onUploadProgress: (p) => setProgress(p.percentage),
        });
        await createOrthophoto(siteId, {
          name,
          elementId: elementId && elementId !== "__none" ? elementId : null,
          url: blob.url,
          pathname: blob.pathname,
          contentType: file.type as "image/jpeg" | "image/png",
          width: size.width,
          height: size.height,
          mmPerPixel,
        });
      } catch (e) {
        // redirect() do server action chega aqui como erro especial — deixa passar
        if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
        setError((e as Error).message || "Falha no envio.");
        setProgress(null);
      }
    });
  }

  return (
    <form action={submit} className="grid max-w-2xl gap-6">
      <label
        className="grid cursor-pointer place-items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-10 text-center transition-colors hover:border-brand/50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files[0]);
        }}
      >
        <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand">
          <ImageUp className="size-5" />
        </span>
        {file && size ? (
          <span className="text-sm">
            <b className="font-medium">{file.name}</b>
            <span className="text-muted-foreground"> · {size.width} × {size.height} px · {fmtBytes(file.size)}</span>
          </span>
        ) : (
          <>
            <span className="text-sm font-medium">Arraste a ortofoto aqui ou clique para escolher</span>
            <span className="text-[12.5px] text-muted-foreground">JPG ou PNG, até 200 MB. Imagem retificada (sem perspectiva) da fachada, parede, piso ou forro.</span>
          </>
        )}
        <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="name" className="sm:col-span-2">
          <Input ref={nameRef} id="name" name="name" required placeholder="Ex.: Fachada principal — ortofoto" />
        </Field>
        <Field label="Área">
          <SimpleSelect name="elementId" options={elements.map((e) => ({ value: e.id, label: e.name }))} allowNone noneLabel="Nenhuma" />
        </Field>
        <Field
          label="Escala (mm por pixel)"
          htmlFor="mmPerPixel"
          hint="Opcional — se não souber, calibre no editor com uma medida de trena."
        >
          <Input id="mmPerPixel" name="mmPerPixel" inputMode="decimal" placeholder="Ex.: 2,5" />
        </Field>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || !file}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? (progress !== null && progress < 100 ? `Enviando ${Math.round(progress)}%` : "Salvando…") : "Enviar e abrir no editor"}
        </Button>
        <Button variant="ghost" asChild>
          <Link href={`/bens/${siteId}`}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
