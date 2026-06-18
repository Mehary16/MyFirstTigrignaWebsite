-- Allow students to edit and delete their own homework submissions.

drop policy if exists "submissions update own" on public.submissions;
create policy "submissions update own" on public.submissions
  for update using (auth.uid() = student_id and public.is_active_student())
  with check (auth.uid() = student_id and public.is_active_student());

drop policy if exists "submissions delete own" on public.submissions;
create policy "submissions delete own" on public.submissions
  for delete using (auth.uid() = student_id and public.is_active_student());

drop policy if exists "students delete own submissions" on storage.objects;
create policy "students delete own submissions"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'student-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
