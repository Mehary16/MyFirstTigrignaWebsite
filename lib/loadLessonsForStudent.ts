import type { SupabaseClient } from '@supabase/supabase-js';
import { getCachedLessons, type LessonRecord } from './lessonCache';
import { fetchLessonsForDisplay } from './safeQueries';

/** Cached lesson list for students; falls back to live Supabase if cache is unavailable. */
export async function loadLessonsForStudent(supabase: SupabaseClient): Promise<LessonRecord[]> {
  try {
    const cached = await getCachedLessons();
    if (cached.length > 0 || process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return cached;
    }
  } catch {
    // Fall through to authenticated query.
  }

  const { data } = await fetchLessonsForDisplay(supabase);
  return (data ?? []) as LessonRecord[];
}
