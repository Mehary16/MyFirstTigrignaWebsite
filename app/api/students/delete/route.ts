import { NextResponse } from 'next/server';
import { isTeacherUser } from '../../../../lib/auth';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createAdminSupabaseClient } from '../../../../lib/supabaseAdmin';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const { data: teacherProfile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!isTeacherUser(teacherProfile, user)) {
    return NextResponse.json({ error: 'Only teachers can delete student records.' }, { status: 403 });
  }

  const body = (await request.json()) as { studentId?: string };
  const studentId = body.studentId?.trim();

  if (!studentId) {
    return NextResponse.json({ error: 'Student id is required.' }, { status: 400 });
  }

  if (studentId === user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account from here.' }, { status: 400 });
  }

  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', studentId)
    .maybeSingle();

  if (!studentProfile || studentProfile.role !== 'Student') {
    return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
  }

  const admin = createAdminSupabaseClient();

  if (admin) {
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(studentId);

    if (authDeleteError) {
      return NextResponse.json({ error: formatDatabaseError(authDeleteError.message) }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${studentProfile.full_name} was deleted completely.`
    });
  }

  const { error: profileDeleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', studentId)
    .eq('role', 'Student');

  if (profileDeleteError) {
    return NextResponse.json({ error: formatDatabaseError(profileDeleteError.message) }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `${studentProfile.full_name} was removed from the student list. Add SUPABASE_SERVICE_ROLE_KEY to fully delete login access.`
  });
}
