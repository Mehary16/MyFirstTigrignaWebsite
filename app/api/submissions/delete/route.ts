import { NextResponse } from 'next/server';
import { deleteStudentSubmissionFile } from '../../../../lib/submissionMedia';
import { getAuthenticatedStudentContext, getOwnedSubmission } from '../../../../lib/studentSubmissionsApi';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';

export async function POST(request: Request) {
  const auth = await getAuthenticatedStudentContext();
  if ('error' in auth && auth.error) return auth.error;

  const { db, user } = auth;

  const body = (await request.json()) as { id?: string };
  const id = body.id?.trim();

  if (!id) {
    return NextResponse.json({ error: 'Submission id is required.' }, { status: 400 });
  }

  const owned = await getOwnedSubmission(db, id, user);
  if ('error' in owned && owned.error) return owned.error;

  const existing = owned.existing!;

  try {
    await deleteStudentSubmissionFile(db, existing.video_url);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not remove the uploaded file.' },
      { status: 500 }
    );
  }

  const { data, error } = await db
    .from('submissions')
    .delete()
    .eq('id', id)
    .eq('student_id', user.id)
    .select('id');

  if (error) {
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  if (!data?.length) {
    return NextResponse.json(
      {
        error:
          'Could not delete homework. Run supabase/FIX_SUBMISSIONS_MANAGE.sql in the Supabase SQL Editor, then try again.'
      },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true });
}
