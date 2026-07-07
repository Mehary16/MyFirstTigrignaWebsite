import { NextResponse } from 'next/server';
import { createTeacherSubmissionNotifications } from '../../../../lib/inAppNotifications';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { getAuthenticatedStudentContext } from '../../../../lib/studentSubmissionsApi';

type CreateSubmissionBody = {
  videoUrl?: string;
  submissionType?: string;
  fileName?: string | null;
  notes?: string | null;
  assignmentId?: string | null;
};

export async function POST(request: Request) {
  const auth = await getAuthenticatedStudentContext();
  if ('error' in auth && auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth;
  const body = (await request.json()) as CreateSubmissionBody;
  const videoUrl = body.videoUrl?.trim();

  if (!videoUrl) {
    return NextResponse.json({ error: 'Submission media URL is required.' }, { status: 400 });
  }

  const submissionType = body.submissionType?.trim() || 'link';
  const assignmentId = body.assignmentId?.trim() || null;

  const basePayload = {
    student_id: user.id,
    video_url: videoUrl,
    submission_type: submissionType,
    file_name: body.fileName?.trim() || null,
    notes: body.notes?.trim() || null
  };

  const payloadWithAssignment = assignmentId ? { ...basePayload, assignment_id: assignmentId } : basePayload;

  let { data, error } = await supabase
    .from('submissions')
    .insert([payloadWithAssignment])
    .select('id')
    .single();

  if (error?.message.includes('assignment_id') && assignmentId) {
  ({ data, error } = await supabase.from('submissions').insert([basePayload]).select('id').single());
  }

  if (error || !data) {
    return NextResponse.json({ error: formatDatabaseError(error?.message) }, { status: 500 });
  }

  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  let assignmentTitle: string | null = null;
  if (assignmentId) {
    const { data: assignment } = await supabase.from('assignments').select('title').eq('id', assignmentId).maybeSingle();
    assignmentTitle = assignment?.title ?? null;
  }

  await createTeacherSubmissionNotifications(supabase, {
    submissionId: data.id,
    studentName: studentProfile?.full_name || user.user_metadata?.full_name || 'A student',
    assignmentTitle
  });

  return NextResponse.json({ success: true, id: data.id });
}
