@AGENTS.md

# Oraclo — do scan ao BIM

Plataforma (web, com captura integrada para celular) de **scan-to-BIM** para qualquer
edificação (reforma, retrofit, indústria, varejo, patrimônio): o cliente captura com o
celular (fotos ou vídeo), drone ou laser — ou envia a nuvem pronta — e recebe nuvem de
pontos validada, **modelo BIM (RVT, PLN, IFC)** modelado pela equipe/parceiros, ortofotos,
mapa de danos e documentação. Escopo, fases e decisões em **`PRD.md`** (v0.2; ler antes de
qualquer feature nova).

**Nomenclatura:** na interface a entidade `sites` se chama **Projeto** e `elements` se chama
**Área**; as rotas continuam em `/bens/...` (nome interno antigo).

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
- **Pedidos de modelo BIM** (`/bim`, `/operacao`; lógica em `src/lib/bim.ts`, `src/lib/bim-orders.ts`, ações em
  `src/app/(app)/bim/actions.ts`). Fluxo: solicitado → orçado → aprovado → em modelagem → conferência interna →
  entregue → (revisão) → concluído. Acesso por `accessOf()`: organização cliente, **operador** (vê tudo) ou
  **parceiro** atribuído (sem preços; versões dele só chegam ao cliente depois que um operador libera).
  `users.platform_role` = operador/parceiro; e-mails em `PLATFORM_OPERATORS` viram operadores automaticamente.
  Preço/prazo automáticos são **estimativas** (`estimate()` em `src/lib/bim.ts`, valores a validar).
- Datas sempre por `src/lib/format.ts` (fuso America/Sao_Paulo); servidor roda em UTC.
- Rótulos dos enums em `src/lib/labels.ts`.
- Tokens de convite e de nova senha: só o **hash** fica no banco (`src/lib/email.ts`, `src/lib/tokens.ts`).
  Funções que criam links (ex.: `createResetFor`) ficam em `src/lib/*`, nunca exportadas de arquivo `"use server"`.
- Biblioteca de danos padrão = linhas de `damage_types` com `org_id` nulo
  (`src/lib/damage-library.ts`, idempotente). Personalizadas têm `org_id`.
- Ortofotos (JPG/PNG) vão para o **Vercel Blob** (store `oraclo-files`, gru1, público com
  sufixo aleatório) por upload direto do navegador (`/api/upload`, que valida sessão,
  papel e o bem). Caminho: `orgs/<orgId>/sites/<siteId>/...`. Nuvens/malhas pesadas
  irão para Cloudflare R2 (ainda não conectado) — o banco guarda só metadados.
- Mapa de danos: pontos em **pixels da imagem** (`damages.geometry.points`); áreas e
  comprimentos vêm de `src/lib/geometry.ts` × `orthophotos.mm_per_pixel` e são
  recalculados no servidor a cada mudança de escala. Exportações em
  `src/lib/exports/` (DXF R2007 em metros + IMAGE, zipado com a ortofoto; prancha A3 em PDF).
- Testar exportações fora do Next: `.cache/check-exports.mts` com `tsx` e o tsconfig
  `.cache/tsconfig.check.json` (stub de `server-only`).
- Mockado primeiro: app de captura, upload e processamento em GPU ainda não existem;
  a UI mostra "em breve" nesses pontos.

## Env (Vercel + `.env.local`)
`DATABASE_URL` (+ vars Neon), `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, `PLATFORM_OPERATORS` (e-mails separados por vírgula).
E-mail (convites e nova senha): `RESEND_API_KEY` + `EMAIL_FROM` (ex.: "Oraclo <nao-responda@dominio>"); sem eles roda em
**modo simulado** (`src/lib/email.ts`): nada é enviado, o texto vai para o log e o admin vê o link para copiar.
`APP_URL` opcional (base dos links; senão usa o host da requisição).

## Deploy
Produção em **oraclo-app.vercel.app** (oraclo.vercel.app pertence a terceiros).
