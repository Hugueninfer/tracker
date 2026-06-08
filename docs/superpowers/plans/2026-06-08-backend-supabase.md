# Backend Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace localStorage with a real Supabase backend giving per-user authenticated data (habits, kanban, images), deployable as a static Vite SPA on Vercel.

**Architecture:** Vite SPA talks directly to Supabase (Auth + Postgres + Storage) via `@supabase/supabase-js` with the public anon key. Row Level Security (RLS) is the security boundary — every row is scoped to `auth.uid()`. Zustand stores become in-memory caches with optimistic write-through to a thin `lib/api` layer.

**Tech Stack:** React + Vite + TypeScript, Zustand, @supabase/supabase-js, Supabase (Postgres/Auth/Storage), Vitest (unit tests), Vercel (hosting).

Spec: `docs/superpowers/specs/2026-06-08-backend-supabase-design.md`

---

## File Structure

**Create:**
- `supabase/migrations/0001_init.sql` — schema, RLS, profile trigger, storage policies
- `supabase/seed.ts` — owner-account seed (admin API, local only)
- `src/lib/supabase.ts` — Supabase client singleton
- `src/lib/db-types.ts` — DB row types
- `src/lib/streak.ts` — pure streak/doneToday derivation (unit-tested)
- `src/lib/streak.test.ts`
- `src/lib/api/habits.ts`, `src/lib/api/kanban.ts`, `src/lib/api/profile.ts`
- `src/store/authStore.ts`
- `src/views/Auth.tsx` — login/signup screen
- `.env.local`, `.env.example`
- `vercel.json`
- `vitest.config.ts`

**Modify:**
- `src/store/habitStore.ts`, `src/store/kanbanStore.ts`, `src/store/profileStore.ts` — drop `persist`, load/write via api
- `src/App.tsx` — auth guard + initial load
- `src/components/ImageUpload.tsx`, `src/components/CardDrawer.tsx`, `src/components/KanbanCard.tsx` — Storage-backed images (signed URLs)
- `src/components/ProfileMenu.tsx`, `src/components/SettingsModal.tsx` — logout via Supabase
- `package.json` — add deps + test script
- `.gitignore`

---

## Task 0: Git init + env scaffolding + deps

**Files:**
- Create: `.env.example`, `.env.local`, `vercel.json`
- Modify: `package.json`, `.gitignore`

- [ ] **Step 1: Initialize git (repo currently not under git)**

```bash
cd "c:/Users/Admin/Documents/tracker"
git init
git add -A
git commit -m "chore: snapshot before backend integration"
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js
npm install -D vitest @vitest/ui jsdom
```

- [ ] **Step 3: Add test script to package.json**

In `package.json` `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create `.env.example`**

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Local-only, used by supabase/seed.ts — NEVER commit real values
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SEED_OWNER_EMAIL=hugueninpedro@gmail.com
SEED_OWNER_PASSWORD=set-strong-password-here
```

- [ ] **Step 5: Create `.env.local`** (fill with real values from the Supabase dashboard; this file is gitignored)

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SEED_OWNER_EMAIL=hugueninpedro@gmail.com
SEED_OWNER_PASSWORD=nxUcidd*SQYom2K!Tif4&x_y
```

- [ ] **Step 6: Ensure `.gitignore` covers env + node**

Confirm `.gitignore` contains (append if missing):

```
node_modules
dist
*.log
.env.local
.env*.local
```

- [ ] **Step 7: Create `vercel.json` (SPA rewrite + build)**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json .env.example vercel.json .gitignore
git commit -m "chore: add supabase + vitest deps, env scaffolding, vercel config"
```

---

## Task 1: Supabase project + schema migration (SQL)

> Manual prerequisite: create a Supabase project at supabase.com, copy URL + anon key + service_role key into `.env.local`.

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/0001_init.sql`:

```sql
-- ============ tables ============
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  title text not null,
  meta text not null default '',
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

create table if not exists columns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  column_id uuid not null references columns(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  notes text not null default '',
  due_date date,
  labels jsonb not null default '[]'::jsonb,
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists card_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  storage_path text not null,
  name text not null,
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

-- ============ indexes ============
create index if not exists idx_habits_user_pos on habits(user_id, position);
create index if not exists idx_completions_user_date on habit_completions(user_id, date);
create index if not exists idx_columns_user_pos on columns(user_id, position);
create index if not exists idx_cards_col_pos on cards(column_id, position);
create index if not exists idx_card_images_card_pos on card_images(card_id, position);

-- ============ profile auto-create trigger ============
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, coalesce(new.email, ''), split_part(coalesce(new.email, ''), '@', 1));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============ RLS ============
alter table profiles enable row level security;
alter table habits enable row level security;
alter table habit_completions enable row level security;
alter table columns enable row level security;
alter table cards enable row level security;
alter table card_images enable row level security;

create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own habits" on habits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own completions" on habit_completions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own columns" on columns
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own cards" on cards
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own card_images" on card_images
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ storage bucket + policies ============
insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', false)
on conflict (id) do nothing;

-- objects live under {user_id}/... ; first path segment must equal auth.uid()
create policy "own files read" on storage.objects
  for select using (bucket_id = 'card-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files insert" on storage.objects
  for insert with check (bucket_id = 'card-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects
  for delete using (bucket_id = 'card-images' and (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 2: Apply the migration**

Run in the Supabase dashboard SQL editor (paste the file contents) **or** via CLI:

```bash
npx supabase link --project-ref <your-ref>
npx supabase db push
```

Expected: all tables created, RLS enabled, bucket `card-images` present (check Dashboard → Database/Storage).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "feat(db): initial schema, RLS, profile trigger, storage bucket"
```

---

## Task 2: Supabase client + DB types

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/db-types.ts`

- [ ] **Step 1: Create the client**

`src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anon) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
})
```

- [ ] **Step 2: Create DB row types**

`src/lib/db-types.ts`:

```ts
import type { LabelTint } from './types'

export interface DBHabit {
  id: string
  user_id: string
  emoji: string
  title: string
  meta: string
  position: number
  created_at: string
}

export interface DBCompletion {
  id: string
  user_id: string
  habit_id: string
  date: string // yyyy-mm-dd
}

export interface DBColumn {
  id: string
  user_id: string
  title: string
  position: number
}

export interface DBLabel {
  id: string
  name: string
  tint: LabelTint
}

export interface DBCard {
  id: string
  user_id: string
  column_id: string
  title: string
  description: string
  notes: string
  due_date: string | null
  labels: DBLabel[]
  position: number
}

export interface DBCardImage {
  id: string
  user_id: string
  card_id: string
  storage_path: string
  name: string
  position: number
}

export interface DBProfile {
  id: string
  name: string
  email: string
}
```

- [ ] **Step 3: Add env typing**

Create `src/vite-env.d.ts` if absent, with:

```ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc -b`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts src/lib/db-types.ts src/vite-env.d.ts
git commit -m "feat: supabase client and db types"
```

---

## Task 3: Streak derivation util (TDD)

**Files:**
- Create: `src/lib/streak.ts`, `src/lib/streak.test.ts`, `vitest.config.ts`

- [ ] **Step 1: Create vitest config**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
})
```

- [ ] **Step 2: Write the failing test**

`src/lib/streak.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeStreak, isDoneToday } from './streak'

const iso = (d: Date) => d.toISOString().slice(0, 10)
function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return iso(d)
}

describe('isDoneToday', () => {
  it('true when today present', () => {
    expect(isDoneToday([daysAgo(0)])).toBe(true)
  })
  it('false when today absent', () => {
    expect(isDoneToday([daysAgo(1)])).toBe(false)
  })
})

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(computeStreak([daysAgo(0), daysAgo(1), daysAgo(2)])).toBe(3)
  })
  it('counts streak ending yesterday when today not done', () => {
    expect(computeStreak([daysAgo(1), daysAgo(2)])).toBe(2)
  })
  it('breaks on a gap', () => {
    expect(computeStreak([daysAgo(0), daysAgo(2), daysAgo(3)])).toBe(1)
  })
  it('zero for empty', () => {
    expect(computeStreak([])).toBe(0)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `./streak`.

- [ ] **Step 4: Implement**

`src/lib/streak.ts`:

```ts
// Pure helpers deriving doneToday / streak from completion dates (yyyy-mm-dd).
function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function isDoneToday(dates: string[]): boolean {
  return dates.includes(iso(new Date()))
}

export function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const set = new Set(dates)
  const today = new Date()
  // start from today if done, else yesterday
  const cursor = new Date(today)
  if (!set.has(iso(today))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (set.has(iso(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/streak.ts src/lib/streak.test.ts vitest.config.ts
git commit -m "feat: streak/doneToday derivation with tests"
```

---

## Task 4: Auth store

**Files:**
- Create: `src/store/authStore.ts`

- [ ] **Step 1: Implement authStore**

`src/store/authStore.ts`:

```ts
import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  init: () => void
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, user: data.session?.user ?? null, loading: false })
    })
    supabase.auth.onAuthStateChange((_e, session) => {
      set({ session, user: session?.user ?? null, loading: false })
    })
  },
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  },
  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message }
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },
}))
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc -b`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/store/authStore.ts
git commit -m "feat: auth store (session, signIn/signUp/signOut)"
```

---

## Task 5: Auth screen + App guard

**Files:**
- Create: `src/views/Auth.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Build the Auth screen**

`src/views/Auth.tsx`:

```tsx
import { useState } from 'react'
import { Mail, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/Button'

export function Auth() {
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const fn = mode === 'login' ? signIn : signUp
    const { error } = await fn(email.trim(), password)
    setBusy(false)
    if (error) { setMsg(error); return }
    if (mode === 'signup') setMsg('Conta criada! Verifique seu email para confirmar.')
  }

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-card shadow-card p-7">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🌱</span>
          <span className="text-lg font-extrabold">Tracker</span>
        </div>
        <h1 className="text-pageTitle font-extrabold mb-1">
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </h1>
        <p className="text-meta text-muted mb-5">
          {mode === 'login' ? 'Acesse seus hábitos e quadros.' : 'Comece a organizar sua rotina.'}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-cardAlt rounded-pill px-4 h-11">
            <Mail size={16} className="text-muted" />
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-transparent outline-none text-item w-full placeholder:text-muted"
            />
          </div>
          <div className="flex items-center gap-2 bg-cardAlt rounded-pill px-4 h-11">
            <Lock size={16} className="text-muted" />
            <input
              type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="bg-transparent outline-none text-item w-full placeholder:text-muted"
            />
          </div>
          <Button type="submit" className="w-full mt-1" disabled={busy}>
            {busy ? '...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </Button>
        </form>

        {msg && <p className="text-meta text-muted mt-3">{msg}</p>}

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(null) }}
          className="text-meta text-accent font-semibold mt-4"
        >
          {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
```

> Note: `Button` must accept `disabled` and `type`. It already spreads `...rest` onto the native button, so `type` and `disabled` pass through — no change needed.

- [ ] **Step 2: Wire auth init in main.tsx**

In `src/main.tsx`, call auth init before render. Replace the render block:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useAuthStore } from './store/authStore'

useAuthStore.getState().init()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Add guard to App.tsx**

In `src/App.tsx`, import auth + Auth view and gate rendering. Replace the component body:

```tsx
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { HabitTracker } from '@/views/HabitTracker'
import { Kanban } from '@/views/Kanban'
import { Auth } from '@/views/Auth'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'

export default function App() {
  const view = useUIStore((s) => s.view)
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)

  if (loading) {
    return <div className="h-full flex items-center justify-center text-muted">Carregando…</div>
  }
  if (!session) {
    return (
      <div className="h-full p-2 sm:p-4">
        <div className="h-full rounded-outer bg-page shadow-card overflow-hidden">
          <Auth />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-2 sm:p-4">
      <div className="h-full rounded-outer bg-page shadow-card flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-auto px-3 sm:px-6 pb-6">
            {view === 'habits' ? <HabitTracker /> : <Kanban />}
          </main>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Manual verify**

Run: `npm run dev`. With no session you should see the Auth screen. Sign up with a throwaway email → "verifique seu email" message. (Data loading wired in later tasks.)

- [ ] **Step 5: Commit**

```bash
git add src/views/Auth.tsx src/App.tsx src/main.tsx
git commit -m "feat: auth screen and app session guard"
```

---

## Task 6: Habits API + store migration

**Files:**
- Create: `src/lib/api/habits.ts`
- Modify: `src/store/habitStore.ts`, `src/views/HabitTracker.tsx`, `src/components/HabitCard.tsx`, `src/components/HabitHeatmap.tsx`

- [ ] **Step 1: Create habits API**

`src/lib/api/habits.ts`:

```ts
import { supabase } from '@/lib/supabase'
import type { DBHabit, DBCompletion } from '@/lib/db-types'

export async function listHabits(): Promise<DBHabit[]> {
  const { data, error } = await supabase.from('habits').select('*').order('position')
  if (error) throw error
  return data ?? []
}

export async function listCompletions(): Promise<DBCompletion[]> {
  const { data, error } = await supabase.from('habit_completions').select('*')
  if (error) throw error
  return data ?? []
}

export async function insertHabit(
  userId: string,
  h: { emoji: string; title: string; meta: string; position: number }
): Promise<DBHabit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({ ...h, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) throw error
}

export async function addCompletion(userId: string, habitId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('habit_completions')
    .insert({ user_id: userId, habit_id: habitId, date })
  if (error) throw error
}

export async function removeCompletion(habitId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('habit_completions')
    .delete()
    .eq('habit_id', habitId)
    .eq('date', date)
  if (error) throw error
}
```

- [ ] **Step 2: Rewrite habitStore (no persist, server-backed, optimistic)**

Replace the entire `src/store/habitStore.ts` with:

```ts
import { create } from 'zustand'
import type { Habit } from '@/lib/types'
import { todayISO, uid } from '@/lib/utils'
import { computeStreak, isDoneToday } from '@/lib/streak'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/lib/api/habits'

interface HabitState {
  habits: Habit[]
  selectedDate: string
  loaded: boolean
  load: () => Promise<void>
  addHabit: (h: { emoji: string; title: string; meta: string }) => Promise<void>
  toggleHabit: (id: string) => Promise<void>
  removeHabit: (id: string) => Promise<void>
  setSelectedDate: (iso: string) => void
  reset: () => void
}

function build(dbHabits: { id: string; emoji: string; title: string; meta: string; position: number }[],
  completionsByHabit: Map<string, string[]>): Habit[] {
  return dbHabits.map((h) => {
    const dates = completionsByHabit.get(h.id) ?? []
    return {
      id: h.id,
      emoji: h.emoji,
      title: h.title,
      meta: h.meta,
      completedDates: dates,
      doneToday: isDoneToday(dates),
      streak: computeStreak(dates),
    }
  })
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  selectedDate: todayISO(),
  loaded: false,
  load: async () => {
    const [dbHabits, completions] = await Promise.all([api.listHabits(), api.listCompletions()])
    const map = new Map<string, string[]>()
    for (const c of completions) {
      const arr = map.get(c.habit_id) ?? []
      arr.push(c.date)
      map.set(c.habit_id, arr)
    }
    set({ habits: build(dbHabits, map), loaded: true })
  },
  addHabit: async (h) => {
    const userId = useAuthStore.getState().user!.id
    const position = get().habits.length
    const optimistic: Habit = {
      id: uid(), emoji: h.emoji, title: h.title, meta: h.meta,
      completedDates: [], doneToday: false, streak: 0,
    }
    set((s) => ({ habits: [...s.habits, optimistic] }))
    try {
      const row = await api.insertHabit(userId, { ...h, position })
      set((s) => ({ habits: s.habits.map((x) => (x.id === optimistic.id ? { ...x, id: row.id } : x)) }))
    } catch {
      set((s) => ({ habits: s.habits.filter((x) => x.id !== optimistic.id) }))
    }
  },
  toggleHabit: async (id) => {
    const userId = useAuthStore.getState().user!.id
    const t = todayISO()
    const prev = get().habits
    set((s) => ({
      habits: s.habits.map((h) => {
        if (h.id !== id) return h
        const now = !h.doneToday
        const dates = now
          ? Array.from(new Set([...h.completedDates, t]))
          : h.completedDates.filter((d) => d !== t)
        return { ...h, completedDates: dates, doneToday: now, streak: computeStreak(dates) }
      }),
    }))
    try {
      const wasDone = prev.find((h) => h.id === id)?.doneToday
      if (wasDone) await api.removeCompletion(id, t)
      else await api.addCompletion(userId, id, t)
    } catch {
      set({ habits: prev })
    }
  },
  removeHabit: async (id) => {
    const prev = get().habits
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }))
    try { await api.deleteHabit(id) } catch { set({ habits: prev }) }
  },
  setSelectedDate: (iso) => set({ selectedDate: iso }),
  reset: () => set({ habits: [], loaded: false }),
}))
```

> Note on optimistic toggle: this temporarily allows the UI to act before the DB confirms. The `prev` snapshot restores state on failure.

- [ ] **Step 3: Update HabitTracker add-habit call**

In `src/views/HabitTracker.tsx`, the `submit` function currently calls `addHabit({ emoji, title, meta })`. `addHabit` is now async — keep the call as-is (fire-and-forget is fine) but remove the `'A qualquer hora'` default only if desired. No signature change needed; `addHabit` already takes `{emoji,title,meta}`. Confirm it compiles.

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b`
Expected: exit 0. (HabitCard/HabitHeatmap read `habit.completedDates/doneToday/streak` which still exist — no change needed.)

- [ ] **Step 5: Trigger load on login**

This is wired centrally in Task 8 Step (App data bootstrap). For now, add a temporary effect: in `src/views/HabitTracker.tsx`, at top of component:

```tsx
import { useEffect } from 'react'
// ...
const load = useHabitStore((s) => s.load)
const loaded = useHabitStore((s) => s.loaded)
useEffect(() => { if (!loaded) load() }, [loaded, load])
```

- [ ] **Step 6: Manual verify**

Run `npm run dev`, log in, add a habit, toggle it, reload page → habit + completion persist. Open another browser/incognito with a second account → does NOT see the first account's habits.

- [ ] **Step 7: Commit**

```bash
git add src/lib/api/habits.ts src/store/habitStore.ts src/views/HabitTracker.tsx
git commit -m "feat: habits backed by supabase with optimistic updates"
```

---

## Task 7: Profile API + store + logout

**Files:**
- Create: `src/lib/api/profile.ts`
- Modify: `src/store/profileStore.ts`, `src/components/ProfileMenu.tsx`, `src/components/SettingsModal.tsx`

- [ ] **Step 1: Create profile API**

`src/lib/api/profile.ts`:

```ts
import { supabase } from '@/lib/supabase'
import type { DBProfile } from '@/lib/db-types'

export async function getProfile(): Promise<DBProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').single()
  if (error) return null
  return data
}

export async function updateProfile(patch: Partial<Pick<DBProfile, 'name' | 'email'>>): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', (await supabase.auth.getUser()).data.user!.id)
  if (error) throw error
}
```

- [ ] **Step 2: Rewrite profileStore (no persist, server-backed)**

Replace `src/store/profileStore.ts` with:

```ts
import { create } from 'zustand'
import * as api from '@/lib/api/profile'
import { useAuthStore } from '@/store/authStore'

interface ProfileState {
  name: string
  email: string
  load: () => Promise<void>
  setName: (n: string) => void
  setEmail: (e: string) => void
  save: () => Promise<void>
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  name: '',
  email: '',
  load: async () => {
    const p = await api.getProfile()
    if (p) set({ name: p.name, email: p.email })
  },
  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
  save: async () => {
    await api.updateProfile({ name: get().name, email: get().email })
  },
}))

export async function logout() {
  await useAuthStore.getState().signOut()
  location.reload()
}
```

- [ ] **Step 3: Update SettingsModal to save on change**

In `src/components/SettingsModal.tsx`, the inputs call `setName`/`setEmail` from `useProfileStore`. Add a `save` call on blur. Change the name/email inputs to include `onBlur={() => save()}`:

Get `save` from the store:

```tsx
const { name, email, setName, setEmail, save } = useProfileStore()
```

Add `onBlur={() => save()}` to both the name and email `<input>` elements. The "Apagar dados e sair" button calls `logout()` (already imported from profileStore) — keep.

- [ ] **Step 4: ProfileMenu logout already uses `logout` from profileStore** — no change beyond confirming the import still resolves (it does; `logout` is still exported).

- [ ] **Step 5: Load profile on login** — wired centrally in Task 8 bootstrap. Add temporary effect in `ProfileMenu.tsx`:

```tsx
import { useEffect } from 'react'
// inside component:
const load = useProfileStore((s) => s.load)
useEffect(() => { load() }, [load])
```

- [ ] **Step 6: Typecheck + manual verify**

Run `npx tsc -b` (expect 0). In the app, open Configurações, change name → blur → reload → name persists.

- [ ] **Step 7: Commit**

```bash
git add src/lib/api/profile.ts src/store/profileStore.ts src/components/SettingsModal.tsx src/components/ProfileMenu.tsx
git commit -m "feat: profile backed by supabase + logout via auth"
```

---

## Task 8: Kanban API + store migration + central data bootstrap

**Files:**
- Create: `src/lib/api/kanban.ts`
- Modify: `src/store/kanbanStore.ts`, `src/App.tsx`

- [ ] **Step 1: Create kanban API (columns + cards, no images yet)**

`src/lib/api/kanban.ts`:

```ts
import { supabase } from '@/lib/supabase'
import type { DBColumn, DBCard } from '@/lib/db-types'

export async function listColumns(): Promise<DBColumn[]> {
  const { data, error } = await supabase.from('columns').select('*').order('position')
  if (error) throw error
  return data ?? []
}
export async function listCards(): Promise<DBCard[]> {
  const { data, error } = await supabase.from('cards').select('*').order('position')
  if (error) throw error
  return data ?? []
}
export async function insertColumn(userId: string, title: string, position: number): Promise<DBColumn> {
  const { data, error } = await supabase.from('columns')
    .insert({ user_id: userId, title, position }).select().single()
  if (error) throw error
  return data
}
export async function updateColumn(id: string, patch: Partial<DBColumn>): Promise<void> {
  const { error } = await supabase.from('columns').update(patch).eq('id', id)
  if (error) throw error
}
export async function deleteColumn(id: string): Promise<void> {
  const { error } = await supabase.from('columns').delete().eq('id', id)
  if (error) throw error
}
export async function insertCard(userId: string, columnId: string, title: string, position: number): Promise<DBCard> {
  const { data, error } = await supabase.from('cards')
    .insert({ user_id: userId, column_id: columnId, title, position }).select().single()
  if (error) throw error
  return data
}
export async function updateCard(id: string, patch: Partial<DBCard>): Promise<void> {
  const { error } = await supabase.from('cards').update(patch).eq('id', id)
  if (error) throw error
}
export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from('cards').delete().eq('id', id)
  if (error) throw error
}
export async function setCardColumnAndPosition(id: string, columnId: string, position: number): Promise<void> {
  const { error } = await supabase.from('cards').update({ column_id: columnId, position }).eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 2: Rewrite kanbanStore to load from + write to API**

Replace `src/store/kanbanStore.ts`. Keep the existing public method names used by components (`addColumn, renameColumn, removeColumn, setColumns, addCard, updateCard, removeCard, moveCard, addImage, removeImage, addLabel, removeLabel, openCard`). Implementation:

```ts
import { create } from 'zustand'
import type { Column, KanbanCard, CardImage, Label, DBLabel } from '@/lib/types'
import { uid } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/lib/api/kanban'

interface KanbanState {
  columns: Column[]
  cards: Record<string, KanbanCard>
  openCardId: string | null
  loaded: boolean
  load: () => Promise<void>
  reset: () => void
  addColumn: (title: string) => Promise<void>
  renameColumn: (id: string, title: string) => Promise<void>
  removeColumn: (id: string) => Promise<void>
  setColumns: (cols: Column[]) => void
  persistColumnOrder: (cols: Column[]) => Promise<void>
  addCard: (columnId: string, title: string) => Promise<void>
  updateCard: (id: string, patch: Partial<KanbanCard>) => void
  removeCard: (id: string) => Promise<void>
  addImage: (cardId: string, img: CardImage) => void
  removeImage: (cardId: string, imgId: string) => void
  addLabel: (cardId: string, label: Label) => void
  removeLabel: (cardId: string, labelId: string) => void
  moveCard: (cardId: string, fromCol: string, toCol: string, toIndex: number) => Promise<void>
  openCard: (id: string | null) => void
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  columns: [],
  cards: {},
  openCardId: null,
  loaded: false,

  load: async () => {
    const [cols, cards] = await Promise.all([api.listColumns(), api.listCards()])
    const cardMap: Record<string, KanbanCard> = {}
    for (const c of cards) {
      cardMap[c.id] = {
        id: c.id, title: c.title, description: c.description, notes: c.notes,
        images: [], labels: (c.labels as DBLabel[]) ?? [],
        dueDate: c.due_date ?? undefined,
      }
    }
    const columns: Column[] = cols.map((col) => ({
      id: col.id, title: col.title,
      cardIds: cards.filter((c) => c.column_id === col.id).map((c) => c.id),
    }))
    set({ columns, cards: cardMap, loaded: true })
  },
  reset: () => set({ columns: [], cards: {}, loaded: false, openCardId: null }),

  addColumn: async (title) => {
    const userId = useAuthStore.getState().user!.id
    const position = get().columns.length
    const row = await api.insertColumn(userId, title, position)
    set((s) => ({ columns: [...s.columns, { id: row.id, title, cardIds: [] }] }))
  },
  renameColumn: async (id, title) => {
    set((s) => ({ columns: s.columns.map((c) => (c.id === id ? { ...c, title } : c)) }))
    await api.updateColumn(id, { title })
  },
  removeColumn: async (id) => {
    const prev = get()
    const col = prev.columns.find((c) => c.id === id)
    const cards = { ...prev.cards }
    col?.cardIds.forEach((cid) => delete cards[cid])
    set({ columns: prev.columns.filter((c) => c.id !== id), cards })
    try { await api.deleteColumn(id) } catch { set({ columns: prev.columns, cards: prev.cards }) }
  },
  setColumns: (columns) => set({ columns }),
  persistColumnOrder: async (cols) => {
    set({ columns: cols })
    await Promise.all(cols.map((c, i) => api.updateColumn(c.id, { position: i })))
  },

  addCard: async (columnId, title) => {
    const userId = useAuthStore.getState().user!.id
    const col = get().columns.find((c) => c.id === columnId)
    const position = col ? col.cardIds.length : 0
    const row = await api.insertCard(userId, columnId, title, position)
    const card: KanbanCard = { id: row.id, title, description: '', notes: '', images: [], labels: [] }
    set((s) => ({
      cards: { ...s.cards, [card.id]: card },
      columns: s.columns.map((c) => (c.id === columnId ? { ...c, cardIds: [...c.cardIds, card.id] } : c)),
      openCardId: card.id,
    }))
  },
  updateCard: (id, patch) => {
    set((s) => ({ cards: { ...s.cards, [id]: { ...s.cards[id], ...patch } } }))
    const dbPatch: Partial<import('@/lib/db-types').DBCard> = {}
    if ('title' in patch) dbPatch.title = patch.title
    if ('description' in patch) dbPatch.description = patch.description
    if ('notes' in patch) dbPatch.notes = patch.notes
    if ('labels' in patch) dbPatch.labels = patch.labels
    if ('dueDate' in patch) dbPatch.due_date = patch.dueDate ?? null
    if (Object.keys(dbPatch).length) void api.updateCard(id, dbPatch)
  },
  removeCard: async (id) => {
    const prev = get()
    const cards = { ...prev.cards }; delete cards[id]
    set({
      cards,
      columns: prev.columns.map((c) => ({ ...c, cardIds: c.cardIds.filter((x) => x !== id) })),
      openCardId: prev.openCardId === id ? null : prev.openCardId,
    })
    try { await api.deleteCard(id) } catch { set({ cards: prev.cards, columns: prev.columns }) }
  },

  addImage: (cardId, img) =>
    set((s) => ({ cards: { ...s.cards, [cardId]: { ...s.cards[cardId], images: [...s.cards[cardId].images, img] } } })),
  removeImage: (cardId, imgId) =>
    set((s) => ({ cards: { ...s.cards, [cardId]: { ...s.cards[cardId], images: s.cards[cardId].images.filter((i) => i.id !== imgId) } } })),
  addLabel: (cardId, label) => {
    set((s) => ({ cards: { ...s.cards, [cardId]: { ...s.cards[cardId], labels: [...s.cards[cardId].labels, label] } } }))
    void api.updateCard(cardId, { labels: get().cards[cardId].labels })
  },
  removeLabel: (cardId, labelId) => {
    set((s) => ({ cards: { ...s.cards, [cardId]: { ...s.cards[cardId], labels: s.cards[cardId].labels.filter((l) => l.id !== labelId) } } }))
    void api.updateCard(cardId, { labels: get().cards[cardId].labels })
  },

  moveCard: async (cardId, _fromCol, toCol, toIndex) => {
    set((s) => {
      const columns = s.columns.map((c) => ({ ...c, cardIds: [...c.cardIds] }))
      for (const c of columns) {
        const i = c.cardIds.indexOf(cardId)
        if (i !== -1) c.cardIds.splice(i, 1)
      }
      const target = columns.find((c) => c.id === toCol)
      if (target) target.cardIds.splice(Math.min(toIndex, target.cardIds.length), 0, cardId)
      return { columns }
    })
    const target = get().columns.find((c) => c.id === toCol)
    const newIndex = target ? target.cardIds.indexOf(cardId) : toIndex
    await api.setCardColumnAndPosition(cardId, toCol, newIndex)
  },

  openCard: (id) => set({ openCardId: id }),
}))
```

> `DBLabel` is re-exported from types in Task 8 Step 3. `Label`/`LabelTint` already live in `src/lib/types.ts`.

- [ ] **Step 3: Re-export DBLabel type alias**

In `src/lib/types.ts`, add at the end:

```ts
// alias used by the kanban store when reading jsonb labels
export type { Label as DBLabel } from './types'
```

If the self-import alias errors, instead add a plain alias line:

```ts
export type DBLabel = Label
```

(Use the plain alias form.)

- [ ] **Step 4: Update Kanban.tsx column reorder + same-column move to persist**

In `src/views/Kanban.tsx` `handleDragEnd`, the column-reorder branch currently calls `setColumns(arrayMove(...))`. Replace that call with `persistColumnOrder(arrayMove(columns, oldI, newI))`. Get it from the store:

```tsx
const persistColumnOrder = useKanbanStore((s) => s.persistColumnOrder)
```

For the same-column card reorder branch (which currently calls `setColumns(...)`), after computing the new array also persist positions. Replace that branch's `setColumns(...)` with:

```tsx
const reordered = columns.map((c) =>
  c.id === toCol ? { ...c, cardIds: arrayMove(c.cardIds, oldI, newI) } : c
)
setColumns(reordered)
const tgt = reordered.find((c) => c.id === toCol)!
void Promise.all(tgt.cardIds.map((cid, i) => import('@/lib/api/kanban').then((m) => m.updateCard(cid, { position: i }))))
```

> Simpler alternative if the dynamic import reads awkwardly: import `* as kanbanApi from '@/lib/api/kanban'` at top of `Kanban.tsx` and call `kanbanApi.updateCard`.

- [ ] **Step 5: Central data bootstrap in App.tsx**

In `src/App.tsx`, after the session guard (when session exists), load all stores once. Add:

```tsx
import { useEffect } from 'react'
import { useHabitStore } from '@/store/habitStore'
import { useKanbanStore } from '@/store/kanbanStore'
import { useProfileStore } from '@/store/profileStore'
```

Inside the component, before the `return`:

```tsx
const loadHabits = useHabitStore((s) => s.load)
const loadKanban = useKanbanStore((s) => s.load)
const loadProfile = useProfileStore((s) => s.load)
useEffect(() => {
  if (session) { loadHabits(); loadKanban(); loadProfile() }
}, [session, loadHabits, loadKanban, loadProfile])
```

Then REMOVE the temporary load effects added in Task 6 Step 5 (HabitTracker) and Task 7 Step 5 (ProfileMenu).

- [ ] **Step 6: Typecheck + manual verify**

Run `npx tsc -b` (expect 0). In the app: create column, add card, edit card title/description (reload persists), drag card across columns (reload keeps new column/order), reorder columns (persists).

- [ ] **Step 7: Commit**

```bash
git add src/lib/api/kanban.ts src/store/kanbanStore.ts src/lib/types.ts src/views/Kanban.tsx src/App.tsx src/views/HabitTracker.tsx src/components/ProfileMenu.tsx
git commit -m "feat: kanban backed by supabase + central data bootstrap"
```

---

## Task 9: Storage-backed card images

**Files:**
- Modify: `src/lib/api/kanban.ts`, `src/store/kanbanStore.ts`, `src/components/ImageUpload.tsx`, `src/components/CardDrawer.tsx`, `src/components/KanbanCard.tsx`

- [ ] **Step 1: Add image API functions**

Add `DBCardImage` to the existing import at the **top** of `src/lib/api/kanban.ts`:

```ts
import type { DBColumn, DBCard, DBCardImage } from '@/lib/db-types'
```

Then append these functions to the file:

```ts
export async function listCardImages(): Promise<DBCardImage[]> {
  const { data, error } = await supabase.from('card_images').select('*').order('position')
  if (error) throw error
  return data ?? []
}
export async function uploadCardImage(
  userId: string, cardId: string, file: File
): Promise<DBCardImage> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `${userId}/${cardId}/${crypto.randomUUID()}.${ext}`
  const up = await supabase.storage.from('card-images').upload(path, file)
  if (up.error) throw up.error
  const { data, error } = await supabase.from('card_images')
    .insert({ user_id: userId, card_id: cardId, storage_path: path, name: file.name, position: 0 })
    .select().single()
  if (error) throw error
  return data
}
export async function deleteCardImage(img: { id: string; storage_path: string }): Promise<void> {
  await supabase.storage.from('card-images').remove([img.storage_path])
  const { error } = await supabase.from('card_images').delete().eq('id', img.id)
  if (error) throw error
}
export async function signedImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('card-images').createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}
export async function deleteCardImagesByCard(cardId: string): Promise<void> {
  const { data } = await supabase.from('card_images').select('storage_path').eq('card_id', cardId)
  const paths = (data ?? []).map((r) => r.storage_path)
  if (paths.length) await supabase.storage.from('card-images').remove(paths)
}
```

- [ ] **Step 2: Extend CardImage type with storagePath**

In `src/lib/types.ts`, update `CardImage`:

```ts
export interface CardImage {
  id: string
  storagePath: string
  dataUrl: string // signed URL for display
  name: string
}
```

- [ ] **Step 3: Load images into kanban store**

In `kanbanStore.load`, after building cards, fetch + attach images with signed URLs. Add to the `load` function (after `cardMap` is built, before `set(...)`):

```ts
const imgs = await api.listCardImages()
await Promise.all(imgs.map(async (im) => {
  if (!cardMap[im.card_id]) return
  const url = await api.signedImageUrl(im.storage_path)
  cardMap[im.card_id].images.push({ id: im.id, storagePath: im.storage_path, dataUrl: url, name: im.name })
}))
```

- [ ] **Step 4: Storage-backed image add/remove in store**

Replace `addImage`/`removeImage` in the store with async, Storage-backed versions, and update `removeCard` to clean storage:

```ts
addImage: async (cardId, file: File) => {
  const userId = useAuthStore.getState().user!.id
  const row = await api.uploadCardImage(userId, cardId, file)
  const url = await api.signedImageUrl(row.storage_path)
  set((s) => ({ cards: { ...s.cards, [cardId]: { ...s.cards[cardId],
    images: [...s.cards[cardId].images, { id: row.id, storagePath: row.storage_path, dataUrl: url, name: row.name }] } } }))
},
removeImage: async (cardId, imgId) => {
  const img = get().cards[cardId].images.find((i) => i.id === imgId)
  set((s) => ({ cards: { ...s.cards, [cardId]: { ...s.cards[cardId],
    images: s.cards[cardId].images.filter((i) => i.id !== imgId) } } }))
  if (img) await api.deleteCardImage({ id: img.id, storage_path: img.storagePath })
},
```

Update the `KanbanState` interface signatures accordingly:

```ts
addImage: (cardId: string, file: File) => Promise<void>
removeImage: (cardId: string, imgId: string) => Promise<void>
```

In `removeCard`, before `await api.deleteCard(id)`, add:

```ts
await api.deleteCardImagesByCard(id)
```

- [ ] **Step 5: Update ImageUpload to pass File (not base64)**

In `src/components/ImageUpload.tsx`, change the `onAdd` prop type and the handler. Replace the `Props` interface and `handleFiles`:

```tsx
interface Props {
  images: CardImage[]
  onAdd: (file: File) => void
  onRemove: (id: string) => void
}
```

```tsx
const handleFiles = (files: FileList | null) => {
  if (!files) return
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue
    onAdd(file)
  }
}
```

Remove the now-unused `fileToDataUrl`/`uid` imports from this file (keep `cx`). The preview still uses `img.dataUrl` (now a signed URL) — no change to the render.

- [ ] **Step 6: Update CardDrawer wiring**

In `src/components/CardDrawer.tsx`, the `ImageUpload` usage currently does `onAdd={(img) => addImage(card.id, img)}`. Change to:

```tsx
onAdd={(file) => addImage(card.id, file)}
```

`addImage`/`removeImage` from the store are now async — fire-and-forget is fine.

- [ ] **Step 7: KanbanCard cover image** still reads `card.images[0].dataUrl` (signed URL) — no change needed.

- [ ] **Step 8: Typecheck + manual verify**

Run `npx tsc -b` (expect 0). In the app: open a card, drag-drop an image → preview shows, reload → image persists (signed URL refetched). Delete image → gone from Storage. Delete card with image → no orphan in Storage bucket.

- [ ] **Step 9: Commit**

```bash
git add src/lib/api/kanban.ts src/store/kanbanStore.ts src/components/ImageUpload.tsx src/components/CardDrawer.tsx src/lib/types.ts
git commit -m "feat: card images via supabase storage with signed urls"
```

---

## Task 10: Owner seed script

**Files:**
- Create: `supabase/seed.ts`
- Modify: `package.json` (seed script)

- [ ] **Step 1: Write the seed script**

`supabase/seed.ts` (run with `node --env-file=.env.local --experimental-strip-types supabase/seed.ts`, Node 22+, or via tsx):

```ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const email = process.env.SEED_OWNER_EMAIL!
const password = process.env.SEED_OWNER_PASSWORD!

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function main() {
  // create (or fetch) the owner user, email pre-confirmed
  let userId: string
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (created.error) {
    // already exists -> find by listing
    const list = await admin.auth.admin.listUsers()
    const found = list.data.users.find((u) => u.email === email)
    if (!found) throw created.error
    userId = found.id
  } else {
    userId = created.data.user!.id
  }

  // profile (upsert)
  await admin.from('profiles').upsert({ id: userId, email, name: 'Pedro' })

  // wipe existing seed data for idempotency
  await admin.from('columns').delete().eq('user_id', userId)
  await admin.from('habits').delete().eq('user_id', userId)

  // habits
  const habits = [
    { emoji: '📚', title: 'Estudar', meta: '10:00 · Cafeteria', position: 0 },
    { emoji: '🛒', title: 'Compras', meta: '14:00 · Mercado', position: 1 },
    { emoji: '🥦', title: 'Comer saudável', meta: '08:30 · Casa', position: 2 },
    { emoji: '📖', title: 'Ler um livro', meta: '08:00 · Biblioteca', position: 3 },
    { emoji: '🏊', title: 'Natação 45min', meta: '06:00 · Piscina', position: 4 },
  ].map((h) => ({ ...h, user_id: userId }))
  await admin.from('habits').insert(habits)

  // columns
  const { data: cols } = await admin.from('columns').insert([
    { user_id: userId, title: 'A fazer', position: 0 },
    { user_id: userId, title: 'Em progresso', position: 1 },
    { user_id: userId, title: 'Concluído', position: 2 },
  ]).select()

  const todo = cols!.find((c) => c.title === 'A fazer')!.id
  const doing = cols!.find((c) => c.title === 'Em progresso')!.id
  const done = cols!.find((c) => c.title === 'Concluído')!.id

  await admin.from('cards').insert([
    { user_id: userId, column_id: todo, title: 'Desenhar a tela inicial', position: 0,
      description: '<p>Ajustar o <strong>CTA laranja</strong> e os espaçamentos.</p>',
      labels: [{ id: crypto.randomUUID(), name: 'Design', tint: 'accent' }] },
    { user_id: userId, column_id: todo, title: 'Montar o widget de calendário', position: 1,
      labels: [{ id: crypto.randomUUID(), name: 'Frontend', tint: 'sage' }] },
    { user_id: userId, column_id: doing, title: 'Arrastar e soltar no kanban', position: 0,
      description: '<p>Usar o <code>@dnd-kit</code> sortable.</p>' },
    { user_id: userId, column_id: done, title: 'Lançar a v1 🎉', position: 0 },
  ])

  console.log('Seed done for', email, userId)
}

main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Add seed script to package.json**

```json
"seed": "node --env-file=.env.local --experimental-strip-types supabase/seed.ts"
```

(If Node < 22, install tsx: `npm i -D tsx` and use `"seed": "node --env-file=.env.local node_modules/.bin/tsx supabase/seed.ts"`.)

- [ ] **Step 3: Run the seed**

```bash
npm run seed
```

Expected: `Seed done for hugueninpedro@gmail.com <uuid>`.

- [ ] **Step 4: Verify**

Log in to the app with `hugueninpedro@gmail.com` + the password from `.env.local` → habits + 3 columns + example cards appear.

- [ ] **Step 5: Commit (script only — never the .env.local)**

```bash
git add supabase/seed.ts package.json
git commit -m "feat: owner account seed script (reads creds from env)"
```

---

## Task 11: Vercel deploy + isolation verification

**Files:**
- (uses existing `vercel.json`)

- [ ] **Step 1: Verify production build locally**

```bash
npm run build
```
Expected: build succeeds, `dist/` produced.

- [ ] **Step 2: Push repo to GitHub**

```bash
git remote add origin <your-repo-url>
git push -u origin main
```

- [ ] **Step 3: Import to Vercel**

In Vercel: New Project → import repo. Framework preset Vite (auto). Set env vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Deploy.

- [ ] **Step 4: Configure Supabase Auth URLs**

Supabase Dashboard → Authentication → URL Configuration:
- Site URL: your Vercel production URL
- Redirect URLs: add the Vercel production URL and `https://*.vercel.app` (for previews)

- [ ] **Step 5: Isolation verification (security gate)**

On the deployed app: create account B. Confirm account B sees an empty app (no owner data). Attempt (via devtools console) `await supabase.from('habits').select('*')` while logged as B → returns only B's rows. Repeat for `cards`, `columns`. Confirm B cannot read A's Storage paths.

- [ ] **Step 6: Commit any deploy tweaks**

```bash
git add -A
git commit -m "chore: deploy config finalized"
git push
```

---

## Notes for the implementer

- **Optimistic pattern:** snapshot state, mutate locally, call API, rollback on throw. Used in habits toggle/add/remove, kanban column/card remove.
- **doneToday/streak** are never stored — always derived via `src/lib/streak.ts`.
- **Never commit `.env.local`** or the service_role key.
- **RLS is the only thing protecting data** — Task 11 Step 5 is mandatory before considering this done.
- After all tasks: run `npm test` and `npx tsc -b` (both clean) and `npm run build` (succeeds).
