create table if not exists public.presence (
  user_id     text primary key,
  user_name   text not null,
  page        text not null default 'home',
  last_seen   timestamptz not null default now()
);

alter table public.presence enable row level security;
create policy "anon all presence" on public.presence for all using (true) with check (true);
alter publication supabase_realtime add table public.presence;
