import { NextResponse } from 'next/server';
import { isTeacherUser } from './auth';
import { createServerSupabaseClient } from './supabaseServer';

export async function requireTeacherApi() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'You must be logged in.' }, { status: 401 }) };
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!isTeacherUser(profile, user)) {
    return { error: NextResponse.json({ error: 'Only teachers can manage lessons.' }, { status: 403 }) };
  }

  return { supabase, user };
}
