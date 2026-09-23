-- Live Kahoot-style Tigrigna quiz sessions (teacher host + student join).
-- Run in Supabase SQL Editor after FIX_RLS_RECURSION.sql.
-- Then run FIX_KAHOOT_QUESTIONS_PRIVATE.sql (existing DBs) and FIX_KAHOOT_REALTIME.sql.

create table if not exists public.kahoot_live_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  pin text not null unique,
  title text not null default 'Tigrigna Fidel Quiz',
  status text not null default 'lobby' check (status in ('lobby', 'question', 'reveal', 'finished')),
  question_index integer not null default -1,
  question_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists kahoot_live_sessions_pin_idx on public.kahoot_live_sessions (pin);
create index if not exists kahoot_live_sessions_host_idx on public.kahoot_live_sessions (host_id, created_at desc);

create table if not exists public.kahoot_live_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.kahoot_live_sessions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  nickname text not null,
  score integer not null default 0,
  joined_at timestamptz not null default now(),
  unique (session_id, nickname)
);

create index if not exists kahoot_live_players_session_idx on public.kahoot_live_players (session_id);

create table if not exists public.kahoot_live_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.kahoot_live_sessions(id) on delete cascade,
  player_id uuid not null references public.kahoot_live_players(id) on delete cascade,
  question_index integer not null,
  choice_index integer not null,
  correct boolean not null,
  points integer not null default 0,
  answered_at timestamptz not null default now(),
  unique (session_id, player_id, question_index)
);

alter table public.kahoot_live_sessions enable row level security;
alter table public.kahoot_live_players enable row level security;
alter table public.kahoot_live_answers enable row level security;

drop policy if exists "kahoot sessions read logged in" on public.kahoot_live_sessions;
create policy "kahoot sessions read logged in"
  on public.kahoot_live_sessions for select
  using (auth.uid() is not null);

drop policy if exists "kahoot sessions teacher insert" on public.kahoot_live_sessions;
create policy "kahoot sessions teacher insert"
  on public.kahoot_live_sessions for insert
  with check (public.is_teacher() and host_id = auth.uid());

drop policy if exists "kahoot sessions host update" on public.kahoot_live_sessions;
create policy "kahoot sessions host update"
  on public.kahoot_live_sessions for update
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

drop policy if exists "kahoot players read logged in" on public.kahoot_live_players;
create policy "kahoot players read logged in"
  on public.kahoot_live_players for select
  using (auth.uid() is not null);

drop policy if exists "kahoot players insert self" on public.kahoot_live_players;
create policy "kahoot players insert self"
  on public.kahoot_live_players for insert
  with check (auth.uid() is not null and (user_id is null or user_id = auth.uid()));

-- Score updates happen only via server service role (see FIX_KAHOOT_QUESTIONS_PRIVATE.sql).

drop policy if exists "kahoot answers read logged in" on public.kahoot_live_answers;
create policy "kahoot answers read logged in"
  on public.kahoot_live_answers for select
  using (auth.uid() is not null);

drop policy if exists "kahoot answers insert own" on public.kahoot_live_answers;
create policy "kahoot answers insert own"
  on public.kahoot_live_answers for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1 from public.kahoot_live_players p
      where p.id = player_id and (p.user_id = auth.uid() or p.user_id is null)
    )
  );

create table if not exists public.kahoot_session_questions (
  session_id uuid primary key references public.kahoot_live_sessions(id) on delete cascade,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.kahoot_session_questions enable row level security;

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
