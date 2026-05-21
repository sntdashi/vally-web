-- Add location fields to timeline_events
alter table public.timeline_events 
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists location_name text;

-- Update seed data with real coordinates
update public.timeline_events set lat = -6.8915, lng = 107.6107, location_name = 'Bandung, Indonesia'
  where title = 'The First Encounter';
update public.timeline_events set lat = -6.9175, lng = 107.6191, location_name = 'Lembang, Bandung'
  where title = 'First Trip Together';
update public.timeline_events set lat = -6.2146, lng = 106.8451, location_name = 'Jakarta'
  where title = 'New Year''s Promise';
