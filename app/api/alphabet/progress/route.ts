import { NextResponse } from 'next/server';
import type { AlphabetProgress } from '../../../../lib/alphabetProgress';
import { progressFromRow, progressToRow } from '../../../../lib/alphabetProgressDb';
import { getUserRole } from '../../../../lib/roleAuth';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

function isAlphabetLearner(role: string) {
  return role === 'Student' || role === 'Teacher';
}

export async function GET() {
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

  const { data, error } = await supabase.from('alphabet_progress').select('*').eq('user_id', user.id).maybeSingle();

  if (error) {
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ progress: progressFromRow(data) });
}

export async function PATCH(request: Request) {
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

  const body = (await request.json()) as { progress?: AlphabetProgress };
  if (!body.progress) {
    return NextResponse.json({ error: 'Progress payload is required.' }, { status: 400 });
  }

  const row = progressToRow(user.id, {
    ...body.progress,
    updatedAt: new Date().toISOString()
  });

  const { data, error } = await supabase
    .from('alphabet_progress')
    .upsert(row, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ progress: progressFromRow(data) });
}
