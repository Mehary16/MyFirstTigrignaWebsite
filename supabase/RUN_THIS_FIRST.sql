-- ============================================================
-- RUN THIS ENTIRE FILE ONCE in Supabase → SQL Editor
-- Fixes: missing submissions/documents tables, bucket errors
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'Student' check (role in ('Teacher', 'Student', 'Parent')),
  full_name text not null,
  email text,
  is_active boolean not null default true,
  suspended_reason text,
  suspended_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists suspended_reason text;
alter table public.profiles add column if not exists suspended_at timestamptz;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('Teacher', 'Student', 'Parent'));

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  video_url text not null,
  description text,
  category text,
  external_link text,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text,
  external_link text,
  material_category text not null default 'document' check (material_category in ('document', 'media')),
  file_name text,
  created_at timestamptz not null default now()
);

alter table public.documents add column if not exists material_category text not null default 'document';
alter table public.documents add column if not exists file_name text;
alter table public.documents drop constraint if exists documents_material_category_check;
alter table public.documents add constraint documents_material_category_check
  check (material_category in ('document', 'media'));

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  video_url text,
  submission_type text not null default 'link' check (submission_type in ('link', 'video', 'image', 'document')),
  file_name text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.submissions add column if not exists submission_type text not null default 'link';
alter table public.submissions add column if not exists file_name text;
alter table public.submissions alter column video_url drop not null;

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

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.documents enable row level security;
alter table public.submissions enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.grades enable row level security;

-- Security-definer helpers avoid infinite recursion when policies read profiles.
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

drop policy if exists "lessons read active users" on public.lessons;
create policy "lessons read active users" on public.lessons
  for select using (public.is_teacher_or_active_student());

drop policy if exists "lessons write teacher" on public.lessons;
create policy "lessons write teacher" on public.lessons
  for insert with check (public.is_teacher());

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

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare resolved_role text;
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
    resolved_role, true, new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public, file_size_limit)
values ('student-submissions', 'student-submissions', true, 52428800)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

insert into storage.buckets (id, name, public, file_size_limit)
values ('lesson-materials', 'lesson-materials', true, 52428800)
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

drop policy if exists "lesson materials public read" on storage.objects;
create policy "lesson materials public read"
  on storage.objects for select using (bucket_id = 'lesson-materials');
