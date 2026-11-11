-- Supabase / PostgreSQL şeması. Bakiye, DD ve durum saklanmaz; tradelerden türetilir.

create table accounts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name              text not null,
  firm              text,
  start_balance     numeric(14,2) not null check (start_balance > 0),
  max_dd_pct        numeric(5,2)  not null default 10,
  daily_dd_pct      numeric(5,2)  not null default 5,
  profit_target_pct numeric(5,2),
  status            text not null default 'active' check (status in ('active','passed','failed')),
  created_at        timestamptz not null default now()
);

create table trades (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id     uuid not null references accounts(id) on delete cascade,
  opened_at      timestamptz not null,
  symbol         text not null,
  side           text not null check (side in ('buy','sell')),
  entry_price    numeric(18,5),
  exit_price     numeric(18,5),
  size           numeric(12,2),
  pnl            numeric(14,2) not null,
  pips           numeric(10,1),
  note           text,
  screenshot_url text,  -- Supabase Storage yolu veya harici URL
  created_at     timestamptz not null default now()
);
create index trades_account_time_idx on trades (account_id, opened_at);

create table journal_entries (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id        uuid references accounts(id) on delete cascade,  -- null = genel not
  entry_date        date not null default current_date,
  mood              smallint check (mood between 1 and 5),
  market_conditions text,
  mistakes          text,
  body              text,
  created_at        timestamptz not null default now()
);
create index journal_user_date_idx on journal_entries (user_id, entry_date desc);

-- Row Level Security: her kullanıcı yalnızca kendi satırlarını görür
alter table accounts        enable row level security;
alter table trades          enable row level security;
alter table journal_entries enable row level security;
create policy own_rows on accounts        for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on trades          for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on journal_entries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
