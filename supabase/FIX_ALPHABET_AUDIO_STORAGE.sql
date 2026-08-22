-- Alphabet pronunciation audio storage (teacher recordings).
-- Run once in Supabase SQL Editor.

insert into storage.buckets (id, name, public, file_size_limit)
values ('alphabet-audio', 'alphabet-audio', true, 2097152)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists "alphabet audio public read" on storage.objects;
create policy "alphabet audio public read"
  on storage.objects for select
  using (bucket_id = 'alphabet-audio');

drop policy if exists "teachers upload alphabet audio" on storage.objects;
create policy "teachers upload alphabet audio"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'alphabet-audio'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher')
  );

drop policy if exists "teachers update alphabet audio" on storage.objects;
create policy "teachers update alphabet audio"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'alphabet-audio'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher')
  )
  with check (
    bucket_id = 'alphabet-audio'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher')
  );

drop policy if exists "teachers delete alphabet audio" on storage.objects;
create policy "teachers delete alphabet audio"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'alphabet-audio'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Teacher')
  );
