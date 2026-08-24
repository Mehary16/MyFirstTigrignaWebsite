-- Lets teachers edit or delete alphabet activity log rows.
-- Run once in Supabase SQL Editor.

create or replace function public.is_teacher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Teacher'
  )
  or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'teacher';
$$;

drop policy if exists "alphabet activity teacher update" on public.alphabet_activity;
create policy "alphabet activity teacher update"
  on public.alphabet_activity for update
  using (public.is_teacher())
  with check (public.is_teacher());

drop policy if exists "alphabet activity teacher delete" on public.alphabet_activity;
create policy "alphabet activity teacher delete"
  on public.alphabet_activity for delete
  using (public.is_teacher());
