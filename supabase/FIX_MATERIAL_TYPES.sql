-- Run in Supabase SQL Editor to support documents + video/audio uploads.

alter table public.documents
  add column if not exists material_category text not null default 'document';

alter table public.documents
  add column if not exists file_name text;

alter table public.documents drop constraint if exists documents_material_category_check;
alter table public.documents add constraint documents_material_category_check
  check (material_category in ('document', 'media'));

-- 50 MB bucket limit (Supabase Free plan max per file)
update storage.buckets
set file_size_limit = 52428800
where id = 'lesson-materials';

insert into storage.buckets (id, name, public, file_size_limit)
values ('lesson-materials', 'lesson-materials', true, 52428800)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;
