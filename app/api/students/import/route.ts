import { NextResponse } from 'next/server';
import { isTeacherUser } from '../../../../lib/auth';
import { CLASS_GRADES, type ClassGrade } from '../../../../lib/classGrades';
import { parseStudentsWorkbook } from '../../../../lib/studentsExcel';
import { buildFullName } from '../../../../lib/studentNames';
import { syncUserRole } from '../../../../lib/roleAuth';
import { createAdminSupabaseClient } from '../../../../lib/supabaseAdmin';
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
    return NextResponse.json({ error: 'Only teachers can import students.' }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'Student import needs SUPABASE_SERVICE_ROLE_KEY on the server.' },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Please upload an Excel file (.xlsx).' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const rows = parseStudentsWorkbook(buffer);

  if (!rows.length) {
    return NextResponse.json({ error: 'The Excel file has no student rows to import.' }, { status: 400 });
  }

  const { data: existingStudents, error: studentsError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('role', 'Student');

  if (studentsError) {
    return NextResponse.json({ error: formatDatabaseError(studentsError.message) }, { status: 500 });
  }

  const studentIdByEmail = new Map(
    (existingStudents ?? [])
      .filter((student) => student.email)
      .map((student) => [student.email!.trim().toLowerCase(), student.id])
  );
  const studentIds = new Set((existingStudents ?? []).map((student) => student.id));

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = index + 2;

    const firstName = row.firstName.trim();
    const lastName = row.lastName.trim();
    const email = row.email.trim().toLowerCase();
    const fullName = buildFullName(firstName, lastName);
    const classGrade = row.classGrade;

    const existingId = row.studentId || (email ? studentIdByEmail.get(email) ?? null : null);
    const isUpdate = Boolean(existingId && (row.studentId || studentIdByEmail.has(email)));

    if (isUpdate && existingId) {
      if (row.studentId && !studentIds.has(row.studentId)) {
        errors.push(`Row ${rowNumber}: Student ID "${row.studentId}" was not found.`);
        continue;
      }

      const updatePayload: {
        full_name?: string;
        class_grade?: ClassGrade;
        is_active?: boolean;
        suspended_reason?: string | null;
        suspended_at?: string | null;
      } = {};

      if (fullName) updatePayload.full_name = fullName;
      if (classGrade) updatePayload.class_grade = classGrade;
      if (row.status === 'active') {
        updatePayload.is_active = true;
        updatePayload.suspended_reason = null;
        updatePayload.suspended_at = null;
      } else if (row.status === 'suspended') {
        updatePayload.is_active = false;
        updatePayload.suspended_reason = 'Suspended by teacher during Excel import.';
        updatePayload.suspended_at = new Date().toISOString();
      }

      if (!Object.keys(updatePayload).length) {
        errors.push(`Row ${rowNumber}: Nothing to update for "${email || existingId}".`);
        continue;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', existingId)
        .eq('role', 'Student');

      if (error) {
        errors.push(`Row ${rowNumber}: ${formatDatabaseError(error.message)}`);
        continue;
      }

      updated += 1;
      continue;
    }

    if (!firstName || !lastName) {
      errors.push(`Row ${rowNumber}: First Name and Last Name are required for new students.`);
      continue;
    }

    if (!email) {
      errors.push(`Row ${rowNumber}: Email is required for new students.`);
      continue;
    }

    if (!classGrade || !CLASS_GRADES.includes(classGrade)) {
      errors.push(`Row ${rowNumber}: Class Grade must be Grade 1, Grade 2, or Grade 3.`);
      continue;
    }

    if (!row.temporaryPassword || row.temporaryPassword.length < 8) {
      errors.push(`Row ${rowNumber}: Temporary Password must be at least 8 characters for new students.`);
      continue;
    }

    if (studentIdByEmail.has(email)) {
      errors.push(`Row ${rowNumber}: A student with email "${email}" already exists.`);
      continue;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: row.temporaryPassword,
      email_confirm: true,
      app_metadata: { role: 'Student' },
      user_metadata: {
        full_name: fullName,
        created_by_teacher: true,
        force_password_change: true
      }
    });

    if (error || !data.user) {
      errors.push(`Row ${rowNumber}: ${formatDatabaseError(error?.message ?? 'Could not create student.')}`);
      continue;
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      role: 'Student',
      email,
      class_grade: classGrade,
      is_active: row.status !== 'suspended',
      suspended_reason: row.status === 'suspended' ? 'Suspended by teacher during Excel import.' : null,
      suspended_at: row.status === 'suspended' ? new Date().toISOString() : null
    });

    if (profileError) {
      errors.push(`Row ${rowNumber}: ${formatDatabaseError(profileError.message)}`);
      continue;
    }

    await syncUserRole(data.user.id);
    studentIdByEmail.set(email, data.user.id);
    studentIds.add(data.user.id);
    created += 1;
  }

  if (!created && !updated) {
    return NextResponse.json(
      {
        error: errors[0] ?? 'No students were imported.',
        created,
        updated,
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
