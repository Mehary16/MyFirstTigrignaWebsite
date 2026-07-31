import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../../lib/supabaseAdmin';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const body = (await request.json()) as { fullName?: string };
  const fullName = body.fullName?.trim();

  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 });
  }

  if (fullName.length > 120) {
    return NextResponse.json({ error: 'Name is too long.' }, { status: 400 });
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { full_name: fullName }
  });

  if (metadataError) {
    return NextResponse.json({ error: metadataError.message }, { status: 500 });
  }

  const admin = createAdminSupabaseClient();
  if (admin) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, full_name: fullName }
    });
  }

  return NextResponse.json({ success: true, fullName });
}
