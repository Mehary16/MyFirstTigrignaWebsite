import { NextResponse } from 'next/server';
import { isTeacherUser } from '../../../../lib/auth';
import { parseGradesWorkbook } from '../../../../lib/gradesExcel';
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
    return NextResponse.json({ error: 'Only teachers can import grades.' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Please upload an Excel file (.xlsx).' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const rows = parseGradesWorkbook(buffer);

  if (!rows.length) {
    return NextResponse.json({ error: 'The Excel file has no grade rows to import.' }, { status: 400 });
  }

  const { data: students, error: studentsError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'Student');

  if (studentsError) {
    return NextResponse.json({ error: formatDatabaseError(studentsError.message) }, { status: 500 });
  }

  const studentIdByName = new Map(
    (students ?? []).map((student) => [student.full_name.trim().toLowerCase(), student.id])
  );

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = index + 2;

    if (!row.title || !row.grade) {
      errors.push(`Row ${rowNumber}: Assignment and Grade are required.`);
      continue;
    }

    const studentId =
      row.studentId ||
      (row.studentName ? studentIdByName.get(row.studentName.trim().toLowerCase()) ?? null : null);

    if (!studentId) {
      errors.push(`Row ${rowNumber}: Could not match student "${row.studentName || row.studentId}".`);
      continue;
    }

    if (row.gradeId) {
      const { data, error } = await supabase
        .from('grades')
        .update({
          student_id: studentId,
          title: row.title,
          grade: row.grade,
          feedback: row.feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', row.gradeId)
        .select('id');

      if (error) {
        errors.push(`Row ${rowNumber}: ${formatDatabaseError(error.message)}`);
        continue;
      }

      if (!data?.length) {
        errors.push(`Row ${rowNumber}: Grade ID "${row.gradeId}" was not found.`);
        continue;
      }

      updated += 1;
      continue;
    }

    const { error } = await supabase.from('grades').insert({
      student_id: studentId,
      teacher_id: user.id,
      title: row.title,
      grade: row.grade,
      feedback: row.feedback
    });

    if (error) {
      errors.push(`Row ${rowNumber}: ${formatDatabaseError(error.message)}`);
      continue;
    }

    created += 1;
  }

  if (!created && !updated) {
    return NextResponse.json(
      {
        error: errors[0] ?? 'No grades were imported.',
        errors
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    created,
    updated,
    errors
  });
}
