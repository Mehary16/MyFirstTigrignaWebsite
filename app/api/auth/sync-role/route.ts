import { NextResponse } from 'next/server';
import { dashboardPathForRole } from '../../../../lib/routes';
import { syncUserRole } from '../../../../lib/roleAuth';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';
import { normalizeClassGrade, type ClassGrade } from '../../../../lib/classGrades';

type SyncRoleBody = {
  accountType?: 'Student' | 'Parent';
  fullName?: string;
  classGrade?: ClassGrade | string | null;
};

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as SyncRoleBody;
  const accountType = body.accountType === 'Parent' ? 'Parent' : body.accountType === 'Student' ? 'Student' : undefined;
  const classGrade = body.classGrade ? normalizeClassGrade(body.classGrade as string | undefined) : null;

  const { role, error } = await syncUserRole(user.id, {
    accountType,
    fullName: body.fullName?.trim(),
    classGrade
  });

  if (!role) {
    return NextResponse.json(
      { error: error ?? 'Could not sync account role.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    role,
    dashboardPath: dashboardPathForRole(role)
  });
}
