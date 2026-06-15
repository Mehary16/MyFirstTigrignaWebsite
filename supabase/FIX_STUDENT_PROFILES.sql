-- Creates missing student profile rows from auth.users
-- Run in Supabase SQL Editor if students can sign up but cannot open the dashboard.

insert into public.profiles (id, full_name, role, is_active, email)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'Student'),
  case
    when lower(coalesce(u.raw_user_meta_data->>'role', '')) = 'teacher' then 'Teacher'
    when lower(coalesce(u.raw_user_meta_data->>'role', '')) = 'parent' then 'Parent'
    else 'Student'
  end,
  true,
  u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Fix a specific student by email (replace with your student email):
-- update public.profiles set role = 'Student', is_active = true where email = 'student@example.com';
