-- Alphabet learning progress and activity (trace, quiz, learn).
-- Run in Supabase SQL Editor.

create table if not exists public.alphabet_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  practiced jsonb not null default '{}'::jsonb,
  quiz_correct_by_form jsonb not null default '{}'::jsonb,
  quiz_session_correct integer not null default 0,
  quiz_session_total integer not null default 0,
  quiz_lifetime_correct integer not null default 0,
  quiz_lifetime_total integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.alphabet_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type text not null check (activity_type in ('learn', 'trace', 'quiz_answer', 'quiz_start')),
  form_key text,
  family_id text,
  correct boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists alphabet_activity_user_created_idx
  on public.alphabet_activity (user_id, created_at desc);

create index if not exists alphabet_activity_created_idx
  on public.alphabet_activity (created_at desc);

create index if not exists alphabet_activity_type_idx
  on public.alphabet_activity (activity_type, created_at desc);

alter table public.alphabet_progress enable row level security;
alter table public.alphabet_activity enable row level security;

drop policy if exists "alphabet progress own read" on public.alphabet_progress;
create policy "alphabet progress own read"
  on public.alphabet_progress for select
  using (auth.uid() = user_id or public.is_teacher());

drop policy if exists "alphabet progress own write" on public.alphabet_progress;
create policy "alphabet progress own write"
  on public.alphabet_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "alphabet progress own update" on public.alphabet_progress;
create policy "alphabet progress own update"
  on public.alphabet_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "alphabet activity own insert" on public.alphabet_activity;
create policy "alphabet activity own insert"
  on public.alphabet_activity for insert
  with check (auth.uid() = user_id);

drop policy if exists "alphabet activity read own or teacher" on public.alphabet_activity;
create policy "alphabet activity read own or teacher"
  on public.alphabet_activity for select
  using (auth.uid() = user_id or public.is_teacher());
