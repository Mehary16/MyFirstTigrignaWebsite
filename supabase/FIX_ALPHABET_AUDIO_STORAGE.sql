-- Alphabet pronunciation audio storage (teacher recordings).
-- Run once in Supabase SQL Editor.

insert into storage.buckets (id, name, public, file_size_limit)
values ('alphabet-audio', 'alphabet-audio', true, 2097152)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

-- Treat JWT app_metadata.role as teacher too (matches app routing when profiles.role is out of sync).
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

drop policy if exists "alphabet audio public read" on storage.objects;
create policy "alphabet audio public read"
  on storage.objects for select
  using (bucket_id = 'alphabet-audio');

drop policy if exists "teachers upload alphabet audio" on storage.objects;
create policy "teachers upload alphabet audio"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'alphabet-audio' and public.is_teacher());

drop policy if exists "teachers update alphabet audio" on storage.objects;
create policy "teachers update alphabet audio"
  on storage.objects for update to authenticated
  using (bucket_id = 'alphabet-audio' and public.is_teacher())
  with check (bucket_id = 'alphabet-audio' and public.is_teacher());

drop policy if exists "teachers delete alphabet audio" on storage.objects;
create policy "teachers delete alphabet audio"
  on storage.objects for delete to authenticated
  using (bucket_id = 'alphabet-audio' and public.is_teacher());
