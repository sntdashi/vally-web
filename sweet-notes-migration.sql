-- Run this in Supabase SQL Editor

create table if not exists public.sweet_notes (
  id         uuid primary key default gen_random_uuid(),
  note       text not null,
  author     text not null default 'AI',
  created_at timestamptz not null default now()
);

-- RLS
alter table public.sweet_notes enable row level security;

create policy "anon can select sweet_notes" on public.sweet_notes for select using (true);
create policy "anon can insert sweet_notes" on public.sweet_notes for insert with check (true);
create policy "anon can delete sweet_notes" on public.sweet_notes for delete using (true);

-- Realtime
alter publication supabase_realtime add table public.sweet_notes;
