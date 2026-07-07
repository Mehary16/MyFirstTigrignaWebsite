import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { normalizeClassGrade } from '../../../../lib/classGrades';
import { isTeacherUser } from '../../../../lib/auth';
import { buildStudentsWorkbook } from '../../../../lib/studentsExcel';
import { toStudentListItem } from '../../../../lib/studentList';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!isTeacherUser(profile, user)) {
    return NextResponse.json({ error: 'Only teachers can export students.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const template = searchParams.get('template') === '1';
  const gradeFilter = normalizeClassGrade(searchParams.get('grade'));

  if (searchParams.get('grade') && !gradeFilter) {
    return NextResponse.json({ error: 'Grade filter must be Grade 1, Grade 2, or Grade 3.' }, { status: 400 });
  }

  if (template) {
    const workbook = buildStudentsWorkbook([], { template: true });
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="student-import-template.xlsx"'
      }
    });
  }

  const { data: students, error: studentsError } = await supabase
    .from('profiles')
    .select('id, full_name, email, class_grade, created_at, is_active, suspended_reason')
    .eq('role', 'Student')
    .order('created_at', { ascending: false });

  if (studentsError) {
    return NextResponse.json({ error: formatDatabaseError(studentsError.message) }, { status: 500 });
  }

  const { data: submissions } = await supabase.from('submissions').select('student_id');
  const submissionCountByStudent = (submissions ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.student_id] = (acc[row.student_id] ?? 0) + 1;
    return acc;
  }, {});

  let studentList = (students ?? []).map((student) =>
    toStudentListItem(student, submissionCountByStudent[student.id] ?? 0)
  );

  if (gradeFilter) {
    studentList = studentList.filter((student) => student.class_grade === gradeFilter);
  }

  const workbook = buildStudentsWorkbook(studentList);
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const stamp = new Date().toISOString().slice(0, 10);
  const gradeSuffix = gradeFilter ? `-${gradeFilter.replace(/\s+/g, '-').toLowerCase()}` : '';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="students${gradeSuffix}-${stamp}.xlsx"`
    }
  });
}
