import { NextResponse } from 'next/server';
import type { KahootQuestion } from '../../../../../lib/kahoot/fidelBookQuestions';
import { loadSessionQuestions } from '../../../../../lib/kahoot/loadSessionQuestions';
import { sanitizeQuestionForClient } from '../../../../../lib/kahoot/publicQuestion';
import { QUESTION_SECONDS } from '../../../../../lib/kahoot/liveSession';
import { formatDatabaseError } from '../../../../../lib/supabaseErrors';
import { createAdminSupabaseClient } from '../../../../../lib/supabaseAdmin';
import { createServerSupabaseClient } from '../../../../../lib/supabaseServer';

type RouteContext = { params: Promise<{ id: string }> };

function isMissingKahootTable(message: string) {
  return message.includes('kahoot_live') && message.includes('Could not find the table');
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
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
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
  }

  const { questions, error: questionsError } = await loadSessionQuestions(id, supabase);
  if (questionsError) {
    return NextResponse.json({ error: formatDatabaseError(questionsError) }, { status: 503 });
  }

  const { data: players } = await supabase
    .from('kahoot_live_players')
    .select('id, nickname, score, user_id')
    .eq('session_id', id)
    .order('score', { ascending: false })
    .order('joined_at', { ascending: true });

  const isHost = session.host_id === user.id;
  const revealAnswers = session.status === 'reveal' || session.status === 'finished';
  const questionIndex = session.question_index;
  let answerCounts: number[] = [];
  let myChoiceIndex: number | null = null;

  const currentRaw = questionIndex >= 0 ? questions[questionIndex] ?? null : null;

  if (currentRaw && questionIndex >= 0 && (session.status === 'question' || session.status === 'reveal')) {
    if (isHost && session.status === 'reveal') {
      answerCounts = new Array(currentRaw.choices.length).fill(0);
      const { data: answers } = await supabase
        .from('kahoot_live_answers')
        .select('choice_index')
        .eq('session_id', id)
        .eq('question_index', questionIndex);

      for (const row of answers ?? []) {
        if (row.choice_index >= 0 && row.choice_index < answerCounts.length) {
          answerCounts[row.choice_index]! += 1;
        }
      }
    }

    if (!isHost) {
      const { data: myPlayer } = await supabase
        .from('kahoot_live_players')
        .select('id')
        .eq('session_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (myPlayer) {
        const { data: myAnswer } = await supabase
          .from('kahoot_live_answers')
          .select('choice_index')
          .eq('session_id', id)
          .eq('player_id', myPlayer.id)
          .eq('question_index', questionIndex)
          .maybeSingle();

        if (myAnswer && typeof myAnswer.choice_index === 'number') {
          myChoiceIndex = myAnswer.choice_index;
        }
      }
    }
  }

  const currentQuestion = currentRaw
    ? sanitizeQuestionForClient(currentRaw, { revealAnswers })
    : null;

  return NextResponse.json({
    session: {
      id: session.id,
      pin: session.pin,
      title: session.title,
      status: session.status,
      question_index: session.question_index,
      questionCount: questions?.length ?? 0,
      question_ends_at: session.question_ends_at
    },
    currentQuestion,
    players: players ?? [],
    answerCounts: isHost ? answerCounts : [],
    myChoiceIndex,
    isHost
  });
}

type PatchBody = {
  action?: 'start' | 'next' | 'reveal' | 'finish';
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const { data: session, error: loadError } = await supabase
    .from('kahoot_live_sessions')
    .select('id, host_id, status, question_index')
    .eq('id', id)
    .maybeSingle();

  if (loadError || !session) {
    return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
  }

  if (session.host_id !== user.id) {
    return NextResponse.json({ error: 'Only the host can control this game.' }, { status: 403 });
  }

  const { questions, error: questionsError } = await loadSessionQuestions(id, supabase);
  if (questionsError) {
    return NextResponse.json({ error: formatDatabaseError(questionsError) }, { status: 503 });
  }

  let body: PatchBody = {};
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const questionCount = questions.length;
  let nextStatus = session.status;
  let nextIndex = session.question_index;
  let questionEndsAt: string | null = null;

  switch (body.action) {
    case 'start':
      if (session.status !== 'lobby') {
        return NextResponse.json({ error: 'Game already started.' }, { status: 400 });
      }
      nextIndex = 0;
      nextStatus = 'question';
      questionEndsAt = new Date(Date.now() + QUESTION_SECONDS * 1000).toISOString();
      break;
    case 'next': {
      if (session.status === 'reveal') {
        const following = session.question_index + 1;
        if (following >= questionCount) {
          nextStatus = 'finished';
          nextIndex = session.question_index;
          questionEndsAt = null;
        } else {
          nextIndex = following;
          nextStatus = 'question';
          questionEndsAt = new Date(Date.now() + QUESTION_SECONDS * 1000).toISOString();
        }
      } else if (session.status === 'question') {
        nextStatus = 'reveal';
        questionEndsAt = null;
      } else {
        return NextResponse.json({ error: 'Cannot advance from this state.' }, { status: 400 });
      }
      break;
    }
    case 'reveal':
      if (session.status !== 'question') {
        return NextResponse.json({ error: 'No active question to reveal.' }, { status: 400 });
      }
      nextStatus = 'reveal';
      questionEndsAt = null;
      break;
    case 'finish':
      nextStatus = 'finished';
      questionEndsAt = null;
      break;
    default:
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const client = admin ?? supabase;

  const { data: updated, error: updateError } = await client
    .from('kahoot_live_sessions')
    .update({
      status: nextStatus,
      question_index: nextIndex,
      question_ends_at: questionEndsAt
    })
    .eq('id', id)
    .select('id, status, question_index, question_ends_at')
    .single();

  if (updateError) {
    if (isMissingKahootTable(updateError.message)) {
      return NextResponse.json(
        { error: 'Run supabase/FIX_KAHOOT_LIVE.sql in the Supabase SQL Editor.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: formatDatabaseError(updateError.message) }, { status: 500 });
  }

  return NextResponse.json({ session: updated });
}
