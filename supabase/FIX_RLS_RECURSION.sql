-- ============================================================
-- FIX: "infinite recursion detected in policy for relation profiles"
-- Run this ENTIRE file in Supabase → SQL Editor, then refresh the app.
-- ============================================================

create or replace function public.is_teacher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Teacher'
  );
$$;

create or replace function public.is_active_student()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Student' and is_active = true
  );
$$;

create or replace function public.is_teacher_or_active_student()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and (role = 'Teacher' or (role = 'Student' and is_active = true))
  );
$$;

create or replace function public.is_parent_of_student(target_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.parent_student_links
    where parent_id = auth.uid() and student_id = target_student_id
  );
$$;

grant execute on function public.is_teacher() to authenticated;
grant execute on function public.is_active_student() to authenticated;
grant execute on function public.is_teacher_or_active_student() to authenticated;
grant execute on function public.is_parent_of_student(uuid) to authenticated;

-- profiles
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select using (
    auth.uid() = id
    or public.is_teacher()
    or public.is_parent_of_student(id)
  );

drop policy if exists "profiles read linked students" on public.profiles;

drop policy if exists "profiles manage own" on public.profiles;
create policy "profiles manage own" on public.profiles
  for all using (auth.uid() = id or public.is_teacher())
  with check (auth.uid() = id or public.is_teacher());

-- lessons
drop policy if exists "lessons read active users" on public.lessons;
create policy "lessons read active users" on public.lessons
  for select using (public.is_teacher_or_active_student());

drop policy if exists "lessons write teacher" on public.lessons;
create policy "lessons write teacher" on public.lessons
  for insert with check (public.is_teacher());

-- documents
drop policy if exists "documents read active users" on public.documents;
create policy "documents read active users" on public.documents
  for select using (public.is_teacher_or_active_student());

drop policy if exists "documents write teacher" on public.documents;
create policy "documents write teacher" on public.documents
  for insert with check (public.is_teacher());

drop policy if exists "documents update teacher" on public.documents;
create policy "documents update teacher" on public.documents
  for update using (public.is_teacher())
  with check (public.is_teacher());

drop policy if exists "documents delete teacher" on public.documents;
create policy "documents delete teacher" on public.documents
  for delete using (public.is_teacher());

-- submissions
drop policy if exists "submissions read own or teacher" on public.submissions;
create policy "submissions read own or teacher" on public.submissions
  for select using (
    auth.uid() = student_id
    or public.is_teacher()
    or public.is_parent_of_student(student_id)
  );

drop policy if exists "submissions read linked parent" on public.submissions;

drop policy if exists "submissions insert active own" on public.submissions;
create policy "submissions insert active own" on public.submissions
  for insert with check (auth.uid() = student_id and public.is_active_student());

drop policy if exists "submissions update own" on public.submissions;
create policy "submissions update own" on public.submissions
  for update using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

drop policy if exists "submissions delete own" on public.submissions;
create policy "submissions delete own" on public.submissions
  for delete using (auth.uid() = student_id);

-- parent_student_links
drop policy if exists "parent links read" on public.parent_student_links;
create policy "parent links read" on public.parent_student_links
  for select using (
    auth.uid() = parent_id
    or auth.uid() = student_id
    or public.is_teacher()
  );

drop policy if exists "parent links manage teacher" on public.parent_student_links;
create policy "parent links manage teacher" on public.parent_student_links
  for all using (public.is_teacher())
  with check (public.is_teacher());

-- grades
drop policy if exists "grades read" on public.grades;
create policy "grades read" on public.grades
  for select using (
    auth.uid() = student_id
    or public.is_teacher()
    or public.is_parent_of_student(student_id)
  );

drop policy if exists "grades manage teacher" on public.grades;
create policy "grades manage teacher" on public.grades
  for all using (public.is_teacher())
  with check (public.is_teacher());

-- storage
drop policy if exists "active students upload submissions" on storage.objects;
create policy "active students upload submissions"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'student-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_active_student()
  );

drop policy if exists "teachers upload lesson materials" on storage.objects;
create policy "teachers upload lesson materials"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'lesson-materials' and public.is_teacher());

drop policy if exists "teachers delete lesson materials" on storage.objects;
create policy "teachers delete lesson materials"
  on storage.objects for delete to authenticated
  with check (bucket_id = 'lesson-materials' and public.is_teacher());
