-- Optional file attachments on homework assignments and announcements.
-- Run in Supabase → SQL Editor.

alter table public.assignments add column if not exists file_url text;
alter table public.assignments add column if not exists file_name text;

alter table public.announcements add column if not exists file_url text;
alter table public.announcements add column if not exists file_name text;
