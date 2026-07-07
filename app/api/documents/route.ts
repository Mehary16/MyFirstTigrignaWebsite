import { NextResponse } from 'next/server';
import { CLASS_GRADES, type ClassGrade } from '../../../lib/classGrades';
import { formatNotificationStatus, notifyStudentsOfNewContent } from '../../../lib/contentNotifications';
import { createStudentContentNotifications } from '../../../lib/inAppNotifications';
import { isTeacherUser } from '../../../lib/auth';
import { MATERIAL_CATEGORY_LABELS, type MaterialCategory } from '../../../lib/teacherMaterials';
import { formatDatabaseError } from '../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

type CreateDocumentBody = {
  title?: string;
  fileUrl?: string | null;
  externalLink?: string | null;
  fileName?: string | null;
  classGrade?: string;
  materialCategory?: MaterialCategory;
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
    return NextResponse.json({ error: 'Only teachers can upload materials.' }, { status: 403 });
  }

  const body = (await request.json()) as CreateDocumentBody;
  const title = body.title?.trim();
  const fileUrl = body.fileUrl?.trim() || null;
  const externalLink = body.externalLink?.trim() || null;
  const materialCategory = body.materialCategory === 'media' ? 'media' : 'document';

  if (!title) {
    return NextResponse.json({ error: 'Material title is required.' }, { status: 400 });
  }

  if (!fileUrl && !externalLink) {
    return NextResponse.json({ error: 'Upload a file or provide an external link.' }, { status: 400 });
  }

  const classGrade = body.classGrade?.trim() as ClassGrade | undefined;
  if (!classGrade || !CLASS_GRADES.includes(classGrade)) {
    return NextResponse.json({ error: 'Class grade (Grade 1, Grade 2, or Grade 3) is required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      title,
      file_url: fileUrl,
      external_link: externalLink,
      material_category: materialCategory,
      file_name: body.fileName?.trim() || null,
      class_grade: classGrade
    })
    .select('id, title, file_url, external_link, material_category, file_name, class_grade, created_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: formatDatabaseError(error?.message) }, { status: 500 });
  }

  const categoryLabel = MATERIAL_CATEGORY_LABELS[materialCategory].toLowerCase();
  const notificationBody = `Your teacher added new ${categoryLabel} for ${classGrade}.`;

  const emailNotifications = await notifyStudentsOfNewContent(supabase, {
    type: 'material',
    classGrade,
    title,
    description: notificationBody
  });

  await createStudentContentNotifications(supabase, {
    classGrade,
    type: 'material',
    title,
    body: notificationBody,
    sourceId: data.id
  });

  return NextResponse.json({
    success: true,
    document: data,
    notificationMessage: formatNotificationStatus(emailNotifications)
  });
}
