import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createAdminSupabaseClient } from './supabaseAdmin';
import { formatDatabaseError } from './supabaseErrors';
import { createServerSupabaseClient } from './supabaseServer';
export async function getAuthenticatedStudentContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'You must be logged in.' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.is_active === false) {
    return { error: NextResponse.json({ error: 'Your account is suspended.' }, { status: 403 }) };
  }

  if (profile?.role && profile.role !== 'Student') {
    return { error: NextResponse.json({ error: 'Only students can manage homework.' }, { status: 403 }) };
  }

  const admin = createAdminSupabaseClient();
  const db = admin ?? supabase;

  return { supabase, db, user, profile };
}

export async function getOwnedSubmission(db: SupabaseClient, submissionId: string, user: User) {
  const { data: existing, error } = await db
    .from('submissions')
    .select('id, student_id, video_url, submission_type, file_name')
    .eq('id', submissionId)
    .maybeSingle();

  if (error) {
    return { error: NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 }) };
  }

  if (!existing || existing.student_id !== user.id) {
    return { error: NextResponse.json({ error: 'Submission not found.' }, { status: 404 }) };
  }

  return { existing };
}
