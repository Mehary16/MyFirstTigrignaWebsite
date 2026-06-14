-- Run this once in Supabase → SQL Editor to fix "Bucket not found" errors.

insert into storage.buckets (id, name, public, file_size_limit)
values ('student-submissions', 'student-submissions', true, 52428800)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

insert into storage.buckets (id, name, public, file_size_limit)
values ('lesson-materials', 'lesson-materials', true, 15728640)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists "student submissions public read" on storage.objects;
create policy "student submissions public read"
  on storage.objects for select using (bucket_id = 'student-submissions');

drop policy if exists "active students upload submissions" on storage.objects;
create policy "active students upload submissions"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'student-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'Student' and p.is_active = true
    )
  );

drop policy if exists "teachers upload lesson materials" on storage.objects;
create policy "teachers upload lesson materials"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lesson-materials'
    and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher'
    )
  );

drop policy if exists "lesson materials public read" on storage.objects;
create policy "lesson materials public read"
  on storage.objects for select using (bucket_id = 'lesson-materials');
