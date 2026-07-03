import { unstable_cache } from 'next/cache';
import { createAdminSupabaseClient } from './supabaseAdmin';

export const LESSONS_CACHE_TAG = 'lessons';
export const LESSON_REVALIDATE_SECONDS = 3600;

export type LessonRecord = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  category: string | null;
  level: string | null;
  external_link: string | null;
  created_at: string;
};

export function lessonCacheTag(lessonId: string) {
  return `lesson-${lessonId}`;
}

const LESSON_SELECT =
  'id, title, description, video_url, category, level, external_link, created_at' as const;

async function readAllLessons(): Promise<LessonRecord[]> {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    return [];
  }

  const { data, error } = await admin
    .from('lessons')
    .select(LESSON_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as LessonRecord[];
}

async function readLessonById(lessonId: string): Promise<LessonRecord | null> {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin.from('lessons').select(LESSON_SELECT).eq('id', lessonId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as LessonRecord | null) ?? null;
}

export const getCachedLessons = unstable_cache(readAllLessons, ['lessons-all'], {
  tags: [LESSONS_CACHE_TAG],
  revalidate: LESSON_REVALIDATE_SECONDS
});

export function getCachedLesson(lessonId: string) {
  return unstable_cache(() => readLessonById(lessonId), ['lesson', lessonId], {
    tags: [LESSONS_CACHE_TAG, lessonCacheTag(lessonId)],
    revalidate: LESSON_REVALIDATE_SECONDS
  })();
}
