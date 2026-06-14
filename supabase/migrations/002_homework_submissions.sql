-- Homework submission media types + Supabase Storage buckets/policies.
-- Run in Supabase SQL Editor after 001_student_controls.sql.

alter table public.submissions
  add column if not exists submission_type text not null default 'link'
    check (submission_type in ('link', 'video', 'image', 'document')),
  add column if not exists file_name text;

alter table public.submissions
  alter column video_url drop not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-submissions',
  'student-submissions',
  true,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-materials',
  'lesson-materials',
  true,
  15728640,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "student submissions public read" on storage.objects;
create policy "student submissions public read"
  on storage.objects for select
  using (bucket_id = 'student-submissions');

drop policy if exists "active students upload submissions" on storage.objects;
create policy "active students upload submissions"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'student-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'Student' and p.is_active = true
    )
  );

drop policy if exists "students update own submissions" on storage.objects;
create policy "students update own submissions"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'student-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'student-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "students delete own submissions" on storage.objects;
create policy "students delete own submissions"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'student-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "teachers upload lesson materials" on storage.objects;
create policy "teachers upload lesson materials"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'lesson-materials'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'Teacher'
    )
  );

drop policy if exists "lesson materials public read" on storage.objects;
create policy "lesson materials public read"
  on storage.objects for select
  using (bucket_id = 'lesson-materials');
