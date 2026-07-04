import { NextResponse } from 'next/server';
import { isTeacherUser } from '../../../../lib/auth';
import { CLASS_GRADES, type ClassGrade } from '../../../../lib/classGrades';
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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!isTeacherUser(profile, user)) {
    return NextResponse.json({ error: 'Only teachers can edit materials.' }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    title?: string;
    externalLink?: string | null;
    classGrade?: string;
  };
  const id = body.id?.trim();
  const title = body.title?.trim();
  const externalLink = body.externalLink?.trim() || null;
  const classGrade = body.classGrade?.trim() as ClassGrade | undefined;

  if (!id || !title) {
    return NextResponse.json({ error: 'Material id and title are required.' }, { status: 400 });
  }

  if (!classGrade || !CLASS_GRADES.includes(classGrade)) {
    return NextResponse.json({ error: 'Class grade (Grade 1, Grade 2, or Grade 3) is required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('documents')
    .update({
      title,
      external_link: externalLink,
      class_grade: classGrade
    })
    .eq('id', id)
    .select('id, title, file_url, external_link, material_category, file_name, class_grade, created_at');

  if (error) {
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  const material = data?.[0];
  if (!material) {
    return NextResponse.json(
      {
        error:
          'Could not save changes. Run supabase/FIX_DOCUMENTS_MANAGE.sql in the Supabase SQL Editor, then refresh and try again.'
      },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, material });
}
