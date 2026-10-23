"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { ArrowLeft, Download, Frame, Loader2, Move3d, Ruler, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/form";
import { parsePointCloud, type PointCloud } from "@/lib/pointcloud";
import type { ModelScale, OutputMeta } from "@/lib/model-formats";
import { createOrthophoto } from "../../ortofotos/actions";
import { clearModelScale, saveModelScale } from "./actions";

type Tool = "orbitar" | "medir" | "ortofoto";
type Output = { id: string; name: string; url: string; format: string; meta: OutputMeta | null };

const nf = (v: number, d = 2) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Retângulo da ortofoto definido por 3 cliques: canto inferior esquerdo, inferior direito e um ponto no topo. */
function orthoFrame(p: THREE.Vector3[]) {
  const [a, b, c] = p as [THREE.Vector3, THREE.Vector3, THREE.Vector3];
  const u = b.clone().sub(a);
  const width = u.length();
  u.normalize();
  const ac = c.clone().sub(a);
  const v = ac.clone().sub(u.clone().multiplyScalar(ac.dot(u)));
  const height = v.length();
  v.normalize();
  const n = new THREE.Vector3().crossVectors(u, v).normalize(); // aponta para quem olha a fachada
  return { a, u, v, n, width, height };
}

export function ModelViewer({
  siteId,
  orgId,
  output,
  elements,
  canEdit,
}: {
  siteId: string;
  orgId: string;
  output: Output;
  elements: { value: string; label: string }[];
  canEdit: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const three = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    root: THREE.Group;
    overlay: THREE.Group;
    points: THREE.Points | null;
    size: number;
  } | null>(null);
  const [progress, setProgress] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{ count: number; total: number; dims: [number, number, number]; origin: [number, number, number] } | null>(null);
  const [tool, setTool] = useState<Tool>("orbitar");
  const [measure, setMeasure] = useState<THREE.Vector3[]>([]);
  const [orthoPts, setOrthoPts] = useState<THREE.Vector3[]>([]);
  const [pointSize, setPointSize] = useState(2);
  const [gen, setGen] = useState<string | null>(null);
  const [scale, setScale] = useState<ModelScale | null>(output.meta?.scale ?? null);
  const [realM, setRealM] = useState("");
  const [savingScale, setSavingScale] = useState(false);
  /** Metros por unidade do modelo: 1 enquanto não calibrado (o ArchRay presume metros). */
  const k = scale?.factor ?? 1;
  const [form, setForm] = useState({ name: "", elementId: "", mm: "", front: "1,5", back: "1,5" });
  const toolRef = useRef(tool);
  toolRef.current = tool;

  const upAxis = output.meta?.upAxis ?? (output.format === "glb" ? "y" : "z");

  /* ── cena ── */
  useEffect(() => {
    const wrap = wrapRef.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    // cores de nuvem já estão em sRGB (passam direto); texturas de malha GLB pedem saída sRGB
    renderer.outputColorSpace = output.format === "glb" ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
    wrap.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--canvas").trim() || "#0f0f0f";
    scene.background = new THREE.Color(bg);
    const camera = new THREE.PerspectiveCamera(50, wrap.clientWidth / wrap.clientHeight, 0.01, 100000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    const root = new THREE.Group();
    if (upAxis === "z") root.rotation.x = -Math.PI / 2;
    const overlay = new THREE.Group();
    scene.add(root, overlay, new THREE.AmbientLight(0xffffff, 1));
    three.current = { renderer, scene, camera, controls, root, overlay, points: null, size: 1 };
    // só em desenvolvimento: permite testes automatizados apontarem para pontos do modelo
    if (process.env.NODE_ENV !== "production") (window as unknown as { __oracloViewer?: unknown }).__oracloViewer = three.current;

    let raf = 0;
    const loop = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();
    const ro = new ResizeObserver(() => {
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      camera.aspect = wrap.clientWidth / Math.max(1, wrap.clientHeight);
      camera.updateProjectionMatrix();
    });
    ro.observe(wrap);

    // carrega o arquivo com progresso
    (async () => {
      try {
        const res = await fetch(output.url);
        if (!res.ok || !res.body) throw new Error(`Não foi possível baixar o modelo (${res.status}).`);
        const len = Number(res.headers.get("content-length")) || 0;
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          got += value.length;
          if (len) setProgress(Math.round((got / len) * 90));
        }
        const buf = new Uint8Array(got);
        let o = 0;
        for (const c of chunks) {
          buf.set(c, o);
          o += c.length;
        }
        setProgress(95);
        await new Promise((r) => setTimeout(r, 30));

        if (output.format === "glb") {
          const gltf = await new GLTFLoader().parseAsync(buf.buffer, "");
          // fotogrametria já traz a luz na textura: materiais sem iluminação
          gltf.scene.traverse((obj) => {
            const m = obj as THREE.Mesh;
            if (!m.isMesh) return;
            const old = m.material as THREE.MeshStandardMaterial;
            m.material = new THREE.MeshBasicMaterial({ map: old.map ?? null, color: old.map ? 0xffffff : (old.color ?? new THREE.Color(0xcccccc)), side: THREE.DoubleSide, vertexColors: !!m.geometry.attributes.color });
          });
          root.add(gltf.scene);
          let verts = 0;
          gltf.scene.traverse((obj) => {
            const m = obj as THREE.Mesh;
            if (m.isMesh) verts += m.geometry.attributes.position?.count ?? 0;
          });
          root.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(root);
          const s = box.getSize(new THREE.Vector3());
          setInfo({ count: verts, total: verts, dims: [s.x, s.y, s.z], origin: [0, 0, 0] });
        } else {
          const pc: PointCloud = parsePointCloud(output.format, buf.buffer);
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(pc.positions, 3));
          if (pc.colors) geo.setAttribute("color", new THREE.BufferAttribute(pc.colors, 3, true));
          else {
            // sem cor: tons de cinza pela altura
            const col = new Float32Array(pc.count * 3);
            const zi = upAxis === "z" ? 2 : 1;
            const lo = pc.min[zi]!, hi = pc.max[zi]!;
            for (let i = 0; i < pc.count; i++) {
              const t = 0.25 + 0.7 * ((pc.positions[i * 3 + zi]! - lo) / Math.max(1e-6, hi - lo));
              col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = t;
            }
            geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
          }
          const mat = new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true });
          const pts = new THREE.Points(geo, mat);
          root.add(pts);
          three.current!.points = pts;
          setInfo({
            count: pc.count,
            total: pc.total,
            dims: [pc.max[0] - pc.min[0], pc.max[1] - pc.min[1], pc.max[2] - pc.min[2]],
            origin: pc.origin,
          });
        }

        // enquadra
        root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3()).length() || 1;
        three.current!.size = size;
        camera.near = size / 5000;
        camera.far = size * 20;
        camera.position.copy(center).add(new THREE.Vector3(0.35, 0.3, 1).normalize().multiplyScalar(size * 0.9));
        camera.updateProjectionMatrix();
        controls.target.copy(center);
        setProgress(null);
      } catch (e) {
        setError((e as Error).message);
        setProgress(null);
      }
    })();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      wrap.removeChild(renderer.domElement);
      three.current = null;
    };
    // a cena é montada uma vez por arquivo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [output.url]);

  useEffect(() => {
    const p = three.current?.points;
    if (p) (p.material as THREE.PointsMaterial).size = pointSize;
  }, [pointSize]);

  /* ── marcadores (medição e ortofoto) ── */
  useEffect(() => {
    const t = three.current;
    if (!t) return;
    t.overlay.clear();
    const r = t.size / 400;
    const dot = (p: THREE.Vector3, color: number) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), new THREE.MeshBasicMaterial({ color, depthTest: false }));
      m.position.copy(p);
      m.renderOrder = 10;
      t.overlay.add(m);
    };
    const line = (pts: THREE.Vector3[], color: number, loop = false) => {
      const g = new THREE.BufferGeometry().setFromPoints(loop ? [...pts, pts[0]!] : pts);
      const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color, depthTest: false }));
      l.renderOrder = 9;
      t.overlay.add(l);
    };
    measure.forEach((p) => dot(p, 0xffffff));
    if (measure.length >= 2) line(measure, 0xffffff);
    orthoPts.forEach((p) => dot(p, 0xffffff));
    if (orthoPts.length === 3) {
      const f = orthoFrame(orthoPts);
      const c = [f.a, f.a.clone().addScaledVector(f.u, f.width), f.a.clone().addScaledVector(f.u, f.width).addScaledVector(f.v, f.height), f.a.clone().addScaledVector(f.v, f.height)];
      line(c, 0xffffff, true);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(f.width, f.height),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthTest: false }),
      );
      plane.position.copy(f.a).addScaledVector(f.u, f.width / 2).addScaledVector(f.v, f.height / 2);
      plane.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.u, f.v, f.n));
      t.overlay.add(plane);
    } else if (orthoPts.length === 2) line(orthoPts, 0xffffff);
  }, [measure, orthoPts]);

  /* ── clique para escolher pontos ── */
  const down = useRef<{ x: number; y: number } | null>(null);
  const pick = useCallback((e: React.PointerEvent) => {
    const t = three.current;
    if (!t || toolRef.current === "orbitar") return;
    const d = down.current;
    if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) return; // foi arraste
    const rect = t.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.params.Points = { threshold: t.size / 600 };
    ray.setFromCamera(ndc, t.camera);
    const hit = ray.intersectObject(t.root, true)[0];
    if (!hit) return toast.info("Clique sobre o modelo.");
    const p = hit.point.clone();
    if (toolRef.current === "medir") setMeasure((m) => (m.length >= 2 ? [p] : [...m, p]));
    else setOrthoPts((m) => (m.length >= 3 ? [p] : [...m, p]));
  }, []);

  const frame = orthoPts.length === 3 ? orthoFrame(orthoPts) : null;
  const defaultMm = frame ? Math.max(1, Math.round((Math.max(frame.width, frame.height) * k * 1000) / 5000)) : 2;
  const mmValue = Number(form.mm.replace(",", ".")) || defaultMm;
  const pxW = frame ? Math.round((frame.width * k * 1000) / mmValue) : 0;
  const pxH = frame ? Math.round((frame.height * k * 1000) / mmValue) : 0;

  /* ── gerar ortofoto ── */
  async function generate() {
    const t = three.current;
    if (!t || !frame) return;
    const front = (Number(form.front.replace(",", ".")) || 1.5) / k;
    const back = (Number(form.back.replace(",", ".")) || 1.5) / k;
    if (pxW < 50 || pxH < 50) return toast.error("Área muito pequena para essa resolução.");
    if (Math.max(pxW, pxH) > 16000 || pxW * pxH > 150_000_000) return toast.error("Imagem grande demais. Aumente o mm/pixel.");
    setGen("Renderizando…");
    try {
      const gl = t.renderer.getContext();
      const maxTex = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE) as number);
      const cam = new THREE.OrthographicCamera(-frame.width / 2, frame.width / 2, frame.height / 2, -frame.height / 2, 0, front + back);
      const center = frame.a.clone().addScaledVector(frame.u, frame.width / 2).addScaledVector(frame.v, frame.height / 2);
      cam.position.copy(center).addScaledVector(frame.n, front);
      cam.up.copy(frame.v);
      cam.lookAt(center);
      cam.updateMatrixWorld(true);

      // pontos: tamanho em pixels que fecha os buracos na resolução escolhida
      const pts = t.points;
      const oldSize = pts ? (pts.material as THREE.PointsMaterial).size : 0;
      if (pts) {
        const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
        const m = pts.matrixWorld;
        const w = new THREE.Vector3();
        let inside = 0;
        for (let i = 0; i < pos.count; i++) {
          w.fromBufferAttribute(pos, i).applyMatrix4(m).sub(frame.a);
          const du = w.dot(frame.u), dv = w.dot(frame.v), dn = w.dot(frame.n);
          if (du >= 0 && du <= frame.width && dv >= 0 && dv <= frame.height && dn <= front && dn >= -back) inside++;
        }
        const spacing = Math.sqrt((frame.width * frame.height) / Math.max(1, inside)) * k; // m
        (pts.material as THREE.PointsMaterial).size = Math.min(12, Math.max(1.5, ((spacing * 1000) / mmValue) * 1.4));
      }
      const oldBg = t.scene.background;
      t.scene.background = new THREE.Color(0xffffff);
      t.overlay.visible = false;

      const canvas = document.createElement("canvas");
      canvas.width = pxW;
      canvas.height = pxH;
      const ctx = canvas.getContext("2d")!;
      const tiles: [number, number, number, number][] = [];
      for (let y = 0; y < pxH; y += maxTex) for (let x = 0; x < pxW; x += maxTex) tiles.push([x, y, Math.min(maxTex, pxW - x), Math.min(maxTex, pxH - y)]);
      for (let i = 0; i < tiles.length; i++) {
        const [x, y, w, h] = tiles[i]!;
        setGen(`Renderizando ${i + 1}/${tiles.length}…`);
        const rt = new THREE.WebGLRenderTarget(w, h, { colorSpace: t.renderer.outputColorSpace as THREE.ColorSpace });
        cam.setViewOffset(pxW, pxH, x, y, w, h);
        cam.updateProjectionMatrix();
        t.renderer.setRenderTarget(rt);
        t.renderer.render(t.scene, cam);
        const px = new Uint8Array(w * h * 4);
        t.renderer.readRenderTargetPixels(rt, 0, 0, w, h, px);
        t.renderer.setRenderTarget(null);
        rt.dispose();
        const img = ctx.createImageData(w, h);
        for (let row = 0; row < h; row++) img.data.set(px.subarray((h - 1 - row) * w * 4, (h - row) * w * 4), row * w * 4);
        ctx.putImageData(img, x, y);
        await new Promise((r) => setTimeout(r, 0));
      }
      t.scene.background = oldBg;
      t.overlay.visible = true;
      if (pts) (pts.material as THREE.PointsMaterial).size = oldSize;

      setGen("Enviando…");
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.92));
      if (!blob) throw new Error("Não foi possível gerar a imagem.");
      const name = form.name.trim() || `Ortofoto — ${output.name}`;
      const safe = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").slice(0, 60) || "ortofoto";
      const up = await upload(`orgs/${orgId}/sites/${siteId}/ortofotos/${safe}.jpg`, blob, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ siteId }),
        contentType: "image/jpeg",
        multipart: blob.size > 20 * 1024 * 1024,
      });
      // plano em coordenadas do arquivo (para refazer ou georreferenciar depois)
      const toModel = (p: THREE.Vector3) => {
        const l = t.root.worldToLocal(p.clone());
        return [l.x + (info?.origin[0] ?? 0), l.y + (info?.origin[1] ?? 0), l.z + (info?.origin[2] ?? 0)];
      };
      const inv = new THREE.Matrix3().getNormalMatrix(t.root.matrixWorld).invert();
      const dir = (v: THREE.Vector3) => v.clone().applyMatrix3(inv).normalize().toArray();
      setGen("Abrindo o mapa de danos…");
      await createOrthophoto(siteId, {
        name,
        elementId: form.elementId && form.elementId !== "__none" ? form.elementId : null,
        url: up.url,
        pathname: up.pathname,
        contentType: "image/jpeg",
        width: pxW,
        height: pxH,
        mmPerPixel: mmValue,
        outputId: output.id,
        plane: { origin: toModel(frame.a), normal: dir(frame.n), up: dir(frame.v) },
      });
    } catch (e) {
      if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
      toast.error((e as Error).message || "Falha ao gerar a ortofoto.");
      setGen(null);
    }
  }

  const rawDist = measure.length === 2 ? measure[0]!.distanceTo(measure[1]!) : null;
  const dist = rawDist == null ? null : rawDist * k;

  async function calibrate() {
    if (measure.length !== 2) return;
    const meters = Number(realM.replace(",", "."));
    if (!(meters > 0)) return toast.error("Informe a distância real em metros.");
    setSavingScale(true);
    const res = await saveModelScale(siteId, output.id, {
      a: measure[0]!.toArray() as [number, number, number],
      b: measure[1]!.toArray() as [number, number, number],
      meters,
    });
    setSavingScale(false);
    if ("error" in res) return toast.error(res.error);
    setScale(res.scale);
    setRealM("");
    toast.success("Escala calibrada.");
  }

  async function resetScale() {
    setSavingScale(true);
    const res = await clearModelScale(siteId, output.id);
    setSavingScale(false);
    if ("error" in res) return toast.error(res.error);
    setScale(null);
    toast.success("Calibração removida. O modelo volta a ser tratado como metros.");
  }

  return (
    <div className="flex h-[calc(100svh-3.5rem)] min-h-0 flex-col lg:h-svh">
      <header className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2 sm:px-4">
        <Button variant="ghost" size="icon-sm" asChild aria-label="Voltar">
          <Link href={`/bens/${siteId}`}>
            <ArrowLeft />
          </Link>
        </Button>
        <div className="mr-auto grid min-w-0 leading-tight">
          <span className="truncate text-[12px] text-muted-foreground">Modelo 3D</span>
          <span className="truncate text-[15px] font-medium">{output.name}</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-muted p-0.5">
          {([
            ["orbitar", "Navegar", Move3d],
            ["medir", "Medir", Ruler],
            ["ortofoto", "Gerar ortofoto", Frame],
          ] as const).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setTool(k)}
              className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px]", tool === k ? "bg-card shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground")}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={`${output.url}?download=1`}>
            <Download /> Baixar
          </a>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 bg-canvas">
          <div
            ref={wrapRef}
            className={cn("absolute inset-0", tool !== "orbitar" && "cursor-crosshair")}
            onPointerDown={(e) => (down.current = { x: e.clientX, y: e.clientY })}
            onPointerUp={pick}
          />
          {progress != null && (
            <div className="absolute inset-0 grid place-items-center text-[14px] text-white">
              <span className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2">
                <Loader2 className="size-4 animate-spin" /> Carregando modelo… {progress}%
              </span>
            </div>
          )}
          {error && (
            <div className="absolute inset-x-4 top-4 rounded-xl bg-background p-4 text-[14px]">
              {error}
            </div>
          )}
          {info && (
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1.5 text-[12px] text-white">
              {info.count.toLocaleString("pt-BR")} {output.format === "glb" ? "vértices" : "pontos"}
              {info.total > info.count && ` (de ${info.total.toLocaleString("pt-BR")})`} · {nf(info.dims[0] * k, 1)} × {nf(info.dims[1] * k, 1)} × {nf(info.dims[2] * k, 1)} m
            </div>
          )}
        </div>

        <aside className="thin-scroll hidden w-80 shrink-0 overflow-y-auto border-l bg-background p-4 lg:block">
          {tool === "orbitar" && (
            <div className="grid gap-4 text-[13.5px]">
              <p className="text-muted-foreground">Arraste para girar, botão direito para mover, roda do mouse para aproximar.</p>
              {output.format !== "glb" && (
                <label className="grid gap-1.5">
                  <span className="text-muted-foreground">Tamanho do ponto: {pointSize}px</span>
                  <input type="range" min={1} max={8} step={0.5} value={pointSize} onChange={(e) => setPointSize(Number(e.target.value))} className="accent-current" />
                </label>
              )}
              {!scale && info && Math.max(...info.dims) > 2000 && (
                <p className="rounded-lg bg-muted p-3">As dimensões parecem grandes demais — o arquivo pode estar em milímetros. O ArchRay considera metros.</p>
              )}
            </div>
          )}
          {tool === "medir" && (
            <div className="grid gap-3 text-[13.5px]">
              <p className="text-muted-foreground">Clique em dois pontos do modelo.</p>
              <div className="rounded-xl border p-4 text-center">
                <p className="text-[12.5px] text-muted-foreground">Distância</p>
                <p className="text-[26px] font-medium tabular-nums">{dist == null ? "—" : `${nf(dist, 3)} m`}</p>
              </div>
              {measure.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setMeasure([])}>
                  <Trash2 /> Limpar
                </Button>
              )}
              <div className="grid gap-2 rounded-xl border p-3">
                <p className="font-medium">Escala do modelo</p>
                {scale ? (
                  <p className="text-muted-foreground">
                    Calibrado: {nf(scale.meters, 3)} m medidos entre dois pontos (fator {scale.factor.toPrecision(5)}). As medidas, áreas e ortofotos já usam essa escala.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Sem calibração: o ArchRay presume que o arquivo está em metros. Meça algo de tamanho conhecido (um vão de porta, por exemplo) e informe a medida real.
                  </p>
                )}
                {canEdit ? (
                  <>
                    <label className="grid gap-1">
                      <span className="text-[12px] text-muted-foreground">Distância real entre os dois pontos (m)</span>
                      <Input inputMode="decimal" value={realM} onChange={(e) => setRealM(e.target.value)} placeholder="Ex.: 2,10" disabled={measure.length !== 2} />
                    </label>
                    <Button size="sm" onClick={calibrate} disabled={measure.length !== 2 || !realM.trim() || savingScale}>
                      {savingScale ? <Loader2 className="animate-spin" /> : <Ruler />} Calibrar com estes pontos
                    </Button>
                    {scale && (
                      <Button variant="ghost" size="sm" onClick={resetScale} disabled={savingScale}>
                        Remover calibração
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Somente técnicos e administradores calibram o modelo.</p>
                )}
              </div>
            </div>
          )}
          {tool === "ortofoto" && (
            <div className="grid gap-4 text-[13.5px]">
              <ol className="grid gap-1.5">
                {["Canto inferior esquerdo da fachada", "Canto inferior direito", "Um ponto na altura do topo"].map((s, i) => (
                  <li key={s} className={cn("flex items-center gap-2", orthoPts.length > i ? "text-foreground" : "text-muted-foreground")}>
                    <span className={cn("grid size-5 place-items-center rounded-full border text-[11px]", orthoPts.length > i && "border-foreground bg-foreground text-background")}>{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              {frame ? (
                <>
                  <p className="rounded-lg bg-muted px-3 py-2">
                    Área: <b className="font-medium">{nf(frame.width * k)} × {nf(frame.height * k)} m</b>
                  </p>
                  {canEdit ? (
                    <div className="grid gap-3">
                      <label className="grid gap-1">
                        <span className="text-muted-foreground">Nome</span>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Fachada principal" />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-muted-foreground">Área</span>
                        <SimpleSelect options={elements} value={form.elementId || "__none"} onValueChange={(v) => setForm({ ...form, elementId: v })} allowNone noneLabel="Nenhuma" />
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="grid gap-1">
                          <span className="text-[12px] text-muted-foreground">mm/pixel</span>
                          <Input inputMode="decimal" value={form.mm} placeholder={String(defaultMm)} onChange={(e) => setForm({ ...form, mm: e.target.value })} />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[12px] text-muted-foreground">À frente (m)</span>
                          <Input inputMode="decimal" value={form.front} onChange={(e) => setForm({ ...form, front: e.target.value })} />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[12px] text-muted-foreground">Atrás (m)</span>
                          <Input inputMode="decimal" value={form.back} onChange={(e) => setForm({ ...form, back: e.target.value })} />
                        </label>
                      </div>
                      <p className="text-[12.5px] text-muted-foreground">
                        Imagem de {pxW.toLocaleString("pt-BR")} × {pxH.toLocaleString("pt-BR")} px. Só entra o que estiver entre {form.front} m à frente e {form.back} m atrás do plano.
                      </p>
                      <Button onClick={generate} disabled={!!gen}>
                        {gen ? <Loader2 className="animate-spin" /> : <Frame />} {gen ?? "Gerar e abrir no mapa de danos"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setOrthoPts([])}>
                        Recomeçar
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Somente técnicos e administradores geram ortofotos.</p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Clique sobre o modelo nos pontos indicados. A ortofoto sai alinhada ao plano da fachada, já em escala.</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
