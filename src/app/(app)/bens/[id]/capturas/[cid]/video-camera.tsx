"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CircleHelp, CloudSun, CloudUpload, CornerUpRight, Gauge, MoveHorizontal, QrCode, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FRAME_WINDOW_MS, FrameSelector, MAX_FRAMES, tooFast, type Frame, type FrameVerdict } from "@/lib/video-frames";
import { coach, COACH_STEPS, TARGET_FRAMES, type Look } from "@/lib/capture-coach";
import { useCameraStream } from "./use-camera-stream";

const SAMPLE_MS = 200;
const GUIDE_KEY = "archray-guia-captura";
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Os passos de uma boa captura, mostrados antes de gravar. */
const GUIDE: { icon: typeof QrCode; title: string; text: string; href?: string; link?: string }[] = [
  {
    icon: QrCode,
    title: "Prenda o marcador de escala",
    text: "Folha impressa em tamanho real, lisa na parede na altura da cintura. Comece a gravar perto dela, de ângulos diferentes. Com ela o ArchRay mede a fachada sozinho; sem ela, você mede uma porta com trena depois.",
    href: "/marcador",
    link: "Imprimir o marcador",
  },
  { icon: MoveHorizontal, title: "Ande de lado, não gire", text: "Caminhe paralelo à fachada, sempre apontando para ela. Girar parado não gera profundidade." },
  { icon: ArrowUpRight, title: "Duas passadas", text: "Primeiro com a câmera reta, na altura do peito. Depois mais afastado, mirando a parte alta e o beiral." },
  { icon: CornerUpRight, title: "Quinas em arco", text: "Vire as esquinas devagar, em curva, para emendar uma fachada na outra." },
  { icon: Gauge, title: "Devagar e sem pressa", text: `Cada trecho precisa aparecer em vários quadros. A meta é ${TARGET_FRAMES} quadros; a barra mostra o andamento.` },
  { icon: CloudSun, title: "Luz suave, pouco céu", text: "Dia nublado ou sombra uniforme é o ideal. Evite contraluz e não aponte para o céu." },
];

/**
 * Gravação em tela cheia: o profissional filma a fachada andando, e o ArchRay guarda o quadro mais
 * nítido de cada janela. A tela guia a captura: passos antes de gravar e instruções ao vivo.
 * O vídeo inteiro não é salvo.
 */
export function VideoCamera({ total, pending, onFrame, onClose }: { total: number; pending: number; onFrame: (f: Frame) => Promise<void>; onClose: () => void }) {
  const { videoRef, ready, res, error, setError } = useCameraStream();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [kept, setKept] = useState(0);
  const [fast, setFast] = useState(false);
  const [verdicts, setVerdicts] = useState<FrameVerdict[]>([]);
  const [look, setLook] = useState<Look | null>(null);
  // o guia abre sozinho nas primeiras vezes; depois fica no botão "Como capturar"
  const [guide, setGuide] = useState(false);
  useEffect(() => {
    let seen = 0;
    try {
      seen = Number(localStorage.getItem(GUIDE_KEY) ?? 0);
    } catch {
      /* sem armazenamento: trata como primeira vez */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o navegador só depois de montar
    if (seen < 3) setGuide(true);
  }, []);
  const onFrameRef = useRef(onFrame);
  const keptRef = useRef(0);
  const secondsRef = useRef(0);
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  function closeGuide() {
    setGuide(false);
    try {
      localStorage.setItem(GUIDE_KEY, String(Number(localStorage.getItem(GUIDE_KEY) ?? 0) + 1));
    } catch {
      /* sem armazenamento: o guia volta a abrir, sem problema */
    }
  }

  useEffect(() => {
    if (!recording) return;
    const sel = new FrameSelector();
    // pausar e retomar continua a contagem da mesma gravação
    const baseKept = keptRef.current;
    const baseSeconds = secondsRef.current;
    const started = Date.now();
    let closing = false;
    const sample = setInterval(() => {
      const v = videoRef.current;
      if (v?.videoWidth) sel.offer(v, v.videoWidth, v.videoHeight);
    }, SAMPLE_MS);
    const windows = setInterval(() => {
      if (closing) return;
      closing = true;
      void (async () => {
        try {
          const frame = await sel.closeWindow();
          if (frame) await onFrameRef.current(frame);
          keptRef.current = baseKept + sel.kept;
          setKept(keptRef.current);
          setFast(tooFast(sel.verdicts));
          setVerdicts(sel.verdicts);
          setLook(sel.look);
          if (keptRef.current >= MAX_FRAMES) setRecording(false);
        } catch (e) {
          setError((e as Error).message);
          setRecording(false);
        } finally {
          closing = false;
        }
      })();
    }, FRAME_WINDOW_MS);
    const clock = setInterval(() => {
      secondsRef.current = baseSeconds + Math.floor((Date.now() - started) / 1000);
      setSeconds(secondsRef.current);
    }, 500);
    return () => {
      clearInterval(sample);
      clearInterval(windows);
      clearInterval(clock);
    };
  }, [recording, setError, videoRef]);

  const tip = coach({ kept, verdicts, look, fast });
  const pct = Math.min(100, (kept / TARGET_FRAMES) * 100);
  const started = recording || kept > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />

      {/* topo: fechar, instrução da vez e ajuda */}
      <div className="relative z-10 grid gap-3 bg-gradient-to-b from-black/80 via-black/50 to-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-start gap-3">
          <button onClick={onClose} disabled={recording} aria-label="Fechar câmera" className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 disabled:opacity-30">
            <X className="size-5" />
          </button>
          <div className="min-w-0 flex-1" aria-live="polite">
            {recording ? (
              <>
                <p className={cn("text-[17px] leading-tight font-semibold", tip.tone === "warn" && "text-amber-300", tip.tone === "done" && "text-emerald-300")}>{tip.title}</p>
                {tip.hint && <p className="mt-0.5 text-[13px] leading-snug text-white/85">{tip.hint}</p>}
              </>
            ) : (
              <>
                <p className="text-[17px] leading-tight font-semibold">{kept ? "Gravação pausada" : "Pronto para gravar"}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-white/85">
                  {kept ? "Toque no botão vermelho para continuar, ou feche para enviar." : "Fique numa ponta da fachada e toque no botão vermelho."}
                </p>
              </>
            )}
          </div>
          <button onClick={() => setGuide(true)} disabled={recording} aria-label="Como capturar" className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 text-[12.5px] disabled:opacity-30">
            <CircleHelp className="size-4" /> <span className="hidden min-[380px]:inline">Como capturar</span>
          </button>
        </div>

        {/* progresso até a meta, com as etapas do roteiro */}
        {started && (
          <div className="grid gap-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className={cn("h-full rounded-full transition-[width]", tip.tone === "done" ? "bg-emerald-400" : "bg-white")} style={{ width: `${pct}%` }} />
            </div>
            <div className="grid grid-cols-[45fr_30fr_25fr] text-[11px] text-white/60">
              {COACH_STEPS.map((s, i) => (
                <span key={s} className={cn(i === tip.step && "font-medium text-white")}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <div className="relative z-10 mx-4 rounded-xl bg-white p-4 text-[14px] text-black">{error}</div>}
      <div className="flex-1" />

      {/* guia antes de gravar */}
      {guide && !recording && (
        <div className="absolute inset-0 z-20 overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="mx-auto grid max-w-md gap-4 p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between">
              <p className="text-[20px] font-semibold">Como capturar</p>
              <button onClick={closeGuide} aria-label="Fechar guia" className="grid size-9 place-items-center rounded-full bg-white/15">
                <X className="size-4" />
              </button>
            </div>
            <ol className="grid gap-3">
              {GUIDE.map((g, i) => (
                <li key={g.title} className="flex gap-3 rounded-2xl bg-white/10 p-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-black">
                    <g.icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium">
                      {i + 1}. {g.title}
                    </span>
                    <span className="block text-[13px] leading-snug text-white/75">{g.text}</span>
                    {g.href && (
                      <a href={g.href} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[13px] font-medium text-white underline underline-offset-4">
                        {g.link}
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-[12.5px] text-white/60">Durante a gravação, o topo da tela diz o que fazer a cada momento.</p>
            <button onClick={closeGuide} className="h-12 rounded-full bg-white text-[15px] font-medium text-black">
              Entendi
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between gap-4 bg-gradient-to-t from-black/80 to-transparent px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="grid w-16 text-[13px] leading-tight tabular-nums">
          <span className="font-medium">{mmss(seconds)}</span>
          <span className="text-[11px] text-white/75">{recording ? "gravando" : kept ? "pausado" : "pronto"}</span>
        </div>
        <button
          onClick={() => setRecording((r) => !r)}
          disabled={!ready}
          aria-label={recording ? "Pausar gravação" : "Iniciar gravação"}
          className="grid size-[76px] place-items-center rounded-full border-4 border-white transition-transform active:scale-95 disabled:opacity-40"
        >
          {recording ? <Square className="size-8 fill-red-500 text-red-500" /> : <span className="size-[60px] rounded-full bg-red-500" />}
        </button>
        <div className="grid w-16 justify-items-center text-center leading-tight">
          <span className="text-[22px] font-medium tabular-nums">{started ? kept : total}</span>
          <span className="text-[11px] text-white/75">{started ? `de ${TARGET_FRAMES}` : "quadros"}</span>
          {pending > 0 && (
            <span className="mt-1 flex items-center gap-1 text-[10.5px] text-white/75">
              <CloudUpload className="size-3" /> {pending}
            </span>
          )}
        </div>
      </div>
      {res && <span className="absolute right-3 bottom-1 z-10 text-[10px] text-white/50">{res}</span>}
    </div>
  );
}
