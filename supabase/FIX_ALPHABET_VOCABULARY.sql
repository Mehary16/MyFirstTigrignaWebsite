-- Teacher-managed alphabet practice words (e.g. ከልቢ · Dog for the Ke family).
-- Run in Supabase SQL Editor after FIX_RLS_RECURSION.sql.

create table if not exists public.alphabet_vocabulary (
  id uuid primary key default gen_random_uuid(),
  family_id text not null,
  word text not null,
  transliteration text not null default '',
  meaning text not null default '',
  audio_filename text,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists alphabet_vocabulary_family_idx
  on public.alphabet_vocabulary (family_id, sort_order, created_at);

alter table public.alphabet_vocabulary enable row level security;

drop policy if exists "alphabet vocabulary read" on public.alphabet_vocabulary;
create policy "alphabet vocabulary read"
  on public.alphabet_vocabulary for select
  using (auth.uid() is not null);

drop policy if exists "alphabet vocabulary teacher insert" on public.alphabet_vocabulary;
create policy "alphabet vocabulary teacher insert"
  on public.alphabet_vocabulary for insert
  with check (public.is_teacher());

drop policy if exists "alphabet vocabulary teacher update" on public.alphabet_vocabulary;
create policy "alphabet vocabulary teacher update"
  on public.alphabet_vocabulary for update
  using (public.is_teacher())
  with check (public.is_teacher());

drop policy if exists "alphabet vocabulary teacher delete" on public.alphabet_vocabulary;
create policy "alphabet vocabulary teacher delete"
  on public.alphabet_vocabulary for delete
  using (public.is_teacher());
