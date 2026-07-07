import { NextResponse } from 'next/server';
import { formatCombinedNotificationStatus, notifyStudentOfGrade } from '../../../lib/contentNotifications';
import { createStudentGradeNotification } from '../../../lib/inAppNotifications';
import { isTeacherUser } from '../../../lib/auth';
import { formatDatabaseError } from '../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

type CreateGradeBody = {
  studentId?: string;
  title?: string;
  grade?: string;
  feedback?: string | null;
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
    return NextResponse.json({ error: 'Only teachers can post grades.' }, { status: 403 });
  }

  const body = (await request.json()) as CreateGradeBody;
  const studentId = body.studentId?.trim();
  const title = body.title?.trim();
  const grade = body.grade?.trim();

  if (!studentId || !title || !grade) {
    return NextResponse.json({ error: 'Student, assignment title, and grade are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('grades')
    .insert({
      student_id: studentId,
      teacher_id: user.id,
      title,
      grade,
      feedback: body.feedback?.trim() || null
    })
    .select('id, student_id, title, grade, feedback, created_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: formatDatabaseError(error?.message) }, { status: 500 });
  }

  const emailNotifications = await notifyStudentOfGrade(supabase, studentId, {
    title,
    grade,
    feedback: data.feedback
  });

  const inAppNotifications = await createStudentGradeNotification({
    studentId,
    gradeId: data.id,
    title,
    grade,
    feedback: data.feedback
  });

  return NextResponse.json({
    success: true,
    grade: data,
    emailNotifications,
    inAppNotifications,
    notificationMessage: formatCombinedNotificationStatus(
      emailNotifications,
      inAppNotifications,
      'Grade saved'
    )
  });
}
