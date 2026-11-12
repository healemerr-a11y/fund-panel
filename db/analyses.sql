-- Günlük analiz / kurgu notları (çoklu ekran görüntüsü + metin)
create table if not exists public.analyses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  analysis_date date not null default current_date,
  title         text,
  body          text,
  images        text[] not null default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists analyses_user_date_idx on public.analyses (user_id, analysis_date desc);

alter table public.analyses enable row level security;
drop policy if exists own_rows on public.analyses;
create policy own_rows on public.analyses for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.analyses to authenticated;
