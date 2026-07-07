import { revalidatePath, revalidateTag } from 'next/cache';
import { LESSONS_CACHE_TAG, lessonCacheTag } from './lessonCache';

export function revalidateLessonCaches(lessonId?: string) {
  revalidateTag(LESSONS_CACHE_TAG, 'max');

  if (lessonId) {
    revalidateTag(lessonCacheTag(lessonId), 'max');
    revalidatePath(`/student/lessons/${lessonId}`);
  }

  revalidatePath('/student/dashboard');
  revalidatePath('/teacher/dashboard');
}
