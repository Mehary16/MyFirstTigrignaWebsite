import { NextResponse } from 'next/server';
import { deleteStudentSubmissionFile } from '../../../../lib/submissionMedia';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'Student' || profile.is_active === false) {
    return NextResponse.json({ error: 'Only active students can delete homework.' }, { status: 403 });
  }

  const body = (await request.json()) as { id?: string };
  const id = body.id?.trim();

  if (!id) {
    return NextResponse.json({ error: 'Submission id is required.' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('submissions')
    .select('id, student_id, video_url')
    .eq('id', id)
    .maybeSingle();

  if (!existing || existing.student_id !== user.id) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
  }

  try {
    await deleteStudentSubmissionFile(supabase, existing.video_url);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not remove the uploaded file.' },
      { status: 500 }
    );
  }

  const { error } = await supabase.from('submissions').delete().eq('id', id).eq('student_id', user.id);

  if (error) {
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
