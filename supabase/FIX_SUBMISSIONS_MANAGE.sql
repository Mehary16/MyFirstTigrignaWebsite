-- Allow students to edit and delete their own homework submissions.
-- Run this in Supabase SQL Editor if edit/delete fails on the student dashboard.

drop policy if exists "submissions update own" on public.submissions;
create policy "submissions update own" on public.submissions
  for update using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

drop policy if exists "submissions delete own" on public.submissions;
create policy "submissions delete own" on public.submissions
  for delete using (auth.uid() = student_id);

drop policy if exists "students delete own submissions" on storage.objects;
create policy "students delete own submissions"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'student-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "students update own submissions" on storage.objects;
create policy "students update own submissions"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'student-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'student-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
