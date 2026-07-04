export const CLASS_GRADES = ['Grade 1', 'Grade 2', 'Grade 3'] as const;
export type ClassGrade = (typeof CLASS_GRADES)[number];

export const CLASS_GRADE_LABELS: Record<ClassGrade, string> = {
  'Grade 1': 'Grade 1',
  'Grade 2': 'Grade 2',
  'Grade 3': 'Grade 3'
};

const LEGACY_LESSON_LEVEL_MAP: Record<string, ClassGrade> = {
  Beginner: 'Grade 1',
  Intermediate: 'Grade 2',
  Advanced: 'Grade 3'
};

export function normalizeClassGrade(value: string | null | undefined): ClassGrade | null {
  if (!value) return null;
  if (value === 'Grade 1' || value === 'Grade 2' || value === 'Grade 3') return value;
  return LEGACY_LESSON_LEVEL_MAP[value] ?? null;
}

export function itemClassGrade(item: { class_grade?: string | null; level?: string | null }): ClassGrade | null {
  return normalizeClassGrade(item.class_grade ?? item.level ?? null);
}

export function matchesClassGrade(
  item: { class_grade?: string | null; level?: string | null },
  grade: ClassGrade | null
) {
  if (!grade) return false;
  return itemClassGrade(item) === grade;
}

export function filterItemsByClassGrade<T extends { class_grade?: string | null; level?: string | null }>(
  items: T[],
  grade: ClassGrade | null
) {
  if (!grade) return [];
  return items.filter((item) => matchesClassGrade(item, grade));
}

export function filterItemsByClassGrades<T extends { class_grade?: string | null; level?: string | null }>(
  items: T[],
  grades: ClassGrade[]
) {
  if (!grades.length) return [];
  const allowed = new Set(grades);
  return items.filter((item) => {
    const itemGrade = itemClassGrade(item);
    return itemGrade !== null && allowed.has(itemGrade);
  });
}

export function groupLessonsByClassGrade<T extends { class_grade?: string | null; level?: string | null }>(
  lessons: T[]
) {
  const grouped: Record<ClassGrade, T[]> = {
    'Grade 1': [],
    'Grade 2': [],
    'Grade 3': []
  };

  for (const lesson of lessons) {
    const grade = itemClassGrade(lesson);
    if (grade) grouped[grade].push(lesson);
  }

  return grouped;
}
