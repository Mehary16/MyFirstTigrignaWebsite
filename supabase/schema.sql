create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'Student' check (role in ('Teacher', 'Student')),
  full_name text not null,
  is_active boolean not null default true,
  suspended_reason text,
  suspended_at timestamptz,
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

create policy "lessons read active users" on public.lessons
  for select using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and (p.role = 'Teacher' or (p.role = 'Student' and p.is_active = true))
  ));

create policy "lessons write teacher" on public.lessons
  for insert with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher'
  ));

create policy "documents read active users" on public.documents
  for select using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and (p.role = 'Teacher' or (p.role = 'Student' and p.is_active = true))
  ));

create policy "documents write teacher" on public.documents
  for insert with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher'
  ));

create policy "submissions read own or teacher" on public.submissions
  for select using (auth.uid() = student_id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher'
  ));

create policy "submissions insert active own" on public.submissions
  for insert with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'Student' and p.is_active = true
    )
  );

-- Auto-create a profile row when a new user signs up (avoids RLS issues on first login).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case
      when lower(coalesce(new.raw_user_meta_data->>'role', '')) = 'teacher' then 'Teacher'
      else 'Student'
    end,
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
