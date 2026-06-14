import type { SupabaseClient, User } from '@supabase/supabase-js';
import { ensureTeacherProfileRole, isTeacherProfile } from './auth';
import { formatDatabaseError } from './supabaseErrors';

export async function prepareTeacherAccount(supabase: SupabaseClient, user: User) {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'teacher@example.com';

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(formatDatabaseError(profileError.message));
  }

  await ensureTeacherProfileRole(supabase, user.id, user.email, adminEmail, profile?.role);

  const { data: updatedProfile, error: refreshError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (refreshError) {
    throw new Error(formatDatabaseError(refreshError.message));
  }

  if (!isTeacherProfile(updatedProfile, user.email, adminEmail)) {
    throw new Error(
      'Only teachers can upload reading materials. In Supabase, run: update public.profiles set role = \'Teacher\' where email = your login email; then log out and back in.'
    );
  }
}
