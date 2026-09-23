import { NextResponse } from 'next/server';
import { formatDatabaseError } from '../../../../../../lib/supabaseErrors';
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

  let nickname = '';
  try {
    const body = (await request.json()) as { nickname?: string };
    nickname = body.nickname?.trim() ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (nickname.length < 2 || nickname.length > 24) {
    return NextResponse.json({ error: 'Nickname must be 2–24 characters.' }, { status: 400 });
  }

  const { data: session } = await supabase
    .from('kahoot_live_sessions')
    .select('id, status')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
  }

  if (session.status !== 'lobby') {
    return NextResponse.json({ error: 'This game has already started. Ask your teacher to wait in the lobby.' }, { status: 409 });
  }

  const { data: existing } = await supabase
    .from('kahoot_live_players')
    .select('id, nickname, score')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ player: existing });
  }

  const { data: player, error } = await supabase
    .from('kahoot_live_players')
    .insert({
      session_id: sessionId,
      user_id: user.id,
      nickname
    })
    .select('id, nickname, score')
    .single();

  if (error) {
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return NextResponse.json({ error: 'That nickname is taken. Choose another.' }, { status: 409 });
    }
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ player });
}
