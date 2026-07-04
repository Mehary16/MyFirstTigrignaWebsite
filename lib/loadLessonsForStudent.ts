import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClassGrade } from './classGrades';
import { filterItemsByClassGrade } from './classGrades';
import { getCachedLessons, type LessonRecord } from './lessonCache';
import { fetchLessonsForDisplay } from './safeQueries';

/** Cached lesson list for students, filtered by class grade when provided. */
export async function loadLessonsForStudent(
  supabase: SupabaseClient,
  classGrade?: ClassGrade | null
): Promise<LessonRecord[]> {
  try {
    const cached = await getCachedLessons();
    if (cached.length > 0 || process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return classGrade ? filterItemsByClassGrade(cached, classGrade) : cached;
    }
  } catch {
    // Fall through to authenticated query.
  }

  const { data } = await fetchLessonsForDisplay(supabase, classGrade);
  return (data ?? []) as LessonRecord[];
}
