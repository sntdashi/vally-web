-- Add media fields to messages table
alter table public.messages 
  add column if not exists media_url text,
  add column if not exists media_type text, -- 'image' | 'video' | 'document'
  add column if not exists media_name text,
  add column if not exists media_size bigint,
  add column if not exists storage_path text;
