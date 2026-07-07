import { NextResponse } from 'next/server';
import { formatCombinedNotificationStatus, notifyStudentOfGrade } from '../../../../lib/contentNotifications';
import { createStudentGradeNotification } from '../../../../lib/inAppNotifications';
import { isTeacherUser } from '../../../../lib/auth';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

type UpdateGradeBody = {
  grade?: string;
  feedback?: string | null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!isTeacherUser(profile, user)) {
    return NextResponse.json({ error: 'Only teachers can update grades.' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as UpdateGradeBody;
  const grade = body.grade?.trim();

  if (!grade) {
    return NextResponse.json({ error: 'Grade is required.' }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from('grades')
    .select('id, student_id, title, grade, feedback')
    .eq('id', id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: formatDatabaseError(existingError.message) }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: 'Grade not found.' }, { status: 404 });
  }

  const feedback = body.feedback?.trim() || null;

  const { data, error } = await supabase
    .from('grades')
    .update({
      grade,
      feedback,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, student_id, title, grade, feedback, created_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: formatDatabaseError(error?.message) }, { status: 500 });
  }

  const emailNotifications = await notifyStudentOfGrade(supabase, data.student_id, {
    title: data.title,
    grade: data.grade,
    feedback: data.feedback,
    updated: true
  });

  const inAppNotifications = await createStudentGradeNotification({
    studentId: data.student_id,
    gradeId: data.id,
    title: data.title,
    grade: data.grade,
    feedback: data.feedback,
    updated: true
  });

  return NextResponse.json({
    success: true,
    grade: data,
    emailNotifications,
    inAppNotifications,
    notificationMessage: formatCombinedNotificationStatus(
      emailNotifications,
      inAppNotifications,
      'Grade updated'
    )
  });
}
