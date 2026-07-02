import type { ProfileRow } from './roleAuth';
import { isTeacherUser } from './roleAuth';

export type { ProfileRow };

export {
  getAdminEmail,
  getUserRole,
  isTeacherEmail,
  isTeacherUser,
  normalizeRole,
  resolveRoleFromAuth,
  syncUserRole
} from './roleAuth';

export function isStudentSuspended(profile: Pick<ProfileRow, 'is_active'> | null | undefined) {
  return profile?.is_active === false;
}

export function isTeacherProfile(
  profile: Pick<ProfileRow, 'role'> | null | undefined,
  _email?: string | undefined,
  _adminEmail?: string,
  user?: { app_metadata?: Record<string, unknown> } | null
) {
  return isTeacherUser(profile, user);
}

/** @deprecated Role sync runs via syncUserRole on login/callback. */
export async function ensureTeacherProfileRole() {
  // Intentionally empty — kept for call-site compatibility during migration.
}
