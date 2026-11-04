// Prints anotados da Academy (public/academy/*.jpg): Edge headless via CDP, logado na conta de teste
// local, com cada elemento citado na aula marcado por um retângulo e um número.
//
//   node scripts/academy-shots.mjs [base] [filtro: regex do nome do print]
//   (padrão: http://localhost:3022; o servidor de desenvolvimento precisa estar rodando)
//
// Usa os projetos da conta de teste (.cache/acesso-teste.txt): a demonstração da Igreja do Carmo,
// o "Teste · comparação Carmo" e o "Casarão de Teste". IDs abaixo.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const BASE = process.argv[2] ?? "http://localhost:3022";
const FILTER = process.argv[3];
const OUT = "public/academy";
const DEMO = "ba2335ee-9332-4fde-98c8-d5b1c44bc007";
const DEMO_VISTA = "3a9ce493-3559-42ae-8cb5-c8bd50f88036";
const DEMO_DANO = "9bbd0d42-827c-48ca-909c-6c45bde7e751";
const CMP = "b289e0ab-090c-44f2-b952-edf148e969d9";
const CASARAO = "55f31113-55a1-4c97-b7c5-4ba6a2183ed4";
const FOTO = resolve("public/site/carmo-igreja-2010.jpg");
const DPR = 1.5;
mkdirSync(OUT, { recursive: true });
const CHROME = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const creds = readFileSync(".cache/acesso-teste.txt", "utf8");
const EMAIL = creds.match(/E-mail:\s*(\S+)/)[1];
const PASS = creds.match(/Senha:\s*(\S+)/)[1];

const proc = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9335", "--user-data-dir=A:/.tmp/archray-academy-profile", "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await sleep(500);
  try {
    wsUrl = (await (await fetch("http://127.0.0.1:9335/json/list")).json()).find((t) => t.type === "page")?.webSocketDebuggerUrl;
  } catch {}
}
if (!wsUrl) throw new Error("navegador não abriu");
const ws = new WebSocket(wsUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const listeners = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) {
    pending.get(d.id)(d);
    pending.delete(d.id);
  } else if (d.method) listeners.forEach((l) => l(d));
};
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, (d) => (d.error ? rej(new Error(method + ": " + d.error.message)) : res(d.result)));
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const once = (method) => new Promise((r) => listeners.push(function f(d) { if (d.method === method) { listeners.splice(listeners.indexOf(f), 1); r(d); } }));
const ev = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

await send("Page.enable");
await send("Runtime.enable");
await send("DOM.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: DPR, mobile: false });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }, { name: "prefers-reduced-motion", value: "reduce" }] });

// localiza elementos por texto visível, seletor CSS ou rótulo acessível
const HELPERS = `window.__find = (s) => {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(e).visibility !== 'hidden'; };
  if (s.css) return [...document.querySelectorAll(s.css)].filter(vis)[s.nth ?? 0];
  if (s.aria) return [...document.querySelectorAll('[aria-label],[title]')].filter(e => vis(e) && ((e.getAttribute('aria-label') || e.getAttribute('title') || '').startsWith(s.aria)))[s.nth ?? 0];
  const norm = (t) => t.replace(/\\s+/g, ' ').trim();
  const all = [...document.querySelectorAll(s.tag || 'button,a,label,h1,h2,h3,h4,p,span,div,li,[role=tab],input,textarea,select')].filter(vis);
  if (s.has) { const l = all.filter(e => norm(e.textContent).includes(s.has)); l.sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height); return l[s.nth ?? 0]; }
  const exact = all.filter(e => norm(e.textContent) === s.text || e.placeholder === s.text);
  const list = exact.length ? exact : all.filter(e => norm(e.textContent).startsWith(s.text));
  list.sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height);
  let el = list[s.nth ?? 0];
  for (let k = 0; el && k < (s.up ?? 0); k++) el = el.parentElement;
  return el;
};
window.__rect = (s) => { const e = window.__find(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
true`;
const CLEAN = `(() => { document.querySelectorAll('nextjs-portal').forEach(e => e.remove());
  const s = document.getElementById('shot-css') || Object.assign(document.createElement('style'), { id: 'shot-css' });
  document.querySelector('[aria-label="Fechar aviso de atualizações"]')?.click();
  s.textContent = 'nextjs-portal{display:none!important} *{caret-color:transparent!important} [data-sonner-toaster]{display:none!important}'; document.head.appendChild(s); ${HELPERS} })()`;
async function nav(path, wait = 4000) {
  const load = once("Page.loadEventFired");
  await send("Page.navigate", { url: BASE + path });
  await Promise.race([load, sleep(60000)]);
  await sleep(wait);
  await ev(CLEAN);
}
const click = (spec) => ev(`(() => { const e = window.__find(${JSON.stringify(spec)}); e?.click(); return !!e })()`);

/**
 * Print com marcas numeradas. `marks`: [{ n, ...spec, pad? }]; `clip`: recorte em px CSS.
 */
async function shot(name, marks = [], { clip } = {}) {
  if (FILTER && !new RegExp(FILTER).test(name)) return;
  await ev(CLEAN);
  await sleep(400);
  const rects = [];
  for (const m of marks) {
    const r = await ev(`window.__rect(${JSON.stringify(m)})`);
    if (!r) console.warn(`  ! ${name}: marca ${m.n} não encontrada`, JSON.stringify(m));
    else rects.push({ ...r, n: m.n, pad: m.pad ?? 4 });
  }
  const shotRes = await send("Page.captureScreenshot", { format: "png" });
  let img = sharp(Buffer.from(shotRes.data, "base64"));
  const W = 1440 * DPR;
  const H = 900 * DPR;
  const C = "#d97757";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${rects
    .map(({ x, y, w, h, n, pad }) => {
      const X = (x - pad) * DPR;
      const Y = (y - pad) * DPR;
      const bx = Math.max(16, X);
      const by = Math.max(16, Y);
      return `<rect x="${X}" y="${Y}" width="${(w + 2 * pad) * DPR}" height="${(h + 2 * pad) * DPR}" rx="${9 * DPR}" fill="none" stroke="${C}" stroke-width="${2.5 * DPR}"/>
      <circle cx="${bx}" cy="${by}" r="${12 * DPR}" fill="${C}" stroke="#fff" stroke-width="${2 * DPR}"/>
      <text x="${bx}" y="${by + 5 * DPR}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${14 * DPR}" fill="#fff">${n}</text>`;
    })
    .join("")}</svg>`;
  img = sharp(await img.composite([{ input: Buffer.from(svg) }]).png().toBuffer());
  if (clip) img = img.extract({ left: Math.round(clip.x * DPR), top: Math.round(clip.y * DPR), width: Math.round(clip.w * DPR), height: Math.round(clip.h * DPR) });
  const buf = await img.resize({ width: Math.min(1800, Math.round((clip?.w ?? 1440) * DPR)) }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  writeFileSync(`${OUT}/${name}.jpg`, buf);
  console.log("print", name, `${rects.length}/${marks.length} marcas`, Math.round(buf.length / 1024) + " KB");
}

// ── login (conta de teste local) ──
await nav("/login", 2500);
await ev(`(() => { if (!document.querySelector('input[type=email]')) return true; const set = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
  set(document.querySelector('input[type=email]'), ${JSON.stringify(EMAIL)}); set(document.querySelector('input[type=password]'), ${JSON.stringify(PASS)});
  document.querySelector('form').requestSubmit(); return true })()`);
await sleep(9000);
await ev(`(() => { localStorage.setItem('theme', 'light'); localStorage.setItem('archray:atualizacao-vista', '"comparar-vistorias"'); localStorage.removeItem('archray:demo-tour'); localStorage.removeItem('archray:editor-paineis'); return true })()`);

// ═══ Fundamentos ═══
await nav("/", 4500);
await shot("inicio", [
  { n: 1, text: "Novo", tag: "a" },
  { n: 2, css: "textarea, input[placeholder^='Busque']" },
  { n: 3, text: "Seus projetos", up: 1 },
  { n: 4, text: "Aprenda na prática: demonstração guiada", up: 2 },
  { n: 5, text: "Projetos recentes", up: 1 },
  { n: 6, text: "Ajuda", tag: "button" },
]);
await shot("navegacao", [
  { n: 1, text: "Projetos", tag: "a" },
  { n: 2, text: "Mapas de danos", tag: "a" },
  { n: 3, text: "Modelo 3D", tag: "a" },
  { n: 4, text: "Danos e preços", tag: "a" },
  { n: 5, text: "Equipe", tag: "a" },
  { n: 6, text: "Novidades", tag: "a" },
  { n: 7, aria: "Buscar" },
]);
await click({ has: "Ana Restauradora", tag: "button" });
await sleep(900);
await shot("menu-conta", [
  { n: 1, text: "Aparência", up: 1 },
  { n: 2, text: "Meu perfil", tag: "a" },
  { n: 3, text: "Sair", tag: "button" },
]);
await nav("/", 3500);
await click({ text: "Ajuda", tag: "button" });
await sleep(1500);
await shot("ajuda", []);

// ═══ Projeto e vistoria ═══
await nav("/bens/novo", 3500);
await shot("novo-projeto", [
  { n: 1, css: "input[name=name], input[placeholder^='Ex.: Retrofit']" },
  { n: 2, text: "Tipo", tag: "label", up: 1 },
  { n: 3, text: "Ano / período de construção", tag: "label", up: 1 },
  { n: 4, text: "Localização", up: 1 },
  { n: 5, text: "Criar projeto", tag: "button" },
]);
await nav(`/bens/${DEMO}`, 5000);
await shot("projeto-resumo", [
  { n: 1, text: "Resumo", tag: "a", up: 1 },
  { n: 2, text: "Danos apontados", up: 2 },
  { n: 3, text: "Prioridades", up: 2 },
  { n: 4, text: "Custo por tipo de dano", up: 2 },
  { n: 5, text: "Nova vista", tag: "a" },
  { n: 6, text: "Gerar laudo", tag: "a" },
]);
await nav(`/bens/${DEMO}?aba=danos`, 5000);
await shot("projeto-danos", [
  { n: 1, text: "Prioridade (matriz GUT)", up: 1 },
  { n: 2, text: "Gravidade", tag: "h2,h3,p,div", up: 1 },
  { n: 3, text: "Custo por tipo de dano", up: 1 },
  { n: 4, text: "Lista de prioridades", up: 1 },
]);
await nav(`/bens/${DEMO}?aba=areas`, 4000);
await shot("projeto-areas", [
  { n: 1, css: "input[placeholder^='Ex.: Fachada']" },
  { n: 2, text: "Adicionar", tag: "button" },
  { n: 3, text: "Torres sineiras", up: 1 },
]);
await nav(`/bens/${DEMO}?aba=vistorias`, 4500);
await shot("projeto-vistorias", [
  { n: 1, text: "Nova vistoria", tag: "h2,h3,p,div,span", up: 1 },
  { n: 2, text: "Vistoria de demonstração", up: 2 },
  { n: 3, text: "Fotos com o celular", tag: "button,a" },
  { n: 4, text: "Enviar fotos", tag: "button,a,label" },
  { n: 5, text: "Comparar", tag: "a" },
]);
await nav(`/bens/${DEMO}?aba=ficha`, 4000);
await shot("projeto-ficha", [{ n: 1, text: "Editar ficha", tag: "a" }]);
await nav(`/bens/${DEMO}?aba=laudo`, 5000);
await shot("projeto-laudo", [
  { n: 1, text: "Título", tag: "label,p,div", up: 1 },
  { n: 2, text: "Objeto e finalidade", tag: "label,p,div", up: 1 },
  { n: 3, text: "Metodologia", tag: "label,p,div", up: 1 },
  { n: 4, text: "Gerar laudo", tag: "a" },
]);

// ═══ Vistas em escala ═══
await nav(`/bens/${CASARAO}/ortofotos/nova`, 5000);
await shot("nova-vista-tipos", [
  { n: 1, text: "Fachada (foto retificada)", up: 1 },
  { n: 2, text: "Planta baixa", up: 1 },
  { n: 3, text: "Imagem em escala", up: 1 },
]);
// sobe a foto da Igreja do Carmo no retificador
{
  const { root } = await send("DOM.getDocument", { depth: -1, pierce: true });
  const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: "input[type=file]" });
  if (nodeId) {
    await send("DOM.setFileInputFiles", { nodeId, files: [FOTO] });
    await sleep(6000);
  } else console.warn("  ! sem campo de arquivo no retificador");
}
await ev(CLEAN);
await shot("retificar", [
  { n: 1, css: "[data-tour=retificar-foto]" },
  { n: 2, text: "Ajustar pontos", tag: "button" },
  { n: 3, text: "Largura real (m)", tag: "label", up: 1 },
  { n: 4, text: "Altura real (m)", tag: "label", up: 1 },
  { n: 5, text: "Área", tag: "label", up: 1 },
]);
await ev("window.scrollTo(0, 700)");
await sleep(900);
await shot("retificar-precisao", [
  { n: 1, text: "Conferência", tag: "button" },
  { n: 2, text: "Ponto de controle", tag: "button" },
  { n: 3, text: "Linha reta", tag: "button" },
  { n: 4, text: "Precisão profissional", up: 1 },
  { n: 5, text: "Retificar e abrir no editor", tag: "button" },
]);
await nav(`/bens/${CASARAO}/ortofotos/nova?tipo=planta`, 4000);
await shot("nova-vista-planta", [
  { n: 1, text: "Arraste a planta aqui ou clique para escolher", up: 2 },
  { n: 2, text: "Escala (mm por pixel)", tag: "label", up: 1 },
  { n: 3, text: "Enviar e abrir no editor", tag: "button" },
]);
await nav("/modelos", 3500);
const modelo = await ev(`document.querySelector('a[href*="/modelos/"]')?.getAttribute('href')`);
if (modelo) {
  await nav(modelo, 12000);
  await shot("modelo-3d", [
    { n: 1, text: "Navegar", tag: "button" },
    { n: 2, text: "Medir", tag: "button" },
    { n: 3, text: "Gerar ortofoto", tag: "button" },
    { n: 4, text: "Baixar", tag: "a,button" },
  ]);
}
await nav(`/bens/${DEMO}?aba=modelo3d`, 4000);
await shot("modelo-3d-importar", [{ n: 1, text: "Importar modelo 3D", tag: "button,label" }]);

// ═══ Mapa de danos ═══
const EDITOR = `/bens/${DEMO}/ortofotos/${DEMO_VISTA}`;
await nav(EDITOR, 8000);
await shot("editor", [
  { n: 1, css: "[data-tour=biblioteca-danos]" },
  { n: 2, aria: "Aproximar", up: 2 },
  { n: 3, has: "mm/pixel", tag: "button" },
  { n: 4, text: "DXF", tag: "a,button" },
  { n: 5, text: "Prancha PDF", tag: "a,button" },
  { n: 6, text: "Mapeamento completo", up: 2 },
  { n: 7, css: "[data-tour=painel-orcamento]" },
]);
await shot("editor-ferramentas", [
  { n: 1, aria: "Mover" },
  { n: 2, aria: "Aproximar" },
  { n: 3, aria: "Afastar" },
  { n: 4, aria: "Enquadrar" },
  { n: 5, aria: "Contorno IA" },
  { n: 6, aria: "Detectar danos" },
], { clip: { x: 240, y: 40, w: 520, h: 120 } });
await click({ text: "Fissura", tag: "button" });
await sleep(1000);
await shot("editor-desenhar", [
  { n: 1, text: "Fissura", tag: "button" },
  { n: 2, has: "clique para adicionar pontos", tag: "div,span,p" },
]);
await nav(`${EDITOR}?dano=${DEMO_DANO}`, 8000);
await shot("editor-dano", [
  { n: 1, text: "Desenho manual", tag: "p,span,div" },
  { n: 2, css: "[data-tour=gut] ~ * button[role=combobox], aside button[role=combobox], button[role=combobox]", nth: 0 },
  { n: 3, css: "button[role=combobox]", nth: 1 },
  { n: 4, css: "[data-tour=gut]" },
  { n: 5, has: "Prioridade 1", tag: "p,span,div", up: 1 },
  { n: 6, css: "textarea", nth: 0 },
  { n: 7, css: "textarea", nth: 1 },
  { n: 8, aria: "Excluir dano" },
]);
await nav(EDITOR, 8000);
await click({ aria: "Contorno IA" });
await sleep(1500);
await shot("contorno-ia", [
  { n: 1, aria: "Contorno IA" },
  { n: 2, aria: "Modo do contorno" },
]);
await nav(EDITOR, 8000);
await click({ aria: "Detectar danos" });
for (let i = 0; i < 40; i++) {
  await sleep(1000);
  if (await ev(`!!document.querySelector('[data-tour=sugestoes-ia]')`)) break;
}
await sleep(1500);
await shot("deteccao", [
  { n: 1, aria: "Detectar danos" },
  { n: 2, css: "[data-tour=sugestoes-ia]" },
  { n: 3, text: "Confiança mínima", tag: "label" },
  { n: 4, text: "Rejeitar as", tag: "button" },
]);
await ev(`(() => { const b = document.querySelector('[data-tour=sugestoes-ia] ul button'); b?.click(); return !!b })()`);
await sleep(1500);
await shot("deteccao-revisar", [
  { n: 1, text: "Sugestão da IA", tag: "span,div" },
  { n: 2, text: "Classe do dano", tag: "label" },
  { n: 3, text: "Aceitar como dano", tag: "button" },
  { n: 4, text: "Não é dano", tag: "button" },
]);

// ═══ Orçamento e entregáveis ═══
await nav("/biblioteca", 4500);
await shot("precos", [
  { n: 1, text: "Fissuração", tag: "h2,h3,p,div", up: 1 },
  { n: 2, css: "input[value^='Abertura em V']" },
  { n: 3, css: "input[inputmode=decimal], input[type=number]" },
  { n: 4, text: "sugerido", tag: "span" },
]);

// ═══ Acompanhar ═══
await nav(`/bens/${CMP}/comparar`, 9000);
await shot("comparar", [
  { n: 1, text: "Antes:", tag: "button" },
  { n: 2, text: "Depois:", tag: "button" },
  { n: 3, text: "Cortina", tag: "button" },
  { n: 4, text: "Alinhar", tag: "button" },
  { n: 5, text: "O que mudou", up: 1 },
]);

// ═══ Equipe e conta ═══
await nav("/equipe", 4000);
await shot("equipe", [
  { n: 1, text: "Convidar pessoa", up: 1 },
  { n: 2, text: "Membros (2)", up: 1 },
  { n: 3, text: "Ajudar a treinar a IA do ArchRay", up: 1 },
]);
await nav("/perfil", 4000);
await shot("perfil", [
  { n: 1, text: "Nome completo", tag: "label", up: 1 },
  { n: 2, text: "Registro profissional", tag: "label", up: 1 },
  { n: 3, text: "Prévia no carimbo", up: 1 },
  { n: 4, text: "Senha", tag: "h2,h3,p,div", up: 1 },
]);
await nav("/mapas", 4500);
await shot("mapas", [{ n: 1, text: "Fachada principal (demonstração)", up: 2 }]);

ws.close();
proc.kill();
{
  // limpeza: as sugestões pendentes criadas pela detecção na vista de demonstração
  const { neon } = await import("@neondatabase/serverless");
  const env = Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter((l) => l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
  );
  const sql = neon(env.DATABASE_URL);
  const r = await sql`delete from damage_suggestions where orthophoto_id = ${DEMO_VISTA} and status = 'pendente' returning id`;
  console.log(`limpeza: ${r.length} sugestões pendentes removidas da demonstração`);
}
process.exit(0);
