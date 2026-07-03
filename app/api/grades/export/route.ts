import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { isTeacherUser } from '../../../../lib/auth';
import { GRADES_SHEET_NAME } from '../../../../lib/gradesExcel';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!isTeacherUser(profile, user)) {
    return NextResponse.json({ error: 'Only teachers can export grades.' }, { status: 403 });
  }

  const { data: gradeRows, error: gradesError } = await supabase
    .from('grades')
    .select('id, student_id, title, grade, feedback, created_at')
    .order('created_at', { ascending: false });

  if (gradesError) {
    return NextResponse.json({ error: formatDatabaseError(gradesError.message) }, { status: 500 });
  }

  const studentIds = [...new Set((gradeRows ?? []).map((grade) => grade.student_id))];
  const { data: studentProfiles } = studentIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', studentIds)
    : { data: [] as { id: string; full_name: string }[] };

  const studentNameById = Object.fromEntries((studentProfiles ?? []).map((student) => [student.id, student.full_name]));

  const sheetRows = (gradeRows ?? []).map((grade) => ({
    'Grade ID': grade.id,
    'Student Name': studentNameById[grade.student_id] ?? 'Student',
    'Student ID': grade.student_id,
    Assignment: grade.title,
    Grade: grade.grade,
    Feedback: grade.feedback ?? '',
    Date: new Date(grade.created_at).toLocaleDateString()
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  worksheet['!cols'] = [
    { wch: 38 },
    { wch: 24 },
    { wch: 38 },
    { wch: 28 },
    { wch: 12 },
    { wch: 36 },
    { wch: 14 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, GRADES_SHEET_NAME);
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="student-grades-${stamp}.xlsx"`
    }
  });
}
