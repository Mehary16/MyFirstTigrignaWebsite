import { NextResponse } from 'next/server';
import { CLASS_GRADES, type ClassGrade } from '../../../lib/classGrades';
import { formatCombinedNotificationStatus, notifyStudentsOfNewContent } from '../../../lib/contentNotifications';
import { createStudentContentNotifications } from '../../../lib/inAppNotifications';
import { isTeacherUser } from '../../../lib/auth';
import { formatDatabaseError } from '../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

type CreateLiveClassBody = {
  title?: string;
  meetingUrl?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  notes?: string | null;
  classGrade?: string;
};

function formatScheduledAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

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
    return NextResponse.json({ error: 'Only teachers can schedule live classes.' }, { status: 403 });
  }

  const body = (await request.json()) as CreateLiveClassBody;
  const title = body.title?.trim();
  const meetingUrl = body.meetingUrl?.trim();
  const scheduledAt = body.scheduledAt?.trim();

  if (!title || !meetingUrl || !scheduledAt) {
    return NextResponse.json({ error: 'Title, meeting URL, and scheduled time are required.' }, { status: 400 });
  }

  const classGrade = body.classGrade?.trim() as ClassGrade | undefined;
  if (!classGrade || !CLASS_GRADES.includes(classGrade)) {
    return NextResponse.json({ error: 'Class grade (Grade 1, Grade 2, or Grade 3) is required.' }, { status: 400 });
  }

  const scheduledIso = new Date(scheduledAt).toISOString();
  const durationMinutes = Number(body.durationMinutes) || 60;
  const notes = body.notes?.trim() || null;

  const { data, error } = await supabase
    .from('live_classes')
    .insert({
      teacher_id: user.id,
      title,
      meeting_url: meetingUrl,
      scheduled_at: scheduledIso,
      duration_minutes: durationMinutes,
      notes,
      class_grade: classGrade
    })
    .select('id, title, meeting_url, scheduled_at, duration_minutes, notes, class_grade, created_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: formatDatabaseError(error?.message) }, { status: 500 });
  }

  const notificationBody = `Live class scheduled for ${formatScheduledAt(scheduledIso)}.${notes ? ` ${notes}` : ''}`;

  const emailNotifications = await notifyStudentsOfNewContent(supabase, {
    type: 'live_class',
    classGrade,
    title,
    description: notificationBody,
    scheduledAt: scheduledIso
  });

  const inAppNotifications = await createStudentContentNotifications(supabase, {
    classGrade,
    type: 'live_class',
    title,
    body: notificationBody,
    sourceId: data.id
  });

  return NextResponse.json({
    success: true,
    liveClass: data,
    notificationMessage: formatCombinedNotificationStatus(
      emailNotifications,
      inAppNotifications,
      'Live class scheduled'
    )
  });
}
