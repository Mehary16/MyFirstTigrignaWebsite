import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { UserRole } from './routes';
import { createAdminSupabaseClient } from './supabaseAdmin';

export type ProfileRow = {
  full_name: string;
  role: string;
  is_active?: boolean | null;
  suspended_reason?: string | null;
};

const VALID_ROLES: UserRole[] = ['Teacher', 'Student', 'Parent'];

/** Server-only teacher bootstrap email (not exposed to the browser). */
export function getAdminEmail() {
  return (
    process.env.ADMIN_EMAIL ??
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ??
    'teacher@example.com'
  ).toLowerCase();
}

export function isTeacherEmail(email: string | undefined | null) {
  return (email ?? '').toLowerCase() === getAdminEmail();
}

export function normalizeRole(value: string | undefined | null): UserRole | null {
  if (!value) return null;
  const normalized =
    value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return VALID_ROLES.includes(normalized as UserRole) ? (normalized as UserRole) : null;
}

/** Authoritative role for access control — never trusts user_metadata. */
export function resolveRoleFromAuth(
  user: { email?: string | null; app_metadata?: Record<string, unknown> | null },
  profileRole?: string | null
): UserRole {
  const appRole = normalizeRole(user.app_metadata?.role as string | undefined);
  if (appRole) return appRole;

  const dbRole = normalizeRole(profileRole);
  if (dbRole) return dbRole;

  if (isTeacherEmail(user.email)) {
    return 'Teacher';
  }

  return 'Student';
}

export async function fetchProfileRole(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  return profile?.role ?? null;
}

export async function getUserRole(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null; app_metadata?: Record<string, unknown> | null }
): Promise<UserRole> {
  const profileRole = await fetchProfileRole(supabase, user.id);
  return resolveRoleFromAuth(user, profileRole);
}

export function isTeacherRole(role: string | null | undefined) {
  return role === 'Teacher';
}

export function isTeacherUser(
  profile: { role?: string | null } | null | undefined,
  user?: { app_metadata?: Record<string, unknown> | null; email?: string | null } | null
) {
  return isTeacherRole(resolveRoleFromAuth(user ?? { email: null, app_metadata: {} }, profile?.role));
}

/**
 * Sync profiles.role and auth app_metadata.role (server-only, service role).
 * app_metadata is the authoritative JWT claim for middleware and routing.
 */
export async function syncUserRole(
  userId: string,
  options?: {
    accountType?: 'Student' | 'Parent';
    fullName?: string;
  }
): Promise<{ role: UserRole | null; error?: string }> {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    return { role: null, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' };
  }

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !userData.user) {
    return { role: null, error: userError?.message ?? 'User not found.' };
  }

  const user = userData.user;
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('role, full_name, is_active')
    .eq('id', userId)
    .maybeSingle();

  let role: UserRole;

  if (isTeacherEmail(user.email)) {
    role = 'Teacher';
  } else if (normalizeRole(existingProfile?.role)) {
    role = normalizeRole(existingProfile!.role)!;
  } else if (options?.accountType) {
    role = options.accountType;
  } else if (user.user_metadata?.created_by_teacher) {
    role = 'Student';
  } else {
    const signupHint = normalizeRole(user.user_metadata?.role as string | undefined);
    role = signupHint === 'Parent' ? 'Parent' : 'Student';
  }

  const fullName =
    options?.fullName ??
    existingProfile?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split('@')[0] ??
    'User';

  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    full_name: fullName,
    role,
    email: user.email?.trim().toLowerCase() ?? null,
    is_active: existingProfile?.is_active ?? true
  });

  if (profileError) {
    return { role: null, error: profileError.message };
  }

  const { error: metadataError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role }
  });

  if (metadataError) {
    return { role: null, error: metadataError.message };
  }

  return { role };
}
