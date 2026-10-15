"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { Camera, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, SimpleSelect } from "@/components/form";
import { outputSize, rectify, type Pt } from "@/lib/rectify";
import { createOrthophoto } from "../actions";

type Opt = { id: string; name: string };
type Props = { siteId: string; orgId: string; elements: Opt[]; campaigns: Opt[]; defaultCampaignId?: string | null };

const LABELS = ["superior esquerdo", "superior direito", "inferior direito", "inferior esquerdo"];
const num = (v: FormDataEntryValue | null) => Number(String(v ?? "").replace(",", "."));

/** Ordena 4 pontos quaisquer em SE, SD, ID, IE (o usuário pode clicar em qualquer ordem). */
function order(pts: Pt[]): Pt[] {
  const cx = pts.reduce((s, p) => s + p[0], 0) / 4;
  const cy = pts.reduce((s, p) => s + p[1], 0) / 4;
  const sorted = [...pts].sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
  // começa pelo de menor x+y (superior esquerdo); atan2 em coordenadas de tela já gira no sentido horário
  const start = sorted.reduce((best, p, i) => (p[0] + p[1] < sorted[best]![0] + sorted[best]![1] ? i : best), 0);
  return [0, 1, 2, 3].map((k) => sorted[(start + k) % 4]!);
}

export function Rectifier({ siteId, orgId, elements, campaigns, defaultCampaignId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [pts, setPts] = useState<Pt[]>([]);
  const [drag, setDrag] = useState<number | null>(null);
  const [dims, setDims] = useState({ w: "", h: "" });
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (img) URL.revokeObjectURL(img.src);
  }, [img]);

  function pick(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      return setError("Use uma foto JPG, PNG ou WebP. (No iPhone, em Ajustes › Câmera › Formatos, escolha \"Mais compatível\".)");
    }
    const im = new Image();
    im.onload = () => {
      setImg(im);
      setFile(f);
      // cantos iniciais num retângulo interno — o usuário arrasta até os cantos reais
      const { naturalWidth: W, naturalHeight: H } = im;
      setPts([
        [W * 0.2, H * 0.2],
        [W * 0.8, H * 0.2],
        [W * 0.8, H * 0.8],
        [W * 0.2, H * 0.8],
      ]);
      if (nameRef.current && !nameRef.current.value) nameRef.current.value = f.name.replace(/\.[^.]+$/, "");
    };
    im.onerror = () => setError("Não foi possível ler a foto.");
    im.src = URL.createObjectURL(f);
  }

  function toImage(e: { clientX: number; clientY: number }): Pt | null {
    const box = boxRef.current;
    if (!box || !img) return null;
    const r = box.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * img.naturalWidth;
    const y = ((e.clientY - r.top) / r.height) * img.naturalHeight;
    return [Math.max(0, Math.min(img.naturalWidth, x)), Math.max(0, Math.min(img.naturalHeight, y))];
  }

  const w = num(dims.w);
  const h = num(dims.h);
  const ready = img && pts.length === 4 && w > 0 && h > 0;
  const preview = ready ? outputSize(order(pts), w, h) : null;

  function submit(form: FormData) {
    if (!file || !img || !ready) return setError("Marque os 4 cantos e informe largura e altura reais.");
    const name = String(form.get("name") || "").trim();
    if (name.length < 2) return setError("Dê um nome à vista.");
    const elementId = String(form.get("elementId") || "");
    const campaignId = String(form.get("campaignId") || "");
    const corners = order(pts);
    setError(null);
    start(async () => {
      try {
        setStage("Corrigindo a perspectiva… 0%");
        const out = await rectify(img, corners, w, h, (p) => setStage(`Corrigindo a perspectiva… ${Math.round(p * 100)}%`));
        const blob = await new Promise<Blob>((res, rej) =>
          out.canvas.toBlob((b) => (b ? res(b) : rej(new Error("Falha ao gerar a imagem."))), "image/jpeg", 0.9),
        );
        const base = `orgs/${orgId}/sites/${siteId}/vistas/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "fachada"}`;
        const opts = { access: "public" as const, handleUploadUrl: "/api/upload", clientPayload: JSON.stringify({ siteId }) };
        let sourceUrl: string | null = null;
        if (file.type === "image/jpeg" || file.type === "image/png") {
          setStage("Enviando a foto original…");
          sourceUrl = (await upload(`${base}-original.${file.type === "image/png" ? "png" : "jpg"}`, file, { ...opts, multipart: file.size > 20 * 1024 * 1024 })).url;
        }
        setStage("Enviando a fachada retificada…");
        const res = await upload(`${base}-retificada.jpg`, blob, {
          ...opts,
          contentType: "image/jpeg",
          multipart: blob.size > 20 * 1024 * 1024,
          onUploadProgress: (p) => setStage(`Enviando a fachada retificada… ${Math.round(p.percentage)}%`),
        });
        setStage("Salvando…");
        await createOrthophoto(siteId, {
          name,
          kind: "fachada",
          elementId: elementId && elementId !== "__none" ? elementId : null,
          campaignId: campaignId && campaignId !== "__none" ? campaignId : null,
          url: res.url,
          pathname: res.pathname,
          contentType: "image/jpeg",
          width: out.width,
          height: out.height,
          mmPerPixel: out.mmPerPixel,
          sourceUrl,
          rectification: { corners, widthM: w, heightM: h, srcW: img.naturalWidth, srcH: img.naturalHeight },
        });
      } catch (e) {
        if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
        setError((e as Error).message || "Falha ao retificar.");
        setStage(null);
      }
    });
  }

  const W = img?.naturalWidth ?? 1;
  const H = img?.naturalHeight ?? 1;
  const ordered = pts.length === 4 ? order(pts) : pts;
  const handle = Math.max(W, H) / 70;

  return (
    <form action={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid content-start gap-3">
        {!img ? (
          <label
            className="grid cursor-pointer place-items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-16 text-center transition-colors hover:border-foreground/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pick(e.dataTransfer.files[0]);
            }}
          >
            <span className="grid size-11 place-items-center rounded-full bg-muted">
              <Camera className="size-5" />
            </span>
            <span className="text-sm font-medium">Escolha ou tire a foto da fachada</span>
            <span className="max-w-md text-[12.5px] text-muted-foreground">
              Fotografe o mais de frente possível, com a parede inteira no quadro. Pode ser do celular — a perspectiva é
              corrigida aqui.
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        ) : (
          <>
            <p className="text-[13px] text-muted-foreground">
              Arraste os 4 pontos até os cantos de um retângulo real da parede (cantos da fachada, de uma janela grande, de
              um painel). Depois informe a largura e a altura reais desse retângulo.
            </p>
            <div
              ref={boxRef}
              className="relative w-full touch-none select-none overflow-hidden rounded-xl border bg-muted"
              style={{ aspectRatio: `${W} / ${H}` }}
              onPointerMove={(e) => {
                if (drag === null) return;
                const p = toImage(e);
                if (p) setPts((cur) => cur.map((q, i) => (i === drag ? p : q)));
              }}
              onPointerUp={() => setDrag(null)}
              onPointerLeave={() => setDrag(null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" className="absolute inset-0 size-full" draggable={false} />
              <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" preserveAspectRatio="none">
                {ordered.length === 4 && (
                  <polygon
                    points={ordered.map((p) => p.join(",")).join(" ")}
                    fill="rgba(255,255,255,0.12)"
                    stroke="white"
                    strokeWidth={handle / 4}
                    style={{ filter: "drop-shadow(0 0 2px black)" }}
                  />
                )}
                {pts.map((p, i) => (
                  <g key={i} style={{ cursor: "grab" }} onPointerDown={(e) => {
                    try {
                      (e.target as Element).setPointerCapture(e.pointerId);
                    } catch {
                      // sem captura o arraste continua funcionando dentro da imagem
                    }
                    setDrag(i);
                  }}>
                    <circle cx={p[0]} cy={p[1]} r={handle * 1.8} fill="transparent" />
                    <circle cx={p[0]} cy={p[1]} r={handle * 0.55} fill="white" stroke="black" strokeWidth={handle / 5} />
                  </g>
                ))}
              </svg>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
              <span>
                Foto {W} × {H} px · cantos: {ordered.map((_, i) => LABELS[i]).join(", ")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImg(null);
                  setFile(null);
                  setPts([]);
                }}
              >
                <RotateCcw /> Trocar foto
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="grid content-start gap-4">
        <Field label="Nome da vista" htmlFor="name">
          <Input ref={nameRef} id="name" name="name" required placeholder="Ex.: Fachada principal" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Largura real (m)" htmlFor="w">
            <Input id="w" inputMode="decimal" placeholder="Ex.: 12,40" value={dims.w} onChange={(e) => setDims((d) => ({ ...d, w: e.target.value }))} />
          </Field>
          <Field label="Altura real (m)" htmlFor="h">
            <Input id="h" inputMode="decimal" placeholder="Ex.: 8,50" value={dims.h} onChange={(e) => setDims((d) => ({ ...d, h: e.target.value }))} />
          </Field>
        </div>
        <Field label="Área">
          <SimpleSelect name="elementId" options={elements.map((e) => ({ value: e.id, label: e.name }))} allowNone noneLabel="Nenhuma" />
        </Field>
        <Field label="Vistoria">
          <SimpleSelect
            name="campaignId"
            options={campaigns.map((c) => ({ value: c.id, label: c.name }))}
            defaultValue={defaultCampaignId ?? undefined}
            allowNone
            noneLabel="Sem vistoria"
          />
        </Field>
        {preview && (
          <p className="rounded-lg border bg-card px-3 py-2 text-[12.5px] text-muted-foreground">
            Resultado: {preview.width} × {preview.height} px · escala{" "}
            <b className="font-medium text-foreground">{preview.mmPerPixel.toFixed(2).replace(".", ",")} mm/pixel</b>
          </p>
        )}
        <p className="text-[11.5px] text-muted-foreground">
          A correção vale para o plano da parede: elementos salientes (marquises, beirais) ficam levemente deslocados. Para
          medir com precisão, confira uma medida de trena no editor.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={pending || !ready}>
            {pending && <Loader2 className="animate-spin" />}
            {pending ? stage ?? "Processando…" : "Retificar e abrir no editor"}
          </Button>
          <Button variant="ghost" asChild>
            <Link href={`/bens/${siteId}`}>Cancelar</Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
