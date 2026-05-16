create table if not exists public.timeline_events (
  id          uuid primary key default gen_random_uuid(),
  date_label  text not null,
  title       text not null,
  description text not null,
  icon_type   text not null default 'heart',
  image_url   text,
  storage_path text,
  sort_order  bigint not null default extract(epoch from now()),
  created_at  timestamptz not null default now()
);

alter table public.timeline_events enable row level security;
create policy "anon all timeline" on public.timeline_events for all using (true) with check (true);
alter publication supabase_realtime add table public.timeline_events;

-- Seed initial events
insert into public.timeline_events (id, date_label, title, description, icon_type, image_url, sort_order) values
  (gen_random_uuid(), 'June 12, 2023', 'The First Encounter', 'Where it all began. A simple coffee date that changed everything.', 'heart', 'https://picsum.photos/seed/coffee/800/600', 1),
  (gen_random_uuid(), 'August 24, 2023', 'First Trip Together', 'Exploring the mountains and finding our rhythm.', 'mappin', 'https://picsum.photos/seed/mountain/800/600', 2),
  (gen_random_uuid(), 'December 31, 2023', 'New Year''s Promise', 'Under the fireworks, we promised to build a future together.', 'stars', 'https://picsum.photos/seed/fireworks/800/600', 3),
  (gen_random_uuid(), 'Today', 'The Eternal Now', 'Every second with you is a new favorite memory.', 'clock', 'https://picsum.photos/seed/love/800/600', 4)
on conflict do nothing;
