-- Run this in Supabase SQL Editor if your database was created before student controls were added.

alter table public.profiles
  add column if not exists is_active boolean not null default true,
  add column if not exists suspended_reason text,
  add column if not exists suspended_at timestamptz;

drop policy if exists "lessons read authenticated" on public.lessons;
drop policy if exists "lessons read active users" on public.lessons;
create policy "lessons read active users" on public.lessons
  for select using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and (p.role = 'Teacher' or (p.role = 'Student' and p.is_active = true))
  ));

drop policy if exists "documents read authenticated" on public.documents;
drop policy if exists "documents read active users" on public.documents;
create policy "documents read active users" on public.documents
  for select using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and (p.role = 'Teacher' or (p.role = 'Student' and p.is_active = true))
  ));

drop policy if exists "submissions insert own" on public.submissions;
drop policy if exists "submissions insert active own" on public.submissions;
create policy "submissions insert active own" on public.submissions
  for insert with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'Student' and p.is_active = true
    )
  );

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
