-- ============ tables ============
create table if not exists payment_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  tint text not null default 'accent',
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  tint text not null default 'sage',
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  name text not null,
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  month text not null,
  name text not null default '',
  category_id uuid references expense_categories(id) on delete set null,
  card_id uuid references payment_cards(id) on delete set null,
  amount numeric(12,2) not null default 0,
  installment_group uuid,
  installment_index int not null default 1,
  installment_count int not null default 1,
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

-- ============ indexes ============
create index if not exists idx_cards_user_pos on payment_cards(user_id, position);
create index if not exists idx_categories_user_pos on expense_categories(user_id, position);
create index if not exists idx_incomes_user_month on incomes(user_id, month);
create index if not exists idx_expenses_user_month on expenses(user_id, month);
create index if not exists idx_expenses_card on expenses(card_id);
create index if not exists idx_expenses_group on expenses(installment_group);

-- ============ RLS ============
alter table payment_cards enable row level security;
alter table expense_categories enable row level security;
alter table incomes enable row level security;
alter table expenses enable row level security;

create policy "own cards" on payment_cards
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own categories" on expense_categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own incomes" on incomes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own expenses" on expenses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
