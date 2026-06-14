-- Run in Supabase SQL Editor if teachers cannot edit or delete documents.

drop policy if exists "documents update teacher" on public.documents;
create policy "documents update teacher" on public.documents
  for update using (public.is_teacher())
  with check (public.is_teacher());

drop policy if exists "documents delete teacher" on public.documents;
create policy "documents delete teacher" on public.documents
  for delete using (public.is_teacher());

drop policy if exists "teachers delete lesson materials" on storage.objects;
create policy "teachers delete lesson materials"
  on storage.objects for delete to authenticated
  with check (bucket_id = 'lesson-materials' and public.is_teacher());
