-- =============================================
--  VALLY — Supabase Schema
--  Paste this in: Supabase Dashboard → SQL Editor → Run
-- =============================================

-- 1. MEMORIES TABLE
create table if not exists public.memories (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('image', 'video')),
  url           text not null,
  storage_path  text,
  location_lat  double precision,
  location_lng  double precision,
  location_name text,
  start_time    double precision,
  end_time      double precision,
  sort_order    bigint not null default extract(epoch from now()),
  created_at    timestamptz not null default now()
);

-- 2. CONFIG TABLE
create table if not exists public.config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.update_config_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists config_updated_at on public.config;
create trigger config_updated_at
  before update on public.config
  for each row execute function public.update_config_timestamp();

-- 3. STORAGE BUCKET
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

-- 4. ROW LEVEL SECURITY (RLS)
-- Since app uses shared PIN (no user auth), we allow all operations via anon key.
-- This is intentional — the PIN layer protects access at the app level.
alter table public.memories enable row level security;
alter table public.config enable row level security;

-- Allow anon (PIN-protected app) to do everything
create policy "anon can select memories"
  on public.memories for select using (true);

create policy "anon can insert memories"
  on public.memories for insert with check (true);

create policy "anon can update memories"
  on public.memories for update using (true);

create policy "anon can delete memories"
  on public.memories for delete using (true);

create policy "anon can select config"
  on public.config for select using (true);

create policy "anon can upsert config"
  on public.config for insert with check (true);

create policy "anon can update config"
  on public.config for update using (true);

-- Storage policies
create policy "anon can upload memories"
  on storage.objects for insert
  with check (bucket_id = 'memories');

create policy "anon can read memories"
  on storage.objects for select
  using (bucket_id = 'memories');

create policy "anon can delete memories"
  on storage.objects for delete
  using (bucket_id = 'memories');

-- 5. REALTIME (enable for real-time presence)
alter publication supabase_realtime add table public.memories;
alter publication supabase_realtime add table public.config;

-- Done! Your Vally backend is ready 💙
