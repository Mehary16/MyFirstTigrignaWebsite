-- Allow teachers to delete student profiles (if delete still fails from the dashboard).
drop policy if exists "profiles delete teacher" on public.profiles;
create policy "profiles delete teacher" on public.profiles
  for delete using (
    public.is_teacher()
    and role = 'Student'
  );
