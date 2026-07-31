import { NextResponse } from 'next/server';
import {
  parseNotificationPreferences,
  readPreferencesFromUserMetadata,
  type NotificationPreferences
} from '../../../../lib/notificationPreferences';
import { getUserRole } from '../../../../lib/roleAuth';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const role = await getUserRole(supabase, user);
  const preferences = readPreferencesFromUserMetadata(user.user_metadata ?? {});

  return NextResponse.json({ preferences, role });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const body = (await request.json()) as { preferences?: Partial<NotificationPreferences> };
  const incoming = body.preferences;

  if (!incoming || typeof incoming !== 'object') {
    return NextResponse.json({ error: 'Preferences are required.' }, { status: 400 });
  }

  const current = readPreferencesFromUserMetadata(user.user_metadata ?? {});
  const next = parseNotificationPreferences({ ...current, ...incoming });

  const { error } = await supabase.auth.updateUser({
    data: { notification_preferences: next }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, preferences: next });
}
