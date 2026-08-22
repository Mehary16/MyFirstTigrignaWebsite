import { NextResponse } from 'next/server';
import type { AlphabetActivityType } from '../../../../lib/alphabetProgressDb';
import { isTeacherUser } from '../../../../lib/auth';
import { getUserRole } from '../../../../lib/roleAuth';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

const ACTIVITY_TYPES = new Set<AlphabetActivityType>(['learn', 'trace', 'quiz_answer', 'quiz_start']);

function isAlphabetLearner(role: string) {
  return role === 'Student' || role === 'Teacher';
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!isTeacherUser(profile, user)) {
    return NextResponse.json({ error: 'Only teachers can view alphabet activity reports.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 80), 200);
  const activityType = url.searchParams.get('type');

  let query = supabase
    .from('alphabet_activity')
    .select(
      'id, user_id, activity_type, form_key, family_id, correct, metadata, created_at, profiles(full_name, email, class_grade)'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (activityType && ACTIVITY_TYPES.has(activityType as AlphabetActivityType)) {
    query = query.eq('activity_type', activityType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ activities: data ?? [] });
}

type ActivityBody = {
  activityType?: AlphabetActivityType;
  formKey?: string;
  familyId?: string;
  correct?: boolean;
  metadata?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const role = await getUserRole(supabase, user);
  if (!isAlphabetLearner(role)) {
    return NextResponse.json({ error: 'Alphabet practice is for students and teachers only.' }, { status: 403 });
  }

  const body = (await request.json()) as ActivityBody;
  const activityType = body.activityType;

  if (!activityType || !ACTIVITY_TYPES.has(activityType)) {
    return NextResponse.json({ error: 'A valid activity type is required.' }, { status: 400 });
  }

  const { error } = await supabase.from('alphabet_activity').insert({
    user_id: user.id,
    activity_type: activityType,
    form_key: body.formKey?.trim() || null,
    family_id: body.familyId?.trim() || null,
    correct: typeof body.correct === 'boolean' ? body.correct : null,
    metadata: body.metadata ?? {}
  });

  if (error) {
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
