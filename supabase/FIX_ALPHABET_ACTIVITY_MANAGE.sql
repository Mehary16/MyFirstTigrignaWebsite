-- Lets teachers edit or delete alphabet activity log rows.
-- Run once in Supabase SQL Editor.

drop policy if exists "alphabet activity teacher update" on public.alphabet_activity;
create policy "alphabet activity teacher update"
  on public.alphabet_activity for update
  using (public.is_teacher())
  with check (public.is_teacher());

drop policy if exists "alphabet activity teacher delete" on public.alphabet_activity;
create policy "alphabet activity teacher delete"
  on public.alphabet_activity for delete
  using (public.is_teacher());
