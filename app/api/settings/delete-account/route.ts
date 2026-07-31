import { NextResponse } from 'next/server';
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

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
