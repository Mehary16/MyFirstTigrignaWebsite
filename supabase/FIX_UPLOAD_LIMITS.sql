-- Supabase Free plan: max 50 MB per file.
-- Run in Supabase SQL Editor after any earlier limit increase scripts.

update storage.buckets
set file_size_limit = 52428800
where id in ('lesson-materials', 'student-submissions');

insert into storage.buckets (id, name, public, file_size_limit)
values ('lesson-materials', 'lesson-materials', true, 52428800)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

insert into storage.buckets (id, name, public, file_size_limit)
values ('student-submissions', 'student-submissions', true, 52428800)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;
