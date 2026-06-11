create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'Student' check (role in ('Teacher', 'Student')),
  full_name text not null,
  created_at timestamptz not null default now()
);

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
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  video_url text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.documents enable row level security;
alter table public.submissions enable row level security;

create policy "profiles read own" on public.profiles
  for select using (auth.uid() = id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher'
  ));

create policy "profiles manage own" on public.profiles
  for all using (auth.uid() = id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher'
  ))
  with check (auth.uid() = id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher'
  ));

create policy "lessons read authenticated" on public.lessons
  for select using (auth.role() = 'authenticated');

create policy "lessons write teacher" on public.lessons
  for insert with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher'
  ));

create policy "documents read authenticated" on public.documents
  for select using (auth.role() = 'authenticated');

create policy "documents write teacher" on public.documents
  for insert with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher'
  ));

create policy "submissions read own or teacher" on public.submissions
  for select using (auth.uid() = student_id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher'
  ));

create policy "submissions insert own" on public.submissions
  for insert with check (auth.uid() = student_id);