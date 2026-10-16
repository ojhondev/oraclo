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
  em estilo minimalista de buscador (Perplexity como referência), **só preto e branco** (cinzas
  neutros), com tema claro/escuro/sistema (`next-themes`, classe `.dark`, seletor em Aparência).
  Única cor permitida: a legenda de danos. Marca em `src/components/brand.tsx` + `public/brand`.
  Fonte Geist em tudo, botões em pílula. Barra lateral recolhível
  (cookie `oraclo_sidebar`, ver `src/lib/ui-prefs.ts`).
- Neon Postgres + Drizzle (`src/lib/db/schema.ts`). `npm run db:push` aplica o schema.
- Dev: `npm run dev` → porta **3022** (entrada `oraclo` em `A:\Claude Code\Velo\.claude\launch.json`).

## Regras do projeto
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
- Fase 2 (não feito): contorno com IA no navegador (SAM/SlimSAM via transformers.js), sugestões de
  fissuras, foto 360°, comparação entre vistorias, tipos de dano personalizados.
- **Retificação métrica (v2)** (src/lib/rectify.ts, motor puro + rectify.worker.ts): plano em metros (origem no canto SE do retângulo de referência, y para baixo) → homografia por mínimos quadrados (DLT normalizada; 4 cantos + pontos de controle extras) → distorção radial k1 (estimada por linhas retas, busca áurea). Conferências medem o erro real; precisionMm = 1,96·σ (conferências/resíduos, piso na incerteza de marcação 0,7 px). Saída: só o retângulo ou plano inteiro (margens, limitado a 1× a referência), superamostragem adaptativa até 3×3, foto reduzida acima de 36 MP. Tudo fica em orthophotos.rectification (version 2) e aparece no editor e no laudo. Teste sintético: .cache/rectify-test.mts.
- **Site bilíngue (PT/EN)**: só o site público e a Documentação; o app continua em português. Idioma no cookie `archray_lang` (sem cookie: Accept-Language do navegador), lido por `getLang()` (src/lib/site/get-lang.ts); seletor PT | EN no cabeçalho. Textos: `src/lib/site/home-copy.ts`, dicionários `T` em cada página, `docs-en.ts`, `updates-en.ts`, `getStories(lang)`; nomes de danos e faixas GUT em inglês em `i18n-data.ts`. Texto novo no site = escrever nas duas línguas.
- **Demonstração guiada** (src/lib/demo.ts, src/components/demo-tour.tsx): cada organização tem no máximo um projeto `sites.is_demo` (Igreja do Carmo, foto de 2010 em public/demo, domínio público). As 10 missões são concluídas pelo que está no banco (GET /api/demo) ou por eventos/rotas; o progresso fica em localStorage (`archray:demo-tour`). "Refazer do zero" apaga o projeto e os blobs do prefixo e recria vazio. A retificação mostra alvos nos cantos quando o projeto é de demonstração. Mudou um passo do fluxo? Ajuste a missão correspondente.
- **Documentação** (/docs, src/lib/site/docs.ts): prints reais em public/docs, gerados por `.cache/shots.mjs` (Edge headless via CDP, conta de teste local, projeto de demonstração). Mudou uma tela? Regere os prints.

## Env (Vercel + `.env.local`)
`DATABASE_URL` (+ vars Neon), `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`. (`PLATFORM_OPERATORS` era do fluxo BIM e não é mais usado.)
E-mail (convites e nova senha): `RESEND_API_KEY` + `EMAIL_FROM` (ex.: "ArchRay <nao-responda@dominio>"); sem eles roda em
**modo simulado** (`src/lib/email.ts`): nada é enviado, o texto vai para o log e o admin vê o link para copiar.
`APP_URL` opcional (base dos links; senão usa o host da requisição).

## Deploy
Produção em **oraclo-app.vercel.app** (oraclo.vercel.app pertence a terceiros).
