import { NextResponse } from 'next/server';
import { loadSessionQuestions } from '../../../../../../lib/kahoot/loadSessionQuestions';
import { scoreForAnswer } from '../../../../../../lib/kahoot/liveSession';
import { formatDatabaseError } from '../../../../../../lib/supabaseErrors';
import { createAdminSupabaseClient } from '../../../../../../lib/supabaseAdmin';
import { createServerSupabaseClient } from '../../../../../../lib/supabaseServer';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id: sessionId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  let playerId = '';
  let choiceIndex = -1;
  try {
    const body = (await request.json()) as { playerId?: string; choiceIndex?: number };
    playerId = body.playerId?.trim() ?? '';
    choiceIndex = typeof body.choiceIndex === 'number' ? body.choiceIndex : -1;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!playerId || choiceIndex < 0) {
    return NextResponse.json({ error: 'playerId and choiceIndex are required.' }, { status: 400 });
  }

  const { data: player } = await supabase
    .from('kahoot_live_players')
    .select('id, user_id, score, session_id')
    .eq('id', playerId)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (!player || player.user_id !== user.id) {
    return NextResponse.json({ error: 'Invalid player for this game.' }, { status: 403 });
  }

  const { data: session } = await supabase
    .from('kahoot_live_sessions')
    .select('status, question_index, question_ends_at')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session || session.status !== 'question') {
    return NextResponse.json({ error: 'Answers are closed for this question.' }, { status: 409 });
  }

  const { questions, error: questionsError } = await loadSessionQuestions(sessionId, supabase);
  if (questionsError) {
    return NextResponse.json({ error: formatDatabaseError(questionsError) }, { status: 503 });
  }

  const question = questions[session.question_index];
  if (!question) {
    return NextResponse.json({ error: 'No active question.' }, { status: 400 });
  }

  if (choiceIndex >= question.choices.length) {
    return NextResponse.json({ error: 'Invalid choice.' }, { status: 400 });
  }

  if (session.question_ends_at && new Date(session.question_ends_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Time is up for this question.' }, { status: 409 });
  }

  const { data: prior } = await supabase
    .from('kahoot_live_answers')
    .select('id')
    .eq('session_id', sessionId)
    .eq('player_id', playerId)
    .eq('question_index', session.question_index)
    .maybeSingle();

  if (prior) {
    return NextResponse.json({ error: 'You already answered this question.' }, { status: 409 });
  }

  const correct = choiceIndex === question.correctIndex;
  const points = scoreForAnswer(correct, session.question_ends_at);

  const admin = createAdminSupabaseClient();
  const db = admin ?? supabase;

  const { error: answerError } = await db.from('kahoot_live_answers').insert({
    session_id: sessionId,
    player_id: playerId,
    question_index: session.question_index,
    choice_index: choiceIndex,
    correct,
    points
  });

  if (answerError) {
    return NextResponse.json({ error: formatDatabaseError(answerError.message) }, { status: 500 });
  }

  if (points > 0) {
    await db
      .from('kahoot_live_players')
      .update({ score: player.score + points })
      .eq('id', playerId);
  }

  return NextResponse.json({ accepted: true });
}
