import { NextResponse } from 'next/server';
import { CLASS_GRADES, type ClassGrade } from '../../../lib/classGrades';
import { formatNotificationStatus, notifyStudentsOfNewContent } from '../../../lib/contentNotifications';
import { isTeacherUser } from '../../../lib/auth';
import { formatDatabaseError } from '../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

type CreateAnnouncementBody = {
  title?: string;
  body?: string;
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
    return NextResponse.json({ error: 'Only teachers can post announcements.' }, { status: 403 });
  }

  const body = (await request.json()) as CreateAnnouncementBody;
  const title = body.title?.trim();
  const announcementBody = body.body?.trim();

  if (!title || !announcementBody) {
    return NextResponse.json({ error: 'Announcement title and message are required.' }, { status: 400 });
  }

  const classGrade = body.classGrade?.trim() as ClassGrade | undefined;
  if (!classGrade || !CLASS_GRADES.includes(classGrade)) {
    return NextResponse.json({ error: 'Class grade (Grade 1, Grade 2, or Grade 3) is required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      teacher_id: user.id,
      title,
      body: announcementBody,
      class_grade: classGrade,
      file_url: body.fileUrl?.trim() || null,
      file_name: body.fileName?.trim() || null
    })
    .select('id, title, body, file_url, file_name, class_grade, created_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: formatDatabaseError(error?.message) }, { status: 500 });
  }

  const notifications = await notifyStudentsOfNewContent(supabase, {
    type: 'announcement',
    classGrade,
    title,
    body: announcementBody
  });

  return NextResponse.json({
    success: true,
    announcement: data,
    notifications,
    notificationMessage: formatNotificationStatus(notifications)
  });
}
