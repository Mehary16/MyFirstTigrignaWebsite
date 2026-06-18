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
    return NextResponse.json({ error: 'Only active students can edit homework.' }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    notes?: string | null;
    mediaUrl?: string | null;
    fileName?: string | null;
    removeOldFile?: boolean;
  };

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: 'Submission id is required.' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('submissions')
    .select('id, student_id, video_url, submission_type, file_name')
    .eq('id', id)
    .maybeSingle();

  if (!existing || existing.student_id !== user.id) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
  }

  const submissionType = existing.submission_type ?? 'link';
  const mediaUrl = body.mediaUrl?.trim() || null;
  const notes = body.notes?.trim() || null;

  if (submissionType === 'link' && !mediaUrl) {
    return NextResponse.json({ error: 'Please provide a video or media link.' }, { status: 400 });
  }

  if (submissionType !== 'link' && body.removeOldFile && !mediaUrl) {
    return NextResponse.json({ error: 'Please upload a replacement file.' }, { status: 400 });
  }

  if (body.removeOldFile && mediaUrl && existing.video_url && existing.video_url !== mediaUrl) {
    try {
      await deleteStudentSubmissionFile(supabase, existing.video_url);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Could not remove the previous file.' },
        { status: 500 }
      );
    }
  }

  const { data, error } = await supabase
    .from('submissions')
    .update({
      notes,
      video_url: mediaUrl ?? existing.video_url,
      file_name: submissionType === 'link' ? null : body.fileName?.trim() || existing.file_name
    })
    .eq('id', id)
    .eq('student_id', user.id)
    .select('id, video_url, submission_type, file_name, notes, created_at');

  if (error) {
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  const submission = data?.[0];
  if (!submission) {
    return NextResponse.json(
      {
        error:
          'Could not save changes. Run supabase/FIX_SUBMISSIONS_MANAGE.sql in the Supabase SQL Editor, then try again.'
      },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, submission });
}
