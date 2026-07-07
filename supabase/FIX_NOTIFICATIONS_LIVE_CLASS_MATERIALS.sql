-- Extend in-app notifications for live classes and reading materials.
-- Run in Supabase SQL Editor (after FIX_NOTIFICATIONS.sql).

alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('lesson', 'assignment', 'announcement', 'submission', 'live_class', 'material'));

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

grant execute on function public.notify_students_in_grade(text, text, text, text, text, uuid) to authenticated;
