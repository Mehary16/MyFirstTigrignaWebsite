-- Quick fix: announcements (and live classes)
-- Run in Supabase → SQL Editor if you see:
-- "Could not find the table 'public.announcements' in the schema cache"
-- OR live class errors mentioning public.live_classes

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

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

alter table public.announcements enable row level security;
alter table public.live_classes enable row level security;

drop policy if exists "announcements read" on public.announcements;
create policy "announcements read" on public.announcements
  for select using (auth.uid() is not null);

drop policy if exists "announcements manage teacher" on public.announcements;
create policy "announcements manage teacher" on public.announcements
  for all using (public.is_teacher())
  with check (public.is_teacher());

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
