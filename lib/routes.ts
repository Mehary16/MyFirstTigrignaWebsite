export type UserRole = 'Teacher' | 'Student' | 'Parent';

export function dashboardPathForRole(role: string | undefined | null) {
  switch (role) {
    case 'Teacher':
      return '/teacher/dashboard';
    case 'Parent':
      return '/parent/dashboard';
    default:
      return '/student/dashboard';
  }
}

export function alphabetPathForRole(role: string | undefined | null) {
  switch (role) {
    case 'Teacher':
      return '/teacher/alphabet';
    case 'Student':
      return '/student/alphabet';
    default:
      return '/parent/dashboard';
  }
}
