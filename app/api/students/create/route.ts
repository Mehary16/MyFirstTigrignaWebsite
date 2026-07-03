import { NextResponse } from 'next/server';
import { isTeacherUser } from '../../../../lib/auth';
import { syncUserRole } from '../../../../lib/roleAuth';
import { getAuthRedirectBaseUrl } from '../../../../lib/siteUrl';
import { createAdminSupabaseClient } from '../../../../lib/supabaseAdmin';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

type CreateStudentBody = {
  fullName?: string;
  email?: string;
  temporaryPassword?: string;
  mode?: 'password' | 'invite';
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
    return NextResponse.json({ error: 'Only teachers can create student accounts.' }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'Student creation needs SUPABASE_SERVICE_ROLE_KEY on the server. Add it in Vercel and .env.local.' },
      { status: 500 }
    );
  }

  const body = (await request.json()) as CreateStudentBody;
  const fullName = body.fullName?.trim();
  const email = body.email?.trim().toLowerCase();
  const mode = body.mode === 'invite' ? 'invite' : 'password';
  const temporaryPassword = body.temporaryPassword?.trim();

  if (!fullName) {
    return NextResponse.json({ error: 'Student name is required.' }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: 'Student email is required.' }, { status: 400 });
  }

  if (mode === 'password' && (!temporaryPassword || temporaryPassword.length < 8)) {
    return NextResponse.json({ error: 'Temporary password must be at least 8 characters.' }, { status: 400 });
  }

  const { data: existingProfile } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
  if (existingProfile) {
    return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 });
  }

  try {
    if (mode === 'invite') {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          role: 'Student',
          created_by_teacher: true,
          force_password_change: true
        },
        redirectTo: `${getAuthRedirectBaseUrl()}/change-password`
      });

      if (error || !data.user) {
        return NextResponse.json({ error: formatDatabaseError(error?.message) }, { status: 500 });
      }

      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        role: 'Student',
        email,
        is_active: true
      });

      await syncUserRole(data.user.id);

      return NextResponse.json({
        success: true,
        mode,
        student: {
          id: data.user.id,
          full_name: fullName,
          created_at: data.user.created_at ?? new Date().toISOString(),
          is_active: true,
          suspended_reason: null,
          submission_count: 0
        },
        message: `Invitation sent to ${email}. The student can finish setup from the email.`
      });
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword!,
      email_confirm: true,
      app_metadata: { role: 'Student' },
      user_metadata: {
        full_name: fullName,
        created_by_teacher: true,
        force_password_change: true
      }
    });

    if (error || !data.user) {
      return NextResponse.json({ error: formatDatabaseError(error?.message) }, { status: 500 });
    }

    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      role: 'Student',
      email,
      is_active: true
    });

    await syncUserRole(data.user.id);

    return NextResponse.json({
      success: true,
      mode,
      student: {
        id: data.user.id,
        full_name: fullName,
        created_at: data.user.created_at ?? new Date().toISOString(),
        is_active: true,
        suspended_reason: null,
        submission_count: 0
      },
      message: `${fullName} was created. Give the student the temporary password and they will be asked to change it after login.`
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? formatDatabaseError(error.message) : 'Could not create student account.' },
      { status: 500 }
    );
  }
}
