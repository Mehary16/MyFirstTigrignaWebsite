-- Quick fix: homework assignment linking on submissions
-- Run in Supabase → SQL Editor if you see:
-- "Could not find the 'assignment_id' column of 'submissions' in the schema cache"
-- OR "Could not find a relationship between 'submissions' and 'assignments' in the schema cache"

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  lesson_id uuid references public.lessons(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.submissions add column if not exists assignment_id uuid;
alter table public.submissions add column if not exists teacher_feedback text;
alter table public.submissions add column if not exists feedback_at timestamptz;

-- Supabase needs this foreign key to join submissions → assignments (e.g. assignments(title))
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
    where tc.table_schema = 'public'
      and tc.table_name = 'submissions'
      and tc.constraint_type = 'FOREIGN KEY'
      and kcu.column_name = 'assignment_id'
  ) then
    alter table public.submissions
      add constraint submissions_assignment_id_fkey
      foreign key (assignment_id) references public.assignments(id) on delete set null;
  end if;
end $$;

alter table public.assignments enable row level security;

drop policy if exists "assignments read" on public.assignments;
create policy "assignments read" on public.assignments
  for select using (
    public.is_teacher()
    or public.is_active_student()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'Parent'
    )
  );

drop policy if exists "assignments manage teacher" on public.assignments;
create policy "assignments manage teacher" on public.assignments
  for all using (public.is_teacher())
  with check (public.is_teacher());

drop policy if exists "submissions feedback teacher" on public.submissions;
create policy "submissions feedback teacher" on public.submissions
  for update using (public.is_teacher())
  with check (public.is_teacher());

-- Schema cache refreshes automatically within a few seconds after this runs.
