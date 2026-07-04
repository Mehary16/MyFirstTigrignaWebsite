import { splitFullName } from './studentNames';
import { normalizeClassGrade, type ClassGrade } from './classGrades';

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
