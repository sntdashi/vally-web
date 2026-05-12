-- Run in Supabase SQL Editor

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_name   text not null default 'Someone',
  created_at  timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "anon select push_subscriptions" on public.push_subscriptions for select using (true);
create policy "anon insert push_subscriptions" on public.push_subscriptions for insert with check (true);
create policy "anon update push_subscriptions" on public.push_subscriptions for update using (true);
create policy "anon delete push_subscriptions" on public.push_subscriptions for delete using (true);
