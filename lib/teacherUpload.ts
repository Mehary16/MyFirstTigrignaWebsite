import type { SupabaseClient, User } from '@supabase/supabase-js';
import { isTeacherUser } from './auth';
import { formatDatabaseError } from './supabaseErrors';

export async function prepareTeacherAccount(supabase: SupabaseClient, user: User) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(formatDatabaseError(profileError.message));
  }

  if (!isTeacherUser(profile, user)) {
    throw new Error(
      'Only teachers can upload reading materials. Ask an administrator to assign the Teacher role, then log out and back in.'
    );
  }
}
