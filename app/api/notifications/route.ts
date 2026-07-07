import { NextResponse } from 'next/server';
import { countUnreadNotifications, fetchNotificationsForUser } from '../../../lib/inAppNotifications';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const [{ data: notifications }, { count: unreadCount }] = await Promise.all([
    fetchNotificationsForUser(supabase, user.id),
    countUnreadNotifications(supabase, user.id)
  ]);

  return NextResponse.json({
    notifications,
    unreadCount
  });
}
