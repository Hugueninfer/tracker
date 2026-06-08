# Backend — Supabase (dados reais por-usuário) · Design

Data: 2026-06-08
Status: Aprovado (aguardando revisão do spec)

## Objetivo

Substituir o armazenamento atual em `localStorage` por um backend real com:

- Dados persistidos e **isolados por usuário** (cada conta vê só os seus dados).
- Autenticação por **email + senha**.
- Imagens de cards em armazenamento de objetos (não base64 no banco).
- Estratégia **online-first** (sem cache offline persistente).
- Pronto para deploy do frontend na **Vercel**.

## Decisões (fechadas no brainstorming)

| Tema | Decisão |
|---|---|
| Plataforma | Supabase (Postgres + Auth + RLS + Storage), projeto hospedado separado |
| Auth | Email + senha (com confirmação de email e reset de senha do próprio Supabase) |
| Imagens | Supabase Storage (bucket privado, signed URLs), banco guarda só o caminho |
| Sincronização | Online-first com updates otimistas; remover `persist` do Zustand |
| Estado no client | Manter Zustand como cache em memória + camada `lib/api` envolvendo Supabase |
| Tema (light/dark) | Continua em `localStorage` (preferência do device) |
| Seed | Dados de exemplo opcionais inseridos no primeiro login se a conta estiver vazia |

## Arquitetura

```
Browser (Vite SPA estático, hospedado na Vercel)
  │  @supabase/supabase-js  (anon key pública — segura sob RLS)
  ▼
Supabase
  ├─ Auth      (email+senha, sessão guardada pelo SDK)
  ├─ Postgres  (RLS força user_id = auth.uid() em toda tabela)
  └─ Storage   (bucket card-images, isolado por pasta de usuário)
```

Sem servidor próprio. O frontend fala direto com o Supabase; o RLS é a fronteira de segurança. A Vercel apenas serve o build estático.

## Modelo de dados (Postgres)

Todas as tabelas (exceto `profiles`) têm `user_id uuid not null references auth.users(id) on delete cascade` e `created_at timestamptz default now()`.

### profiles
- `id uuid primary key references auth.users(id) on delete cascade`
- `name text not null default ''`
- `email text not null default ''`
- `created_at timestamptz default now()`
- Criada automaticamente via trigger `on auth.users insert`.

### habits
- `id uuid primary key default gen_random_uuid()`
- `user_id` (ver acima)
- `emoji text not null`
- `title text not null`
- `meta text not null default ''`
- `position double precision not null default 0`
- **streak e doneToday NÃO são colunas** — derivados de `habit_completions`.

### habit_completions
- `id uuid primary key default gen_random_uuid()`
- `user_id`
- `habit_id uuid not null references habits(id) on delete cascade`
- `date date not null`
- `unique (habit_id, date)`
- Marcar/desmarcar hábito = insert/delete de uma linha nesta tabela.

### columns
- `id uuid primary key default gen_random_uuid()`
- `user_id`
- `title text not null`
- `position double precision not null default 0`

### cards
- `id uuid primary key default gen_random_uuid()`
- `user_id`
- `column_id uuid not null references columns(id) on delete cascade`
- `title text not null default ''`
- `description text not null default ''`  (HTML do Tiptap)
- `notes text not null default ''`        (HTML do Tiptap)
- `due_date date null`
- `labels jsonb not null default '[]'`    (array de `{id,name,tint}` — sem necessidade de query)
- `position double precision not null default 0`

### card_images
- `id uuid primary key default gen_random_uuid()`
- `user_id`
- `card_id uuid not null references cards(id) on delete cascade`
- `storage_path text not null`  (ex.: `{user_id}/{card_id}/{uuid}.png`)
- `name text not null`
- `position double precision not null default 0`

### Ordenação
`position double precision` em habits, columns, cards, card_images. Reordenar = recalcular/atribuir position (ex.: média entre vizinhos). Drag-and-drop já existente passa a persistir position via API.

### Índices
- `habits(user_id, position)`
- `habit_completions(habit_id, date)` (já coberto pelo unique) e `habit_completions(user_id, date)`
- `columns(user_id, position)`
- `cards(column_id, position)`
- `card_images(card_id, position)`

## Segurança (RLS)

- `alter table ... enable row level security` em **todas** as tabelas.
- Política única por tabela cobrindo `select/insert/update/delete`:
  - Tabelas com `user_id`: `using (user_id = auth.uid()) with check (user_id = auth.uid())`.
  - `profiles`: `using (id = auth.uid()) with check (id = auth.uid())`.
- Storage: bucket `card-images` **privado**. Políticas de storage permitem ao usuário ler/escrever/deletar somente objetos cujo primeiro segmento do path seja o seu `auth.uid()`. Acesso de leitura via **signed URL** gerada sob demanda.
- Apenas a **anon key** vai ao frontend (pública por design; RLS protege). A **service_role key nunca** aparece no client nem em código versionado.

## Camada de dados no frontend

```
src/lib/supabase.ts          // createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
src/lib/api/habits.ts        // listHabits, addHabit, updateHabit, removeHabit,
                             //   toggleCompletion(habitId, date), listCompletions
src/lib/api/kanban.ts        // listBoard, addColumn, renameColumn, removeColumn, reorderColumns,
                             //   addCard, updateCard, removeCard, moveCard,
                             //   uploadImage(file, cardId), removeImage, signedUrl(path)
src/lib/api/profile.ts       // getProfile, updateProfile
```

- **Zustand mantido**, sem middleware `persist`. Stores viram cache em memória.
- No login: stores chamam `list*` para popular estado.
- Mutações: **update otimista** no estado local → chamada à API → em erro, rollback + aviso (toast simples).
- `doneToday` e `streak` calculados no client a partir das completions carregadas.
- `authStore`: guarda `session`/`user`; assina `supabase.auth.onAuthStateChange`.
- `themeStore`: permanece em `localStorage`.

### Derivação de streak/doneToday
- `doneToday` = existe completion para o hábito na data de hoje (local).
- `streak` = nº de dias consecutivos terminando hoje (ou ontem, se hoje ainda não feito) com completion. Calculado a partir do set de datas.

## Mudanças nas telas

- **Tela de Auth** nova: Login + Cadastro (email/senha), mensagens de erro, estado de "confirme seu email". Reset de senha via fluxo do Supabase.
- **Guard** em `App.tsx`: sem sessão → renderiza Auth; com sessão → app atual. Loading enquanto resolve sessão inicial.
- **ImageUpload**: em vez de base64, faz upload ao Storage (`uploadImage`), guarda `storage_path` em `card_images`; preview por signed URL. Remover imagem deleta o objeto no Storage e a linha.
- **CardDrawer / kanban store**: passam a ler `card_images` (caminho + signed URL).
- **Deletar card**: remove também os objetos de Storage das imagens do card.
- **ProfileMenu / SettingsModal**: name/email vêm de `profiles`; salvar grava no banco. Logout = `supabase.auth.signOut()` + limpar stores em memória.
- **Remover seed hardcoded** dos stores; novos usuários começam vazios (ver seed opcional).

## Seed — conta do dono (pré-populada)

- Criar uma **conta-seed do dono**: `hugueninpedro@gmail.com`, já confirmada, com hábitos e quadro Kanban de exemplo (pt-BR, equivalentes aos atuais).
- Script único `supabase/seed.ts` (ou função SQL) que:
  1. Cria o usuário no Auth via **admin API** (service_role key, rodado localmente — nunca no client/CI público), email já confirmado.
  2. Insere `profiles`, `habits`, `columns`, `cards` de exemplo para esse `user_id`.
- **Senha lida de env var** `SEED_OWNER_PASSWORD` (não hardcoded, não commitada). Valor entregue ao dono fora do repo.
- **Sem** histórico de completions fabricado — heatmap começa vazio e preenche com uso real.
- Genérico para outros usuários: novos cadastros começam vazios (sem seed automático). Opção futura de seed-on-empty fica fora de escopo agora.

### Segurança da credencial
- `SEED_OWNER_PASSWORD` mora em `.env.local` (gitignored) ou é passada inline ao rodar o script.
- A `service_role` key usada pelo seed também só em `.env.local`, nunca versionada nem exposta ao frontend.

## Deploy na Vercel

- **Frontend**: projeto Vercel, build `npm run build`, output `dist`.
- `vercel.json` com rewrite SPA: todas as rotas → `/index.html`.
- **Env vars (Vercel)**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Supabase**: adicionar o domínio de produção da Vercel (e previews) às *Redirect URLs* / *Site URL* do Auth.
- **Schema versionado** em `supabase/migrations/*.sql`, aplicável via Supabase CLI (`supabase db push`).
- Docker atual continua válido para dev local do frontend; Supabase local (CLI) é opcional.

## Variáveis de ambiente

| Var | Onde | Conteúdo |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` (dev) + Vercel | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` (dev) + Vercel | anon/public key |

`.env.local` no `.gitignore`. Nenhum segredo de servidor no frontend.

## Testes

- **Isolamento (crítico)**: criar 2 contas, confirmar que A não lê/edita dados de B (RLS).
- **Camada api**: testes das funções de `lib/api` contra um projeto Supabase de teste (ou Supabase local).
- **Fluxos manuais**: signup→confirmação→login; CRUD de hábitos; toggle completion + streak; CRUD/drag de colunas e cards; upload/remoção de imagem; logout.
- **Storage**: usuário não acessa pasta de outro.

## Riscos / cuidados

- **RLS mal configurado = vazamento de dados.** Política e teste de isolamento são obrigatórios antes do deploy.
- **Imagens órfãs**: garantir remoção dos objetos de Storage ao deletar card/imagem (cascade do Postgres não apaga Storage).
- **Rollback otimista**: tratar falhas de rede sem corromper o estado local.
- **Concorrência de `position`** em reordenações simultâneas (baixo risco single-user, aceitável).
- **UX de confirmação de email**: estado claro de "verifique seu email" antes de liberar o app.

## Fases (entrada para o plano de implementação)

1. Projeto Supabase + migrations: schema, RLS, trigger de profile, bucket + políticas de Storage.
2. Client base: `lib/supabase.ts`, `authStore`, telas Login/Cadastro, guard + loading no `App`.
3. Migrar Hábitos: `lib/api/habits`, store sem persist, completions, derivação de streak/doneToday.
4. Migrar Kanban: `lib/api/kanban`, store sem persist, persistência de position no drag, upload/remoção de imagem via Storage.
5. Profile/Settings → banco; logout limpa stores.
6. Seed opcional no primeiro login.
7. Config de deploy Vercel (`vercel.json`, env) + Redirect URLs no Supabase + verificação de isolamento.

## Fora de escopo (YAGNI agora)

- OAuth/social login, magic link.
- Offline-first / resolução de conflitos.
- Compartilhamento entre usuários, times, permissões granulares.
- Realtime (subscriptions) — pode entrar depois.
