# 🌱 Tracker

Aplicativo de produtividade com **rastreador de hábitos** (heatmap de consistência) e **quadro Kanban** estilo Trello (drag-and-drop, rich text, upload de imagens). Dados reais por usuário via Supabase, interface em pt-BR com tema claro/escuro.

![stack](https://img.shields.io/badge/React-18-61dafb) ![vite](https://img.shields.io/badge/Vite-5-646cff) ![ts](https://img.shields.io/badge/TypeScript-5-3178c6) ![supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20Storage-3ecf8e)

## Funcionalidades

- **Hábitos** — criar/concluir/excluir, streak automático, calendário e heatmap de consistência (mês agregado + resumo anual por hábito).
- **Kanban** — colunas e cards com drag-and-drop (reordenar e mover entre colunas), painel lateral com rich text (Tiptap), etiquetas, data e anexos de imagem.
- **Auth** — email + senha (Supabase Auth), cada usuário vê apenas seus próprios dados (RLS).
- **Online-first** — estado em Zustand com atualizações otimistas; persistência no Postgres; imagens no Supabase Storage.
- **UI** — design system próprio ([design.json](design.json)), responsivo mobile, tema claro/escuro.

## Stack

React + Vite + TypeScript · Tailwind CSS · Zustand · @dnd-kit · Tiptap · Supabase (Postgres / Auth / Storage) · Vitest

## Rodando localmente

### 1. Pré-requisitos
- Node 20+
- Um projeto no [Supabase](https://supabase.com)

### 2. Variáveis de ambiente
Copie o exemplo e preencha com as chaves do seu projeto (Supabase → Settings → API Keys):

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...      # publishable key (pública, segura sob RLS)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...        # secret key — só para o seed, NUNCA commitar
SEED_OWNER_EMAIL=voce@exemplo.com
SEED_OWNER_PASSWORD=uma-senha-forte
```

> `.env.local` está no `.gitignore`. A `service_role`/secret key dá acesso total ignorando RLS — mantenha-a fora do repositório.

### 3. Aplicar o schema
No **SQL Editor** do Supabase, cole e rode o conteúdo de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). Cria tabelas, RLS, trigger de perfil e o bucket de Storage.

(Alternativa via CLI: `npx supabase login && npx supabase link --project-ref <ref> && npx supabase db push`.)

### 4. Instalar e rodar
```bash
npm install
npm run dev          # http://localhost:5173
```

### 5. (Opcional) Popular conta de exemplo
```bash
npm run seed
```
Cria o usuário de `SEED_OWNER_EMAIL` com hábitos e um quadro de exemplo.

## Scripts

| Script | Ação |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (`dist/`) |
| `npm run preview` | Pré-visualizar o build |
| `npm test` | Testes unitários (Vitest) |
| `npm run seed` | Popular a conta-dono (precisa da secret key) |

## Docker (dev)

```bash
docker compose up
```
Sobe o frontend em `http://localhost:5173`. Defina as `VITE_*` no ambiente do container.

## Deploy (Vercel)

1. Push do repositório para o GitHub.
2. Importar na Vercel (preset Vite — build `npm run build`, output `dist`).
3. Definir env vars na Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. No Supabase → Authentication → URL Configuration: adicionar a URL de produção da Vercel em **Site URL** e **Redirect URLs** (inclua `https://*.vercel.app` para previews).

O [`vercel.json`](vercel.json) já configura o rewrite SPA.

## Segurança

- RLS habilitado em todas as tabelas: cada linha é escopada a `auth.uid()`.
- Storage privado com políticas por pasta de usuário; imagens servidas via signed URL.
- Apenas a publishable/anon key vai ao frontend. A secret/service_role key nunca é exposta.

## Estrutura

```
src/
  components/   UI (Sidebar, Card, Drawer, Kanban*, Habit*, RichTextEditor, ImageUpload, ...)
  views/        Auth, HabitTracker, Kanban
  store/        Zustand (auth, habit, kanban, profile, ui, theme)
  lib/          supabase client, api/ (habits|kanban|profile), tipos, streak, utils
supabase/
  migrations/   schema + RLS + storage
  seed.ts       seed da conta-dono
```
