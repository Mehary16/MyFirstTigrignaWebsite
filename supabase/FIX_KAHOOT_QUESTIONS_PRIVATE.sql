-- Move quiz answers out of kahoot_live_sessions so students cannot read correctIndex via Supabase client.
-- Run after FIX_KAHOOT_LIVE.sql (safe to re-run).

create table if not exists public.kahoot_session_questions (
  session_id uuid primary key references public.kahoot_live_sessions(id) on delete cascade,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.kahoot_session_questions enable row level security;

-- Migrate existing games (when questions still lived on sessions)
insert into public.kahoot_session_questions (session_id, questions)
select s.id, s.questions
from public.kahoot_live_sessions s
where s.questions is not null
  and s.questions <> '[]'::jsonb
on conflict (session_id) do update
  set questions = excluded.questions;

alter table public.kahoot_live_sessions drop column if exists questions;

drop policy if exists "kahoot questions host read" on public.kahoot_session_questions;
create policy "kahoot questions host read"
  on public.kahoot_session_questions for select
  using (
    exists (
      select 1 from public.kahoot_live_sessions s
      where s.id = session_id and s.host_id = auth.uid()
    )
  );

drop policy if exists "kahoot questions host insert" on public.kahoot_session_questions;
create policy "kahoot questions host insert"
  on public.kahoot_session_questions for insert
  with check (
    exists (
      select 1 from public.kahoot_live_sessions s
      where s.id = session_id and s.host_id = auth.uid()
    )
  );

-- Scores may only change on the server (service role), not via browser Supabase client.
drop policy if exists "kahoot players update score" on public.kahoot_live_players;
