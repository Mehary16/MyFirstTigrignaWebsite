import type { SupabaseClient } from '@supabase/supabase-js';
import { dashboardPathForRole } from './routes';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'teacher@example.com';

export async function resolveDashboardPath(
  supabase: SupabaseClient,
  userId: string,
  email: string | undefined,
  metadataRole?: string
) {
  const lowerEmail = email?.toLowerCase() ?? '';
  if (lowerEmail === ADMIN_EMAIL.toLowerCase() || metadataRole?.toLowerCase() === 'teacher') {
    return '/teacher/dashboard';
  }

  const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', userId).maybeSingle();
  if (profile?.role === 'Teacher') {
    return '/teacher/dashboard';
  }

  if (profile?.role === 'Parent') {
    return '/parent/dashboard';
  }

  if (profile?.is_active === false) {
    return '/suspended';
  }

  return dashboardPathForRole(profile?.role);
}

export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();

  if (existingProfile) return;

  const metaRole = (user.user_metadata?.role as string | undefined)?.toLowerCase();
  const role =
    user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      ? 'Teacher'
      : metaRole === 'parent'
        ? 'Parent'
        : 'Student';

  await supabase.from('profiles').upsert({
    id: user.id,
    full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? 'Student',
    role,
    email: user.email?.trim().toLowerCase(),
    is_active: true
  });
}
