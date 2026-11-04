@AGENTS.md

# ArchRay (ex-Oraclo) — mapa de danos com IA

Nome do produto: **ArchRay** (logotipo em `public/brand`). Pasta, repositório GitHub (ojhondev/oraclo), projeto Vercel e identificadores internos (cookies `oraclo_*`, IndexedDB `oraclo-capturas`) continuam com o nome antigo de propósito.

Central visual de **diagnóstico de edificações existentes**: o imóvel aparece na tela
(fachadas retificadas, plantas, imagens em escala, modelo 3D opcional), os danos são
apontados em cima — à mão (IA de contorno na fase 2) — e a plataforma calcula
quantitativos, **orçamento do tratamento**, prioridade **GUT** e gera o **laudo de estado de
conservação** em PDF. Piloto: Estúdio Restaura; público também inspeção predial/patologia.
Escopo e decisões em **`PRD.md`** (v0.3; ler antes de qualquer feature nova). A v0.2
(scan-to-BIM, nuvem de pontos) foi abandonada — histórico em `docs/PRD-v0.2-scan-to-bim.md`.
Tudo deve rodar em planos **gratuitos** (sem GPU/servidor de processamento).

**Nomenclatura (interno → interface):** `sites` = **Projeto**, `elements` = **Área**,
`campaigns` = **Vistoria**, `orthophotos` = **Vista** (`kind`: fachada, planta, imagem,
modelo_3d), `captures` = **Fotos de campo** (ou modelo 3D importado, `mode = laser`).
As rotas continuam em `/bens/...` e `/ortofotos/...` (nomes internos antigos).

## Stack
- Next.js 16.4 (App Router, Server Actions, Turbopack). `cacheComponents` desligado:
  tudo é autenticado e dinâmico; mutações chamam `revalidatePath`.
- Tailwind v4 + shadcn/ui (preset radix-nova). Tema em `src/app/globals.css`
  com a linguagem visual da Anthropic (decisão do usuário, 2026-11-02): marfim `#FAF9F5`, grafite
  `#141413`, cinzas quentes, cartões bege e o lilás da marca `#83809A` como destaque (desde 2026-11-02; laranja só como alerta); tema
  claro/escuro/sistema (`next-themes`, classe `.dark`, escuro em cinzas quentes). Fontes LIVRES
  (as Anthropic Sans/Serif são proprietárias: não usar): Instrument Sans na interface e Source
  Serif 4 em manchetes e títulos de página (`h-display`, `font-serif`). Botões com raio de 10 px.
  Site público: tokens próprios em `src/components/site/site.css` (claro por padrão, `.site-dark`
  opcional, `.site-ink` = faixa escura do rodapé), componentes `a-pill`/`a-btn`/`a-btn-2`/`a-card`/
  `a-tag`/`a-title`/`a-serif` e títulos padronizados por regra. Marca (nova ID, 2026-11-02): polvo lilás (`public/brand/icone.png`; claro em `icone-branco.png`) + nome ARCHRAY (`logo.png`; completas em `logo-completa*.png`, usadas nos PDFs). Componentes em `src/components/brand.tsx`; favicons gerados por `.cache/favicons.mjs`. Barra lateral recolhível
  (cookie `oraclo_sidebar`, ver `src/lib/ui-prefs.ts`).
- Neon Postgres + Drizzle (`src/lib/db/schema.ts`). `npm run db:push` aplica o schema.
- Dev: `npm run dev` → porta **3022** (entrada `oraclo` em `A:\Claude Code\Velo\.claude\launch.json`).

- **Testes**: `npm test` (Vitest, pasta `tests/`) cobre as funções puras — geometria 2D/3D, preços/GUT, próximo passo e o motor de retificação (dados sintéticos de resposta conhecida). Rodar `npm run lint && npm test && npm run build` antes de cada commit. Função pura nova = teste novo.

## Regras do projeto
- **Tela de Projeto** (`/bens/[id]`): barra de funcionalidades em abas por URL (`?aba=resumo|vistas|danos|vistorias|areas|modelo3d|ficha`, mais `?vistoria=`), componentes em `project-ui.tsx`. Resumo = próximo passo (`src/lib/next-step.ts`) + indicadores + prioridades; o detalhe fica em Danos. Todo bloco de grade usa `min-w-0` (sem isso o texto das barras invade o card vizinho). As ações do cabeçalho (`data-tour`: nova-vista, gerar-laudo) ficam sempre visíveis por causa do tour.
- **Laudo editável**: aba "Laudo" do Projeto. Cada campo de texto tem um padrão (`src/lib/laudo-text.ts`, puro e testado) e o rascunho guarda só o que o profissional mudou (tabela `report_drafts`, uma linha por projeto × vistoria, chave "all" = todas). O PDF (`src/lib/exports/laudo.ts`) recebe o texto já resolvido; seções opcionais (objeto, conclusões, ressalvas) só saem se preenchidas, o orçamento pode ficar de fora, e o responsável traz registro e ART/RRT. `getLaudoDraft` é tolerante: sem a tabela, o laudo sai com o padrão. Mudou o schema? Rodar `npm run db:push` (aditivo).
- **Fidelidade da medida**: `measureUncertainty` (geometry.ts) propaga a precisão da retificação (95%) para a margem de erro de cada área e comprimento (primeira ordem, conferida por Monte Carlo no teste); `selfIntersects` bloqueia contorno manual que se cruza (a área sairia errada). Retificação: lente com k1 e k2 (k2 só entra com 6+ linhas, curvatura residual real e ganho de 15%; k1 e k2 são correlacionados, compare o efeito e não os coeficientes), validação "deixa um de fora" (`looMm`, entra na precisão estimada; tolera pontos alinhados) e ponto suspeito por influência (6+ pontos, só o de maior efeito).
- **Modelo 3D é módulo BETA** (fora do núcleo 2D): item "Modelo 3D" com etiqueta BETA na barra lateral (`/modelos`), aba "Modelo 3D" no Projeto (importação em `import-model.tsx`), `BetaBadge` em `src/components/beta-badge.tsx`. A escala do modelo é calibrada com uma medida real e fica em `outputs.meta.scale` (`geometry3d.ts` + ações em `modelos/[oid]/actions.ts`). Marcar danos direto no modelo ainda não existe.
- **Multi-organização**: todo dado pertence a uma `organization`. Toda consulta/ação
  filtra por `user.orgId` — use `getSite(orgId, id)` (`src/lib/sites.ts`) antes de
  tocar em qualquer coisa de um bem; ele dá 404 se o bem não for da organização.
- Papéis: `admin` (tudo, inclusive excluir bem), `tecnico` (edita), `campo` (só captura),
  `leitor` (só vê). `editors` em `src/lib/auth.ts`. Toda server action revalida o papel.
- Consultas que não são actions ficam em `src/lib/*` — nunca exportar consulta de um arquivo `"use server"`.
- **Vista retificada**: `src/lib/rectify.ts` (homografia de 4 pontos + warp bilinear no canvas, no navegador);
  tela em `/bens/[id]/ortofotos/nova` (`?tipo=fachada|planta|imagem`, `?vistoria=`). Guarda a foto
  original (`source_url`) e os cantos/medidas (`rectification`).
- **Orçamento e GUT**: funções puras em `src/lib/pricing.ts` (preço por tipo, unidade m²/m/un pela
  geometria, valores SUGERIDOS hipotéticos por código; GUT = G(severity 2–5) × urgency × trend; faixas
  ≥64/27/12). Preços do escritório em `treatment_prices` (`src/lib/prices.ts`, edição em /biblioteca).
- **Painel e laudo**: `loadDiagnosis()` em `src/lib/diagnosis.ts` alimenta o painel do projeto
  (`/bens/[id]`, filtro `?vistoria=`) e o laudo A4 (`/bens/[id]/laudo`, `src/lib/exports/laudo.ts`).
  IDs dos danos no laudo = código + ordem na vista (iguais aos da prancha A3).
- Datas sempre por `src/lib/format.ts` (fuso America/Sao_Paulo); servidor roda em UTC.
- Rótulos dos enums em `src/lib/labels.ts`.
- Tokens de convite e de nova senha: só o **hash** fica no banco (`src/lib/email.ts`, `src/lib/tokens.ts`).
  Funções que criam links (ex.: `createResetFor`) ficam em `src/lib/*`, nunca exportadas de arquivo `"use server"`.
- Biblioteca de danos padrão = linhas de `damage_types` com `org_id` nulo
  (`src/lib/damage-library.ts`, idempotente). Personalizadas têm `org_id`.
- Vistas (JPG/PNG) vão para o **Vercel Blob** (store `oraclo-files`, gru1, público com
  sufixo aleatório) por upload direto do navegador (`/api/upload`, que valida sessão,
  papel e o bem). Caminho: `orgs/<orgId>/sites/<siteId>/...`. Modelos 3D importados
  também (até 5 GB) — o banco guarda só metadados.
- Mapa de danos: pontos em **pixels da imagem** (`damages.geometry.points`); áreas e
  comprimentos vêm de `src/lib/geometry.ts` × `orthophotos.mm_per_pixel` e são
  recalculados no servidor a cada mudança de escala. Exportações em
  `src/lib/exports/` (DXF R2007 em metros + IMAGE, zipado com a ortofoto; prancha A3 em PDF).
- Testar exportações fora do Next: `.cache/check-exports.mts` com `tsx` e o tsconfig
  `.cache/tsconfig.check.json` (stub de `server-only`).
- Ainda não feito: foto 360°, cobrança (planos), modelo de detecção treinado, comparação no laudo PDF.
- **Retificação métrica (v2)** (src/lib/rectify.ts, motor puro + rectify.worker.ts): plano em metros (origem no canto SE do retângulo de referência, y para baixo) → homografia por mínimos quadrados (DLT normalizada; 4 cantos + pontos de controle extras) → distorção radial k1 (estimada por linhas retas, busca áurea). Conferências medem o erro real; precisionMm = 1,96·σ (conferências/resíduos, piso na incerteza de marcação 0,7 px). Saída: só o retângulo ou plano inteiro (margens, limitado a 1× a referência), superamostragem adaptativa até 3×3, foto reduzida acima de 36 MP. Tudo fica em orthophotos.rectification (version 2) e aparece no editor e no laudo. Teste sintético: .cache/rectify-test.mts.
- **Posicionamento do site = SERVIÇO** (decisão do usuário, 2026-10-17): o ArchRay é o braço de diagnóstico do Estúdio Restaura — arquitetos de restauro entregam o diagnóstico usando tecnologia própria. Copy inspirada na Teiva (headline promessa + "para quem", entregas, 4 etapas, FAQ, "um arquiteto responde"). CTA principal = /contato (form → tabela `leads`; a equipe vê em /solicitacoes, só `platformRole` operador / PLATFORM_OPERATORS). NÃO inventar números, depoimentos, prazos ou região de atendimento.
- **Site bilíngue (PT/EN)**: só o site público e a Documentação; o app continua em português. Idioma no cookie `archray_lang` (sem cookie: Accept-Language do navegador), lido por `getLang()` (src/lib/site/get-lang.ts); seletor PT | EN no cabeçalho. Textos: `src/lib/site/home-copy.ts`, dicionários `T` em cada página, `docs-en.ts`, `updates-en.ts`, `getStories(lang)`; nomes de danos e faixas GUT em inglês em `i18n-data.ts`. Texto novo no site = escrever nas duas línguas.
- **Demonstração guiada** (src/lib/demo.ts, src/components/demo-tour.tsx): cada organização tem no máximo um projeto `sites.is_demo` (Igreja do Carmo, foto de 2010 em public/demo, domínio público). As 10 missões são concluídas pelo que está no banco (GET /api/demo) ou por eventos/rotas; o progresso fica em localStorage (`archray:demo-tour`). "Refazer do zero" apaga o projeto e os blobs do prefixo e recria vazio. A retificação mostra alvos nos cantos quando o projeto é de demonstração. Mudou um passo do fluxo? Ajuste a missão correspondente.
- **Detecção automática de danos** (src/lib/detect/detect.ts, motor puro, em detect.worker.ts; custo zero, nada sai do navegador): visão computacional clássica **"cv-2"**. Princípio: nenhuma regra usa cor absoluta. (1) Segmenta a imagem reduzida em superfícies (Felzenszwalb em Lab; faixas finas = arquitetura ficam separadas; inclusões irregulares cercadas por uma superfície voltam para ela, em passadas — `absorbInclusions`); (2) classifica cada superfície: vazio (L<22, >93, céu), lisa ou decorada (quartil 75 do gradiente > 3,6); (3) fundo local aparado por superfície; (4) desvios em unidades do ruído da própria superfície → clara (DPT/EFL), escura (SUJ/UMA/UMD/PRB), verde (BIO/VEG, exige a<0 de fato); lascas próximas viram uma área (fechamento); (5) descarta arquitetura: polígono simples (IoU ≥ 0,93 com até 6 vértices), peça cheia e convexa de contraste forte, contorno liso + borda nítida (arco, sombra projetada), faixa fina e comprida, verde de borda nítida (pintura), azulado escuro (reflexo); (6) fissuras: Hessiana em 2 escalas + histerese, limiar pelo ruído da superfície, vale dos dois lados, descarta retas (desvio < máx(1,5 px; 1,2% do comprimento)) e as que correm na divisa entre superfícies; só em superfície lisa; (7) avisos de qualidade (`quality`: sombra dura, decorada, resolução, estourada, escura, pouca parede). Cada sugestão traz `reason` (medidas do desvio), salvo em `damage_suggestions.reason`; o dano aceito grava `ai_detector` ("cv-2"), que o laudo cita. Sem aceite em lote (só rejeitar em lote). Gera **sugestões** (tabela `damage_suggestions`), nunca danos: o profissional aceita (vira dano `source = ia_deteccao`) ou rejeita (negativo para treino). Todo dano registra `source`, `ai_confidence`, `ai_detector`, `reviewed_by/at`. Treino futuro: consentimento por organização (`organizations.training_consent`) e base COCO em GET /api/treino/dataset (só operador) → segmentação em GPU gratuita (Colab/Kaggle) → ONNX no navegador. Afinar: `node scripts/bancada-deteccao.mjs <pasta-de-fotos>` (desenha as detecções e os avisos; fotos reais ficam fora do git) e tests/detect.test.ts (casos sintéticos: umidade difusa, perda de pintura em parede rosa, sombra projetada, arco de pedra, junta reta). Lição: calibrar só numa igreja gerou regras de cor fixa que falharam na seguinte — todo ajuste novo precisa passar nas duas bancadas.
- **Mobile como app** (`src/components/app-nav.tsx`): abaixo de `lg`, `MobileBar` (voltar + título por rota, `screenOf`) e `MobileTabBar` (Projetos, Mapas, +, Academy, Mais); telas cheias (`isImmersive`: editor, comparar, visualizador 3D, câmera) têm barra própria e altura `h-svh`. Ajuda abre por `HELP_EVENT`. Editor e comparação: biblioteca e painel viram gavetas (`sheet`, classes `max-md:`/`max-lg:`), pinça em `touchesRef`/`pinchRef`, comandos de desenho na tela. Áreas seguras por `env(safe-area-inset-*)` e `viewportFit: cover`. Prints de celular: `.cache/mob-shots.mjs`.
- **Modelo treinado (ml-1, fase 2)** — esteira gratuita em `treino/README.md`: vistas marcadas como **Mapeamento completo** (`orthophotos.mapping_complete_by/at`, Switch no painel do editor) + danos validados + sugestões rejeitadas, só de orgs com consentimento, sem projetos demo/"Teste…" → `scripts/treino-exportar.mjs` (recortes 512 + máscara 0..6/255; classes em `scripts/treino-comum.mjs`: fissura, perda_pintura, mancha, biologico, perda_reboco, eflorescencia; vista incompleta = 255 fora do que foi marcado; split por projeto) → `scripts/treino-avaliar.mjs` (métrica de pixels do cv-2) → notebook `treino/archray_segmentacao.ipynb` (gerado por `scripts/gerar-notebook-treino.mjs`; U-Net MobileNetV2, Kaggle/Colab T4; bases públicas CC BY 4.0: BFDD e Özgenel) → `public/modelos/modelo.json` + `ml-1-int8.onnx`. No navegador (`src/lib/detect/ml.ts` + worker): sem modelo.json nada muda; com ele, só as classes `enabled` (precisão ≥ 70 %, revocação ≥ 35 % e melhor que o cv-2 na validação) usam o modelo e o cv-2 segue com o resto. O notebook ainda não foi executado de verdade (não havia Python nem dados suficientes quando foi escrito).
- **Comparar vistorias** (/bens/[id]/comparar; motor puro src/lib/compare.ts): o usuário alinha duas vistas com pares de pontos homólogos (2 = similaridade, 3 = afim, ≥4 = homografia por mínimos quadrados via `fitHomography`), guardado em `vista_alignments` (matriz "depois → antes", única por par a,b). A vista depois é deformada só com CSS `matrix3d` (`toMatrix3d`). Danos casados numa grade de ~400 células no referencial da vista A, por sobreposição ≥ 20% e mesma categoria; status novo/cresceu/estável/diminuiu/sumiu (±20%; troca de tipo = cresceu). Só conta a área comum (centróide dentro das duas vistas). Teste: tests/compare.test.ts; projeto "Teste · comparação Carmo" na conta de teste (semeado por .cache/seed-compare.mjs).
- **Site público = estrutura da anthropic.com** (decisão do usuário, 2026-11-02): menu de pílulas com submenus (Index, Tecnologia, Setores, Compromissos | Empresa, Acessar), marca ao centro; páginas Início (manifesto corrido em negrito+serifa, faixa com colagem, 3 cartões de tecnologia, "Saiba mais"), /tecnologia (= Research), /index (= redação, grade em 3 colunas), /empresa (= Company), /compromissos, /empresas (setores), /historias (casos), /docs, /contato. Copy em `src/lib/site/site-copy.ts` (PT/EN, técnica, foco na tecnologia própria; nada de métricas inventadas). Mídia própria: ilustrações SVG em `src/components/site/illo.tsx` (sem fotos, exceto as do caso Carmo).
- **Documentação** (/docs, src/lib/site/docs.ts): prints reais em public/docs, gerados por `.cache/shots.mjs` (Edge headless via CDP, conta de teste local, projeto de demonstração). Mudou uma tela? Regere os prints.

## Env (Vercel + `.env.local`)
`DATABASE_URL` (+ vars Neon), `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`. (`PLATFORM_OPERATORS` era do fluxo BIM e não é mais usado.)
E-mail (convites e nova senha): `RESEND_API_KEY` + `EMAIL_FROM` (ex.: "ArchRay <nao-responda@dominio>"); sem eles roda em
**modo simulado** (`src/lib/email.ts`): nada é enviado, o texto vai para o log e o admin vê o link para copiar.
`APP_URL` opcional (base dos links; senão usa o host da requisição).

## Deploy
Produção em **oraclo-app.vercel.app** (oraclo.vercel.app pertence a terceiros).
