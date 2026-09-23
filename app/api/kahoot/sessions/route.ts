import { NextResponse } from 'next/server';
import { isTeacherUser } from '../../../../lib/auth';
import { buildFidelBookQuestionBank } from '../../../../lib/kahoot/fidelBookQuestions';
import { saveSessionQuestions } from '../../../../lib/kahoot/loadSessionQuestions';
import { generatePin } from '../../../../lib/kahoot/liveSession';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

function isMissingKahootTable(message: string) {
  return (
    message.includes('kahoot_live') &&
    (message.includes('does not exist') ||
      message.includes('Could not find the table') ||
      message.includes('schema cache'))
  );
}

function kahootSetupMessage() {
  return 'Run supabase/FIX_KAHOOT_LIVE.sql in the Supabase SQL Editor, then refresh and try again.';
}

export async function GET(request: Request) {
  const pin = new URL(request.url).searchParams.get('pin')?.trim();
  if (!pin || !/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: 'Enter a valid 6-digit game PIN.' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const { data: session, error } = await supabase
    .from('kahoot_live_sessions')
    .select('id, pin, title, status, question_index, question_ends_at, host_id')
    .eq('pin', pin)
    .maybeSingle();

  if (error) {
    if (isMissingKahootTable(error.message)) {
      return NextResponse.json({ error: kahootSetupMessage() }, { status: 503 });
    }
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'No game found for that PIN. Check with your teacher.' }, { status: 404 });
  }

  if (session.status === 'finished') {
    return NextResponse.json({ error: 'This game has already ended.' }, { status: 410 });
  }

  return NextResponse.json({ session });
}

type CreateBody = {
  title?: string;
  questionCount?: number;
  familyId?: string;
};

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!isTeacherUser(profile, user)) {
    return NextResponse.json({ error: 'Only teachers can host a live quiz.' }, { status: 403 });
  }

  let body: CreateBody = {};
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    body = {};
  }

  const title = (body.title?.trim() || 'Tigrigna Fidel Live Quiz').slice(0, 120);
  const questions = buildFidelBookQuestionBank({
    count: body.questionCount,
    familyId: body.familyId
  });

  if (questions.length === 0) {
    return NextResponse.json({ error: 'Could not build questions for this quiz.' }, { status: 400 });
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const pin = generatePin();
    const { data, error } = await supabase
      .from('kahoot_live_sessions')
      .insert({
        host_id: user.id,
        pin,
        title,
        status: 'lobby',
        question_index: -1
      })
      .select('id, pin, title, status, question_index, host_id')
      .single();

    if (!error && data) {
      const saved = await saveSessionQuestions(data.id, questions, supabase);
      if (saved.error) {
        await supabase.from('kahoot_live_sessions').delete().eq('id', data.id);
        return NextResponse.json({ error: formatDatabaseError(saved.error) }, { status: 500 });
      }
      return NextResponse.json({ session: data });
    }

    if (isMissingKahootTable(error.message)) {
      return NextResponse.json({ error: kahootSetupMessage() }, { status: 503 });
    }

    if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
      return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Could not generate a unique PIN. Try again.' }, { status: 500 });
}
