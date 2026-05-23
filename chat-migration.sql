create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  author      text not null,
  author_id   text not null,
  type        text not null default 'text',
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;
create policy "anon all messages" on public.messages for all using (true) with check (true);
alter publication supabase_realtime add table public.messages;
