import { NextResponse } from 'next/server';
import { CLASS_GRADES, type ClassGrade } from '../../../lib/classGrades';
import { formatNotificationStatus, notifyStudentsOfNewContent } from '../../../lib/contentNotifications';
import { isTeacherUser } from '../../../lib/auth';
import { formatDatabaseError } from '../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

type CreateAssignmentBody = {
  title?: string;
  description?: string;
  dueDate?: string | null;
  classGrade?: string;
  fileUrl?: string | null;
  fileName?: string | null;
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
    return NextResponse.json({ error: 'Only teachers can create assignments.' }, { status: 403 });
  }

  const body = (await request.json()) as CreateAssignmentBody;
  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json({ error: 'Assignment title is required.' }, { status: 400 });
  }

  const classGrade = body.classGrade?.trim() as ClassGrade | undefined;
  if (!classGrade || !CLASS_GRADES.includes(classGrade)) {
    return NextResponse.json({ error: 'Class grade (Grade 1, Grade 2, or Grade 3) is required.' }, { status: 400 });
  }

  const dueDate = body.dueDate?.trim() ? new Date(body.dueDate).toISOString() : null;

  const { data, error } = await supabase
    .from('assignments')
    .insert({
      teacher_id: user.id,
      title,
      description: body.description?.trim() || null,
      due_date: dueDate,
      class_grade: classGrade,
      file_url: body.fileUrl?.trim() || null,
      file_name: body.fileName?.trim() || null
    })
    .select('id, title, description, due_date, lesson_id, file_url, file_name, class_grade, created_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: formatDatabaseError(error?.message) }, { status: 500 });
  }

  const notifications = await notifyStudentsOfNewContent(supabase, {
    type: 'assignment',
    classGrade,
    title,
    description: data.description,
    dueDate: data.due_date
  });

  return NextResponse.json({
    success: true,
    assignment: data,
    notifications,
    notificationMessage: formatNotificationStatus(notifications)
  });
}
