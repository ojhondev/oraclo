// Gera treino/archray_segmentacao.ipynb (o notebook é escrito aqui para ficar legível no git).
//   node scripts/gerar-notebook-treino.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const md = (s) => ({ cell_type: "markdown", metadata: {}, source: lines(s) });
const py = (s) => ({ cell_type: "code", metadata: {}, execution_count: null, outputs: [], source: lines(s) });
const lines = (s) => {
  const t = s.replace(/^\n/, "").replace(/\n\s*$/, "");
  const arr = t.split("\n");
  return arr.map((l, i) => (i < arr.length - 1 ? l + "\n" : l));
};

const cells = [
  md(`
# ArchRay · treino do modelo de segmentação de danos (ml-1)

Treina, **de graça**, o modelo próprio de detecção de danos do ArchRay e gera os arquivos que o app
carrega no navegador (ONNX Runtime Web). Roda numa GPU gratuita:

- **Kaggle** (recomendado: ~30 h/semana de GPU T4): *New Notebook › File › Import Notebook*, ligue *Accelerator: GPU T4* e *Internet: On*.
- **Google Colab**: *Ambiente de execução › Alterar o tipo › T4 GPU*.

**Dados**

1. **Base do ArchRay** (obrigatória para avaliar): no computador do projeto, rode
   \`node scripts/treino-exportar.mjs\` e \`node scripts/treino-avaliar.mjs\`, compacte \`.cache/treino/archray\`
   em \`archray.zip\` e suba como *Dataset* no Kaggle (ou no Colab, na pasta \`/content\`).
2. **Bases públicas** (opcionais, CC BY 4.0, uso comercial permitido com atribuição — já citadas na ficha do modelo):
   - *BFDD — Building Façade Defect Dataset* (Mendeley Data, doi:10.17632/9ych7czvyg): fissura, descascamento, oco, mancha, erosão.
   - *Concrete Crack Segmentation Dataset* (Özgenel, 2019, Mendeley Data, doi:10.17632/jwsn7tfbrp.1): fissuras.

   Baixe os .zip pela página de cada uma e suba como *Dataset* (ou em \`/content\`).

**Regra de ouro**: a validação usa **só** vistas reais do ArchRay, de projetos que não entram no treino.
Uma classe só é ligada no app se, nessas vistas, tiver precisão ≥ 70 %, revocação ≥ 35 % e for
**melhor que o motor clássico cv-2** — o resto continua com o cv-2.
`),
  py(`
!pip -q install segmentation-models-pytorch==0.3.3 albumentations==1.4.3 onnx==1.16.1 onnxruntime==1.18.1
`),
  py(`
import os, glob, json, math, random, zipfile, datetime
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F
from PIL import Image
import albumentations as A
import segmentation_models_pytorch as smp

# ── onde estão os dados (ajuste se precisar) ──
KAGGLE = os.path.exists('/kaggle/input')
ROOT_IN = '/kaggle/input' if KAGGLE else '/content'
OUT = '/kaggle/working/modelo' if KAGGLE else '/content/modelo'
os.makedirs(OUT, exist_ok=True)

def find_dir(*names):
    """Procura uma pasta pelo nome dentro dos datasets anexados (e dentro de .zip já extraídos)."""
    for z in glob.glob(f'{ROOT_IN}/**/*.zip', recursive=True):
        dst = '/tmp/x/' + os.path.basename(z)[:-4]
        if not os.path.exists(dst):
            zipfile.ZipFile(z).extractall(dst)
    for base in [ROOT_IN, '/tmp/x']:
        for n in names:
            hits = [p for p in glob.glob(f'{base}/**/{n}', recursive=True) if os.path.isdir(p)]
            if hits: return hits[0]
    return None

ARCHRAY = find_dir('archray')
assert ARCHRAY and os.path.exists(f'{ARCHRAY}/classes.json'), 'Base do ArchRay não encontrada (pasta archray com classes.json).'
CFG = json.load(open(f'{ARCHRAY}/classes.json'))
CLASSES = [c['name'] for c in CFG['classes']]
NC, IGN, TILE = len(CLASSES), CFG['ignore'], CFG['tile']
DEV = 'cuda' if torch.cuda.is_available() else 'cpu'
print('classes:', CLASSES, '| dispositivo:', DEV)
random.seed(0); np.random.seed(0); torch.manual_seed(0)
`),
  md(`
## 1. Pares imagem/máscara

As bases públicas são convertidas para as classes do ArchRay. Classes que não existem lá ficam
**ignoradas** (255), nunca como "fundo" — senão o modelo aprenderia que um dano que a base não marcou é parede sã.
`),
  py(`
def archray_pairs(split):
    imgs = sorted(glob.glob(f'{ARCHRAY}/{split}/img/*.jpg'))
    return [(p, p.replace('/img/', '/mask/').replace('.jpg', '.png'), None) for p in imgs]

def stem(p): return os.path.splitext(os.path.basename(p))[0]

def pair_by_stem(root, img_hint=('image', 'img', 'rgb', 'visible'), mask_hint=('mask', 'label', 'gt', 'annotation')):
    files = [p for p in glob.glob(f'{root}/**/*', recursive=True) if p.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tif'))]
    masks = {stem(p): p for p in files if any(h in p.lower() for h in mask_hint)}
    out = []
    for p in files:
        low = p.lower()
        if any(h in low for h in mask_hint) or 'ir' in os.path.basename(low).split('_'):
            continue
        if any(h in low for h in img_hint) and stem(p) in masks:
            out.append((p, masks[stem(p)]))
    return out

# BFDD: confira os valores da máscara antes de treinar (a célula abaixo imprime) e ajuste o mapa.
# Ordem das classes no artigo: fissura, descascamento, oco, mancha, erosão.
BFDD_MAP = {0: 0, 1: 1, 2: 2, 3: IGN, 4: 3, 5: 5}   # valor na máscara → classe ArchRay
BFDD = find_dir('BFDD', 'bfdd')
bfdd = pair_by_stem(BFDD) if BFDD else []
if bfdd:
    vals = set()
    for _, m in bfdd[:40]: vals |= set(np.unique(np.array(Image.open(m).convert('L'))).tolist())
    print('BFDD:', len(bfdd), 'pares; valores encontrados nas máscaras:', sorted(vals))
    faltam = sorted(v for v in vals if v not in BFDD_MAP)
    assert not faltam, f'Valores sem mapeamento no BFDD: {faltam}. Abra algumas máscaras e complete BFDD_MAP.'

OZ = find_dir('Concrete Crack Segmentation Dataset', 'concreteCrackSegmentationDataset', 'jwsn7tfbrp')
ozg = pair_by_stem(OZ, img_hint=('rgb', 'image', 'img'), mask_hint=('bw', 'mask', 'gt')) if OZ else []
print('Özgenel:', len(ozg), 'pares')

def lut(mapping):
    t = np.full(256, IGN, np.uint8)
    for k, v in mapping.items(): t[k] = v
    return t
BFDD_LUT = lut(BFDD_MAP)
OZ_LUT = np.where(np.arange(256) > 127, 1, 0).astype(np.uint8)   # fissura sobre fundo

train = archray_pairs('train') + [(i, m, BFDD_LUT) for i, m in bfdd] + [(i, m, OZ_LUT) for i, m in ozg]
val_tiles = archray_pairs('val')
print('treino:', len(train), 'recortes/imagens | validação (ArchRay):', len(val_tiles))
assert len(train) > 0, 'Nada para treinar.'
`),
  py(`
MEAN = np.array([0.485, 0.456, 0.406], np.float32); STD = np.array([0.229, 0.224, 0.225], np.float32)

AUG = A.Compose([
    A.LongestMaxSize(max_size=2200),
    A.PadIfNeeded(TILE, TILE, border_mode=0, value=0, mask_value=IGN),
    A.RandomCrop(TILE, TILE),
    A.HorizontalFlip(),
    A.Affine(scale=(0.6, 1.4), rotate=(-12, 12), shear=(-6, 6), p=0.7, mode=0, cval=0, cval_mask=IGN),
    # luz e cor variam muito entre obras: é aqui que o modelo fica robusto a sombra e pintura
    A.RandomShadow(p=0.3),
    A.RandomBrightnessContrast(0.3, 0.3, p=0.8),
    A.HueSaturationValue(25, 35, 20, p=0.8),
    A.OneOf([A.GaussianBlur(), A.MotionBlur(), A.ImageCompression(40, 90)], p=0.4),
])

class Pairs(torch.utils.data.Dataset):
    def __init__(self, items, aug): self.items, self.aug = items, aug
    def __len__(self): return len(self.items)
    def __getitem__(self, i):
        ip, mp, table = self.items[i]
        img = np.array(Image.open(ip).convert('RGB'))
        m = np.array(Image.open(mp).convert('L'))
        if table is not None: m = table[m]
        if m.shape != img.shape[:2]: m = np.array(Image.fromarray(m).resize(img.shape[1::-1], Image.NEAREST))
        if self.aug: r = self.aug(image=img, mask=m); img, m = r['image'], r['mask']
        x = ((img.astype(np.float32) / 255 - MEAN) / STD).transpose(2, 0, 1)
        return torch.from_numpy(x), torch.from_numpy(m.astype(np.int64))

dl_train = torch.utils.data.DataLoader(Pairs(train, AUG), batch_size=12, shuffle=True, num_workers=2, drop_last=True)
dl_val = torch.utils.data.DataLoader(Pairs(val_tiles, None), batch_size=12, num_workers=2) if val_tiles else None
`),
  md(`
## 2. Modelo e treino

U-Net com codificador MobileNetV2 (pesos ImageNet do torchvision, licença BSD): leve o bastante
para rodar no navegador. Perda = entropia cruzada (com peso maior nas classes raras) + Dice.
`),
  py(`
model = smp.Unet('mobilenet_v2', encoder_weights='imagenet', classes=NC).to(DEV)

# pesos por classe: inverso da raiz da frequência na base do ArchRay
freq = np.ones(NC)
for _, mp, table in train[:2000]:
    m = np.array(Image.open(mp).convert('L'))
    if table is not None: m = table[m]
    for c in range(NC): freq[c] += (m == c).sum()
w = 1 / np.sqrt(freq / freq.sum()); w = w / w.mean()
print('pesos:', dict(zip(CLASSES, np.round(w, 2))))
ce = nn.CrossEntropyLoss(weight=torch.tensor(w, dtype=torch.float32, device=DEV), ignore_index=IGN)
dice = smp.losses.DiceLoss('multiclass', ignore_index=IGN)
EPOCHS = 40
opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=1e-3, total_steps=EPOCHS * len(dl_train))
scaler = torch.cuda.amp.GradScaler(enabled=DEV == 'cuda')

def confusion(pred, truth, k=NC):
    ok = truth != IGN
    return torch.bincount(truth[ok] * k + pred[ok], minlength=k * k).reshape(k, k)

def miou(cm):
    tp = cm.diag().float(); iou = tp / (cm.sum(0) + cm.sum(1) - tp).float().clamp(min=1)
    present = cm.sum(1)[1:] > 0
    return iou[1:][present].mean().item() if present.any() else 0.0

best = -1
for ep in range(EPOCHS):
    model.train(); tot = 0
    for x, y in dl_train:
        x, y = x.to(DEV), y.to(DEV)
        with torch.autocast(DEV, enabled=DEV == 'cuda'):
            out = model(x); loss = ce(out, y) + dice(out, y)
        opt.zero_grad(); scaler.scale(loss).backward(); scaler.step(opt); scaler.update(); sched.step(); tot += loss.item()
    score = 0.0
    if dl_val:
        model.eval(); cm = torch.zeros(NC, NC, dtype=torch.long, device=DEV)
        with torch.no_grad():
            for x, y in dl_val:
                cm += confusion(model(x.to(DEV)).argmax(1).flatten(), y.to(DEV).flatten())
        score = miou(cm)
    print(f'época {ep+1:02d} · perda {tot/len(dl_train):.3f} · mIoU val {score:.3f}')
    if score >= best: best = score; torch.save(model.state_dict(), f'{OUT}/melhor.pt')
model.load_state_dict(torch.load(f'{OUT}/melhor.pt')); model.eval()
`),
  md(`
## 3. Avaliação nas vistas inteiras (igual ao app)

Mesmo recorte do navegador (512 px, sobreposição de 64), mesma métrica do \`treino-avaliar.mjs\`
(pixels, ignorando o que não tem rótulo). O limiar de cada classe é escolhido para priorizar a
**precisão** (F0,5): para laudo, sugestão errada custa mais que dano não sugerido.
`),
  py(`
def predict_view(img):
    h, w = img.shape[:2]; step = TILE - 64
    acc = np.zeros((NC, h, w), np.float32); cnt = np.zeros((h, w), np.float32)
    ys = list(range(0, max(1, h - TILE), step)) + [max(0, h - TILE)]
    xs = list(range(0, max(1, w - TILE), step)) + [max(0, w - TILE)]
    for y0 in sorted(set(ys)):
        for x0 in sorted(set(xs)):
            crop = np.zeros((TILE, TILE, 3), np.uint8); part = img[y0:y0+TILE, x0:x0+TILE]
            crop[:part.shape[0], :part.shape[1]] = part
            x = torch.from_numpy(((crop.astype(np.float32) / 255 - MEAN) / STD).transpose(2, 0, 1))[None].to(DEV)
            with torch.no_grad(): p = torch.softmax(model(x), 1)[0].cpu().numpy()
            acc[:, y0:y0+part.shape[0], x0:x0+part.shape[1]] += p[:, :part.shape[0], :part.shape[1]]
            cnt[y0:y0+part.shape[0], x0:x0+part.shape[1]] += 1
    return acc / np.maximum(cnt, 1)

views = sorted(glob.glob(f'{ARCHRAY}/views/*.jpg'))
probs, truths = [], []
for v in views:
    probs.append(predict_view(np.array(Image.open(v).convert('RGB'))))
    truths.append(np.array(Image.open(v[:-4] + '.png').convert('L')))
print('vistas de validação:', len(views))

def scores_at(c, t):
    tp = fp = fn = 0
    for p, g in zip(probs, truths):
        ok = g != IGN; pc = (p[c] >= t) & (p.argmax(0) == c) & ok; gc = (g == c) & ok
        tp += (pc & gc).sum(); fp += (pc & ~gc).sum(); fn += (~pc & gc).sum()
    prec = tp / (tp + fp) if tp + fp else None; rec = tp / (tp + fn) if tp + fn else None
    iou = tp / (tp + fp + fn) if tp + fp + fn else None
    return dict(precision=prec, recall=rec, iou=iou, pixels=int(tp + fn))

cv2_eval = {}
for f in glob.glob(f'{ARCHRAY}/avaliacao-cv-*.json'): cv2_eval = json.load(open(f))['classes']
report, thresholds, enabled = {}, {}, {}
for c in range(1, NC):
    name = CLASSES[c]; best_t, best_f = 0.5, -1
    for t in np.arange(0.3, 0.96, 0.05):
        s = scores_at(c, t); p, r = s['precision'] or 0, s['recall'] or 0
        f = (1.25 * p * r / (0.25 * p + r)) if p + r else 0
        if f > best_f: best_f, best_t = f, float(t)
    s = scores_at(c, best_t); thresholds[name] = round(best_t, 2); report[name] = s
    base = cv2_eval.get(name, {})
    better = (s['precision'] or 0) >= (base.get('precision') or 0) and (s['iou'] or 0) >= (base.get('iou') or 0)
    enabled[name] = bool(s['pixels'] >= 2000 and (s['precision'] or 0) >= 0.70 and (s['recall'] or 0) >= 0.35 and better)
    print(f"{name:15s} limiar {best_t:.2f} · precisão {s['precision']} · revocação {s['recall']} · IoU {s['iou']} · cv-2 {base} → {'LIGADA' if enabled[name] else 'desligada'}")
`),
  md(`
## 4. Exportar para o navegador + ficha do modelo
`),
  py(`
VERSION = 'ml-1'
dummy = torch.zeros(1, 3, TILE, TILE, device=DEV)
class WithSoftmax(nn.Module):
    def __init__(self, m): super().__init__(); self.m = m
    def forward(self, x): return torch.softmax(self.m(x), 1)
torch.onnx.export(WithSoftmax(model).eval(), dummy, f'{OUT}/{VERSION}.onnx', input_names=['imagem'], output_names=['probs'], opset_version=17)

# quantização int8 (estática, calibrada com recortes de treino): ~4× menor para o navegador
from onnxruntime.quantization import quantize_static, CalibrationDataReader, QuantType, QuantFormat
class Calib(CalibrationDataReader):
    def __init__(self):
        sample = random.sample(train, min(64, len(train))); self.it = iter(sample)
    def get_next(self):
        nxt = next(self.it, None)
        if nxt is None: return None
        x, _ = Pairs([nxt], AUG)[0]
        return {'imagem': x[None].numpy()}
quantize_static(f'{OUT}/{VERSION}.onnx', f'{OUT}/{VERSION}-int8.onnx', Calib(), quant_format=QuantFormat.QDQ,
                activation_type=QuantType.QUInt8, weight_type=QuantType.QInt8, per_channel=True)
for f in [f'{VERSION}.onnx', f'{VERSION}-int8.onnx']: print(f, round(os.path.getsize(f'{OUT}/{f}') / 1e6, 1), 'MB')
`),
  py(`
counts = {'archray': len(archray_pairs('train')), 'bfdd': len(bfdd), 'ozgenel': len(ozg)}
card = {
    'version': VERSION,
    'file': f'{VERSION}-int8.onnx',
    'input': {'name': 'imagem', 'size': TILE, 'mean': MEAN.tolist(), 'std': STD.tolist(), 'maxSide': CFG['maxSide'], 'overlap': 64},
    'output': 'probs',
    'classes': CFG['classes'],
    'thresholds': thresholds,
    'enabled': enabled,
    'metrics': {'views': len(views), 'model': report, 'cv2': cv2_eval},
    'training': {
        'date': datetime.date.today().isoformat(), 'epochs': EPOCHS, 'architecture': 'U-Net + MobileNetV2 (ImageNet)',
        'samples': counts,
        'sources': [
            'Vistas do ArchRay de organizações que autorizaram o uso para treino (danos validados por profissionais).',
            'BFDD — Building Façade Defect Dataset, Mendeley Data, doi:10.17632/9ych7czvyg (CC BY 4.0).' if bfdd else None,
            'Özgenel, Ç. F. (2019). Concrete Crack Segmentation Dataset, Mendeley Data, doi:10.17632/jwsn7tfbrp.1 (CC BY 4.0).' if ozg else None,
        ],
    },
    'limitations': 'Mapeia só o que é visível na imagem; não mede abertura de fissuras nem substitui ensaios. Classes desligadas seguem com o motor cv-2.',
}
card['training']['sources'] = [s for s in card['training']['sources'] if s]
json.dump(card, open(f'{OUT}/modelo.json', 'w'), ensure_ascii=False, indent=2)
print(json.dumps(card['enabled'], indent=2))
print('Baixe a pasta', OUT, '(modelo.json + ml-1-int8.onnx) e coloque em public/modelos/ no projeto.')
`),
];

const nb = {
  cells,
  metadata: {
    kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
    language_info: { name: "python" },
    accelerator: "GPU",
  },
  nbformat: 4,
  nbformat_minor: 5,
};
mkdirSync("treino", { recursive: true });
writeFileSync("treino/archray_segmentacao.ipynb", JSON.stringify(nb, null, 1));
console.log(`treino/archray_segmentacao.ipynb (${cells.length} células)`);
