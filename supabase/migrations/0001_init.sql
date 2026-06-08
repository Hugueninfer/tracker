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
