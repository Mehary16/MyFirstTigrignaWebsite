import { NextResponse } from 'next/server';
import { formatCombinedNotificationStatus, notifyStudentOfGrade } from '../../../../lib/contentNotifications';
import { createStudentGradeNotification } from '../../../../lib/inAppNotifications';
import { isTeacherUser } from '../../../../lib/auth';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

type UpdateGradeBody = {
  title?: string;
  grade?: string;
  feedback?: string | null;
  gradedAt?: string | null;
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
  const title = body.title?.trim();
  const grade = body.grade?.trim();

  if (!title || !grade) {
    return NextResponse.json({ error: 'Assignment title and grade are required.' }, { status: 400 });
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

  let createdAt: string | undefined;
  if (body.gradedAt?.trim()) {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(body.gradedAt.trim());
    if (!dateMatch) {
      return NextResponse.json({ error: 'Date must be YYYY-MM-DD.' }, { status: 400 });
    }
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Date is invalid.' }, { status: 400 });
    }
    createdAt = parsed.toISOString();
  }

  const { data, error } = await supabase
    .from('grades')
    .update({
      title,
      grade,
      feedback,
      ...(createdAt ? { created_at: createdAt } : {}),
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
