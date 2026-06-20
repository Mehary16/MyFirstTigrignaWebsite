export const LESSON_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
export type LessonLevel = (typeof LESSON_LEVELS)[number];

export const LESSON_LEVEL_LABELS: Record<LessonLevel, string> = {
  Beginner: 'Beginner (Age 6–9)',
  Intermediate: 'Intermediate (Age 10–13)',
  Advanced: 'Advanced (Age 14–18)'
};

export function groupLessonsByLevel<T extends { level?: string | null }>(lessons: T[]) {
  const grouped: Record<string, T[]> = {
    Beginner: [],
    Intermediate: [],
    Advanced: [],
    Other: []
  };

  for (const lesson of lessons) {
    const key =
      lesson.level === 'Beginner' || lesson.level === 'Intermediate' || lesson.level === 'Advanced'
        ? lesson.level
        : 'Other';
    grouped[key].push(lesson);
  }

  return grouped;
}
