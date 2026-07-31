import { NextResponse } from 'next/server';
import { writeAuditLog } from '../../../../lib/auditLog';
import { enforceRateLimit, rateLimitResponse } from '../../../../lib/apiRateLimit';
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

  const rateLimit = enforceRateLimit({
    request,
    scope: 'settings-delete-account',
    userId: user.id,
    limit: 5,
    windowMs: 60_000
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit);
  }

  const body = (await request.json()) as { confirmation?: string };
  if (body.confirmation !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm account removal.' }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  if (admin) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id);
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  await writeAuditLog({
    action: 'account.deleted',
    actorId: user.id,
    targetId: user.id,
    metadata: { email: user.email }
  });

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
