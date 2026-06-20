-- ============================================================
-- RUN THIS in Supabase → SQL Editor (after RUN_THIS_FIRST.sql)
-- Tier 1 & 2: assignments, feedback, levels, live classes,
-- announcements, lesson views, lesson edit/delete policies
-- ============================================================

-- Lesson levels
alter table public.lessons add column if not exists level text;
alter table public.lessons drop constraint if exists lessons_level_check;
alter table public.lessons add constraint lessons_level_check
  check (level is null or level in ('Beginner', 'Intermediate', 'Advanced'));

-- Structured homework assignments
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  lesson_id uuid references public.lessons(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.submissions add column if not exists assignment_id uuid references public.assignments(id) on delete set null;
alter table public.submissions add column if not exists teacher_feedback text;
alter table public.submissions add column if not exists feedback_at timestamptz;

-- Live classes
create table if not exists public.live_classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  meeting_url text not null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  notes text,
  created_at timestamptz not null default now()
);

-- Announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Lesson view tracking (progress)
create table if not exists public.lesson_views (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

alter table public.assignments enable row level security;
alter table public.live_classes enable row level security;
alter table public.announcements enable row level security;
alter table public.lesson_views enable row level security;

-- Lesson update/delete (Tier 2)
drop policy if exists "lessons update teacher" on public.lessons;
create policy "lessons update teacher" on public.lessons
  for update using (public.is_teacher())
  with check (public.is_teacher());

drop policy if exists "lessons delete teacher" on public.lessons;
create policy "lessons delete teacher" on public.lessons
  for delete using (public.is_teacher());

-- Assignments
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

-- Teacher feedback on submissions
drop policy if exists "submissions feedback teacher" on public.submissions;
create policy "submissions feedback teacher" on public.submissions
  for update using (public.is_teacher())
  with check (public.is_teacher());

-- Live classes
drop policy if exists "live classes read" on public.live_classes;
create policy "live classes read" on public.live_classes
  for select using (
    public.is_teacher()
    or public.is_active_student()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'Parent'
    )
  );

drop policy if exists "live classes manage teacher" on public.live_classes;
create policy "live classes manage teacher" on public.live_classes
  for all using (public.is_teacher())
  with check (public.is_teacher());

-- Announcements
drop policy if exists "announcements read" on public.announcements;
create policy "announcements read" on public.announcements
  for select using (auth.uid() is not null);

drop policy if exists "announcements manage teacher" on public.announcements;
create policy "announcements manage teacher" on public.announcements
  for all using (public.is_teacher())
  with check (public.is_teacher());

-- Lesson views
drop policy if exists "lesson views read" on public.lesson_views;
create policy "lesson views read" on public.lesson_views
  for select using (
    auth.uid() = student_id
    or public.is_teacher()
    or public.is_parent_of_student(student_id)
  );

drop policy if exists "lesson views insert own" on public.lesson_views;
create policy "lesson views insert own" on public.lesson_views
  for insert with check (auth.uid() = student_id and public.is_active_student());

drop policy if exists "lesson views upsert own" on public.lesson_views;
create policy "lesson views upsert own" on public.lesson_views
  for update using (auth.uid() = student_id)
  with check (auth.uid() = student_id);
