export type ProfileRow = {
  full_name: string;
  role: string;
  is_active?: boolean | null;
  suspended_reason?: string | null;
};

export function isTeacherEmail(email: string | undefined, adminEmail: string) {
  return (email ?? '').toLowerCase() === adminEmail.toLowerCase();
}

export function isTeacherProfile(profile: Pick<ProfileRow, 'role'> | null | undefined, email: string | undefined, adminEmail: string) {
  return profile?.role === 'Teacher' || isTeacherEmail(email, adminEmail);
}

export function isStudentSuspended(profile: Pick<ProfileRow, 'is_active'> | null | undefined) {
  return profile?.is_active === false;
}
