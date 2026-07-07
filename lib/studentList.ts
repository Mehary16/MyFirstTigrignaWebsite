import { splitFullName } from './studentNames';
import { CLASS_GRADES, normalizeClassGrade, type ClassGrade } from './classGrades';

export type StudentListItem = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  class_grade: ClassGrade | null;
  created_at: string;
  is_active: boolean;
  suspended_reason: string | null;
  submission_count: number;
};

export function toStudentListItem(
  student: {
    id: string;
    full_name: string;
    email?: string | null;
    class_grade?: string | null;
    created_at: string;
    is_active?: boolean | null;
    suspended_reason?: string | null;
  },
  submissionCount = 0
): StudentListItem {
  const { firstName, lastName } = splitFullName(student.full_name);

  return {
    id: student.id,
    first_name: firstName,
    last_name: lastName,
    full_name: student.full_name,
    email: student.email ?? null,
    class_grade: normalizeClassGrade(student.class_grade),
    created_at: student.created_at,
    is_active: student.is_active ?? true,
    suspended_reason: student.suspended_reason ?? null,
    submission_count: submissionCount
  };
}

function compareStudents(a: StudentListItem, b: StudentListItem) {
  const last = a.last_name.localeCompare(b.last_name, undefined, { sensitivity: 'base' });
  if (last !== 0) return last;
  return a.first_name.localeCompare(b.first_name, undefined, { sensitivity: 'base' });
}

export function groupStudentsByGrade(students: StudentListItem[]) {
  const groups: Record<ClassGrade, StudentListItem[]> = {
    'Grade 1': [],
    'Grade 2': [],
    'Grade 3': []
  };
  const unassigned: StudentListItem[] = [];

  for (const student of students) {
    if (student.class_grade) {
      groups[student.class_grade].push(student);
    } else {
      unassigned.push(student);
    }
  }

  for (const grade of CLASS_GRADES) {
    groups[grade].sort(compareStudents);
  }
  unassigned.sort(compareStudents);

  return { groups, unassigned };
}

export function filterStudentsByGradeView<T extends { class_grade: ClassGrade | null }>(
  students: T[],
  view: 'all' | ClassGrade | 'unassigned'
) {
  if (view === 'all') return students;
  if (view === 'unassigned') return students.filter((student) => !student.class_grade);
  return students.filter((student) => student.class_grade === view);
}
