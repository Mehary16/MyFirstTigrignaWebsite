import { NextResponse } from 'next/server';
import { isTeacherUser } from '../../../../lib/auth';
import { getAuthRedirectBaseUrl, getPasswordResetRedirectUrl } from '../../../../lib/siteUrl';
import { createAdminSupabaseClient } from '../../../../lib/supabaseAdmin';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

type AccessHelpAction = 'reset_password' | 'resend_invite';

type SendAccessHelpBody = {
  studentId?: string;
  action?: AccessHelpAction;
};

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
    return NextResponse.json({ error: 'Only teachers can help students with login access.' }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'Login help needs SUPABASE_SERVICE_ROLE_KEY on the server.' },
      { status: 500 }
    );
  }

  const body = (await request.json()) as SendAccessHelpBody;
  const studentId = body.studentId?.trim();
  const action = body.action;

  if (!studentId || (action !== 'reset_password' && action !== 'resend_invite')) {
    return NextResponse.json({ error: 'Student id and a valid action are required.' }, { status: 400 });
  }

  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, is_active')
    .eq('id', studentId)
    .maybeSingle();

  if (!studentProfile || studentProfile.role !== 'Student') {
    return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
  }

  if (!studentProfile.is_active) {
    return NextResponse.json(
      { error: 'Reactivate this student account first, then send login help.' },
      { status: 400 }
    );
  }

  const { data: authData, error: authError } = await admin.auth.admin.getUserById(studentId);

  if (authError || !authData.user?.email) {
    return NextResponse.json({ error: 'Could not find the student login email.' }, { status: 404 });
  }

  const email = authData.user.email;

  if (studentProfile.email !== email) {
    await supabase.from('profiles').update({ email }).eq('id', studentId);
  }

  try {
    if (action === 'reset_password') {
      const { error } = await admin.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectUrl()
      });

      if (error) {
        return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        email,
        message: `Password reset email sent to ${email}. The student can choose a new password from that link.`
      });
    }

    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: studentProfile.full_name,
        role: 'Student',
        created_by_teacher: true,
        force_password_change: true
      },
      redirectTo: `${getAuthRedirectBaseUrl()}/change-password`
    });

    if (error) {
      const hint = error.message.toLowerCase().includes('already')
        ? ' Try “Send password reset” instead if the student already finished setup.'
        : '';
      return NextResponse.json({ error: `${formatDatabaseError(error.message)}${hint}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      email,
      message: `Setup invitation resent to ${email}.`
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? formatDatabaseError(error.message) : 'Could not send login help.' },
      { status: 500 }
    );
  }
}
