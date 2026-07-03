import type { SupabaseClient } from '@supabase/supabase-js';
import { dashboardPathForRole } from './routes';
import { getUserRole, syncUserRole } from './roleAuth';

export async function resolveDashboardPath(
  supabase: SupabaseClient,
  userId: string,
  user: { email?: string; app_metadata?: Record<string, unknown> }
) {
  const role = await getUserRole(supabase, { id: userId, email: user.email, app_metadata: user.app_metadata });

  if (role === 'Student') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.is_active === false) {
      return '/suspended';
    }
  }

  return dashboardPathForRole(role);
}

export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();

  if (existingProfile) {
    await syncUserRole(user.id);
    return;
  }

  const metaRole = (user.user_metadata?.role as string | undefined)?.toLowerCase();
  const accountType = metaRole === 'parent' ? 'Parent' : 'Student';

  await syncUserRole(user.id, {
    accountType,
    fullName: (user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? 'Student'
  });
}
