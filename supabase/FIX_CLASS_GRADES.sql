-- Grade 1 / Grade 2 / Grade 3 for students and teacher content.
-- Run in Supabase → SQL Editor.

alter table public.profiles add column if not exists class_grade text;

alter table public.profiles drop constraint if exists profiles_class_grade_check;
alter table public.profiles add constraint profiles_class_grade_check
  check (class_grade is null or class_grade in ('Grade 1', 'Grade 2', 'Grade 3'));

-- Migrate legacy lesson levels to class grades.
update public.lessons set level = 'Grade 1' where level = 'Beginner';
update public.lessons set level = 'Grade 2' where level = 'Intermediate';
update public.lessons set level = 'Grade 3' where level = 'Advanced';

alter table public.lessons drop constraint if exists lessons_level_check;
alter table public.lessons add constraint lessons_level_check
  check (level is null or level in ('Grade 1', 'Grade 2', 'Grade 3'));

alter table public.assignments add column if not exists class_grade text;
alter table public.assignments drop constraint if exists assignments_class_grade_check;
alter table public.assignments add constraint assignments_class_grade_check
  check (class_grade is null or class_grade in ('Grade 1', 'Grade 2', 'Grade 3'));

alter table public.announcements add column if not exists class_grade text;
alter table public.announcements drop constraint if exists announcements_class_grade_check;
alter table public.announcements add constraint announcements_class_grade_check
  check (class_grade is null or class_grade in ('Grade 1', 'Grade 2', 'Grade 3'));

alter table public.live_classes add column if not exists class_grade text;
alter table public.live_classes drop constraint if exists live_classes_class_grade_check;
alter table public.live_classes add constraint live_classes_class_grade_check
  check (class_grade is null or class_grade in ('Grade 1', 'Grade 2', 'Grade 3'));

alter table public.documents add column if not exists class_grade text;
alter table public.documents drop constraint if exists documents_class_grade_check;
alter table public.documents add constraint documents_class_grade_check
  check (class_grade is null or class_grade in ('Grade 1', 'Grade 2', 'Grade 3'));
