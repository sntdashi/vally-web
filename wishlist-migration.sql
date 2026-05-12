-- Run this in Supabase SQL Editor

create table if not exists public.wishlist (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  completed   boolean not null default false,
  category    text not null default 'other',
  sort_order  bigint not null default extract(epoch from now()),
  created_at  timestamptz not null default now()
);

alter table public.wishlist enable row level security;

create policy "anon select wishlist" on public.wishlist for select using (true);
create policy "anon insert wishlist" on public.wishlist for insert with check (true);
create policy "anon update wishlist" on public.wishlist for update using (true);
create policy "anon delete wishlist" on public.wishlist for delete using (true);

alter publication supabase_realtime add table public.wishlist;
