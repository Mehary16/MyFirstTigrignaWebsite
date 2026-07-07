-- In-app notifications for students and teachers.
-- Run in Supabase SQL Editor.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('lesson', 'assignment', 'announcement', 'submission', 'live_class', 'material')),
  title text not null,
  body text,
  link_path text not null default '/student/dashboard',
  source_id uuid,
  class_grade text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications read own" on public.notifications;
create policy "notifications read own"
  on public.notifications for select
  using (auth.uid() = recipient_id);

drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own"
  on public.notifications for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

create or replace function public.notify_students_in_grade(
  p_class_grade text,
  p_type text,
  p_title text,
  p_body text default null,
  p_link_path text default '/student/dashboard',
  p_source_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Teacher'
  ) then
    raise exception 'Only teachers can notify students.';
  end if;

  if p_type not in ('lesson', 'assignment', 'announcement', 'live_class', 'material') then
    raise exception 'Invalid notification type.';
  end if;

  insert into public.notifications (recipient_id, type, title, body, link_path, source_id, class_grade)
  select
    p.id,
    p_type,
    p_title,
    p_body,
    p_link_path,
    p_source_id,
    p_class_grade
  from public.profiles p
  where p.role = 'Student'
    and p.class_grade = p_class_grade
    and coalesce(p.is_active, true) = true;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.notify_teachers_of_submission(
  p_submission_id uuid,
  p_title text,
  p_body text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if not exists (
    select 1
    from public.submissions s
    where s.id = p_submission_id
      and s.student_id = auth.uid()
  ) then
    raise exception 'Submission not found.';
  end if;

  insert into public.notifications (recipient_id, type, title, body, link_path, source_id)
  select
    t.id,
    'submission',
    p_title,
    p_body,
    '/teacher/dashboard',
    p_submission_id
  from public.profiles t
  where t.role = 'Teacher';

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

grant execute on function public.notify_students_in_grade(text, text, text, text, text, uuid) to authenticated;
grant execute on function public.notify_teachers_of_submission(uuid, text, text) to authenticated;
