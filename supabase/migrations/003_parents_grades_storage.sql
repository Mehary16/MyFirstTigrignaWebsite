-- Parents, grades, and storage setup. Run in Supabase SQL Editor.

alter table public.profiles
  add column if not exists email text;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('Teacher', 'Student', 'Parent'));

create table if not exists public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  grade text not null,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parent_student_links enable row level security;
alter table public.grades enable row level security;

drop policy if exists "parent links read" on public.parent_student_links;
create policy "parent links read" on public.parent_student_links
  for select using (
    auth.uid() = parent_id
    or auth.uid() = student_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher')
  );

drop policy if exists "parent links manage teacher" on public.parent_student_links;
create policy "parent links manage teacher" on public.parent_student_links
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher')
  );

drop policy if exists "grades read" on public.grades;
create policy "grades read" on public.grades
  for select using (
    auth.uid() = student_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher')
    or exists (
      select 1 from public.parent_student_links psl
      where psl.parent_id = auth.uid() and psl.student_id = grades.student_id
    )
  );

drop policy if exists "grades manage teacher" on public.grades;
create policy "grades manage teacher" on public.grades
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher')
  );

drop policy if exists "profiles read linked students" on public.profiles;
create policy "profiles read linked students" on public.profiles
  for select using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.parent_id = auth.uid() and psl.student_id = profiles.id
    )
  );

drop policy if exists "submissions read linked parent" on public.submissions;
create policy "submissions read linked parent" on public.submissions
  for select using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.parent_id = auth.uid() and psl.student_id = submissions.student_id
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_role text;
begin
  resolved_role := case
    when lower(coalesce(new.raw_user_meta_data->>'role', '')) = 'teacher' then 'Teacher'
    when lower(coalesce(new.raw_user_meta_data->>'role', '')) = 'parent' then 'Parent'
    else 'Student'
  end;

  insert into public.profiles (id, full_name, role, is_active, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    resolved_role,
    true,
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Storage buckets (fixes "Bucket not found")
insert into storage.buckets (id, name, public, file_size_limit)
values ('student-submissions', 'student-submissions', true, 52428800)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

insert into storage.buckets (id, name, public, file_size_limit)
values ('lesson-materials', 'lesson-materials', true, 15728640)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

alter table public.submissions
  add column if not exists submission_type text not null default 'link'
    check (submission_type in ('link', 'video', 'image', 'document')),
  add column if not exists file_name text;

alter table public.submissions alter column video_url drop not null;

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
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher')
  );

drop policy if exists "lesson materials public read" on storage.objects;
create policy "lesson materials public read"
  on storage.objects for select using (bucket_id = 'lesson-materials');
