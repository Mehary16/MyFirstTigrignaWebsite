import { NextResponse } from 'next/server';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

type MarkReadBody = {
  notificationId?: string;
  all?: boolean;
};

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const body = (await request.json()) as MarkReadBody;

  if (body.all) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .is('read_at', null);

    if (error) {
      return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  const notificationId = body.notificationId?.trim();
  if (!notificationId) {
    return NextResponse.json({ error: 'Notification id is required.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('recipient_id', user.id);

  if (error) {
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
