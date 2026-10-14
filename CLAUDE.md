@AGENTS.md

# Oraclo — documentação digital do patrimônio histórico

Plataforma (web) + app de captura (celular) para levantamento de bens históricos
(igrejas, casarões, conjuntos): captura por fotogrametria com o celular → nuvem de
pontos/malha → ortofotos → **mapa de danos** → pranchas e exportações para os softwares
de arquitetura e engenharia. Escopo, fases e decisões em **`PRD.md`** (ler antes de
qualquer feature nova).

## Stack
- Next.js 16.4 (App Router, Server Actions, Turbopack). `cacheComponents` desligado:
  tudo é autenticado e dinâmico; mutações chamam `revalidatePath`.
- Tailwind v4 + shadcn/ui (preset radix-nova). Tema em `src/app/globals.css`
  (pedra clara `#fbfaf8`, grafite `#16181b`, acento pátina `#0e7c7b`; Instrument Sans + Instrument Serif).
- Neon Postgres + Drizzle (`src/lib/db/schema.ts`). `npm run db:push` aplica o schema.
- Dev: `npm run dev` → porta **3022** (entrada `oraclo` em `A:\Claude Code\Velo\.claude\launch.json`).

## Regras do projeto
- **Multi-organização**: todo dado pertence a uma `organization`. Toda consulta/ação
  filtra por `user.orgId` — use `getSite(orgId, id)` (`src/lib/sites.ts`) antes de
  tocar em qualquer coisa de um bem; ele dá 404 se o bem não for da organização.
- Papéis: `admin` (tudo, inclusive excluir bem), `tecnico` (edita), `campo` (só captura),
  `leitor` (só vê). `editors` em `src/lib/auth.ts`. Toda server action revalida o papel.
- Consultas que não são actions ficam em `src/lib/*` — nunca exportar consulta de um arquivo `"use server"`.
- Datas sempre por `src/lib/format.ts` (fuso America/Sao_Paulo); servidor roda em UTC.
- Rótulos dos enums em `src/lib/labels.ts`.
- Biblioteca de danos padrão = linhas de `damage_types` com `org_id` nulo
  (`src/lib/damage-library.ts`, idempotente). Personalizadas têm `org_id`.
- Arquivos pesados (fotos, nuvens, malhas) vão para object storage (Cloudflare R2,
  ainda não conectado) — o banco guarda só metadados (`storage_key`).
- Mockado primeiro: app de captura, upload e processamento em GPU ainda não existem;
  a UI mostra "em breve" nesses pontos.

## Env (Vercel + `.env.local`)
`DATABASE_URL` (+ vars Neon), `AUTH_SECRET`.
