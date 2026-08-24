import { NextResponse } from 'next/server';
import { deleteAlphabetActivities } from '../../../../../lib/alphabetActivityManage';
import { isTeacherUser } from '../../../../../lib/auth';
import { createAdminSupabaseClient } from '../../../../../lib/supabaseAdmin';
import { createServerSupabaseClient } from '../../../../../lib/supabaseServer';

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
    return NextResponse.json({ error: 'Only teachers can manage alphabet activity.' }, { status: 403 });
  }

  const body = (await request.json()) as { ids?: string[] };
  const admin = createAdminSupabaseClient();
  const db = admin ?? supabase;

  const result = await deleteAlphabetActivities(db, body.ids ?? []);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    success: true,
    deletedCount: result.deletedCount,
    deletedIds: result.deletedIds
  });
}
