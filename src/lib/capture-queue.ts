/**
 * Fila de fotos no próprio aparelho (IndexedDB). Cada foto fica guardada até ser
 * enviada ao storage e registrada no servidor — sobrevive a falta de sinal, a fechar
 * a aba e a recarregar a página. Só roda no navegador.
 */

export type QueuedPhoto = {
  id: string; // vira o clientId no servidor (idempotência)
  captureId: string;
  blob: Blob;
  name: string;
  type: string;
  width: number | null;
  height: number | null;
  sharpness: number | null;
  pass: 1 | 2;
  takenAt: string;
  attempts: number;
};

const DB = "oraclo-capturas";
const STORE = "fotos";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      const s = db.createObjectStore(STORE, { keyPath: "id" });
      s.createIndex("captureId", "captureId");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
  });
}

export const queue = {
  add: (p: QueuedPhoto) => tx("readwrite", (s) => s.put(p)),
  put: (p: QueuedPhoto) => tx("readwrite", (s) => s.put(p)),
  remove: (id: string) => tx("readwrite", (s) => s.delete(id)),
  list: (captureId: string) =>
    tx<QueuedPhoto[]>("readonly", (s) => s.index("captureId").getAll(IDBKeyRange.only(captureId))),
};

/** Pede ao navegador para não apagar o armazenamento local (importante no iPhone). */
export async function persistStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    // sem suporte — segue
  }
}

/**
 * Nitidez pela variância do Laplaciano numa versão reduzida (≈480 px) em tons de cinza.
 * Valor relativo: compare com as outras fotos da mesma captura.
 */
export function measureSharpness(source: CanvasImageSource, w: number, h: number) {
  const scale = Math.min(1, 480 / Math.max(w, h));
  const cw = Math.max(8, Math.round(w * scale));
  const ch = Math.max(8, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, cw, ch);
  const { data } = ctx.getImageData(0, 0, cw, ch);
  const g = new Float32Array(cw * ch);
  for (let i = 0; i < cw * ch; i++) g[i] = 0.299 * data[i * 4]! + 0.587 * data[i * 4 + 1]! + 0.114 * data[i * 4 + 2]!;
  let sum = 0;
  let sum2 = 0;
  let n = 0;
  for (let y = 1; y < ch - 1; y++) {
    for (let x = 1; x < cw - 1; x++) {
      const i = y * cw + x;
      const lap = 4 * g[i]! - g[i - 1]! - g[i + 1]! - g[i - cw]! - g[i + cw]!;
      sum += lap;
      sum2 += lap * lap;
      n++;
    }
  }
  const mean = sum / n;
  return Math.round((sum2 / n - mean * mean) * 10) / 10;
}

/** Tremida/borrada = bem abaixo da mediana das últimas fotos (ou abaixo de um piso absoluto). */
export function isBlurry(value: number | null, recent: number[]) {
  if (value == null) return false;
  if (value < 12) return true;
  if (recent.length < 4) return false;
  const sorted = [...recent].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  return value < median * 0.45;
}

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
