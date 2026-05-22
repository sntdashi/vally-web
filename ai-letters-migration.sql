create table if not exists public.love_letters (
  id          uuid primary key default gen_random_uuid(),
  prompt      text not null,
  letter      text not null,
  author      text not null default 'You',
  created_at  timestamptz not null default now()
);

alter table public.love_letters enable row level security;
create policy "anon all love_letters" on public.love_letters for all using (true) with check (true);
alter publication supabase_realtime add table public.love_letters;
