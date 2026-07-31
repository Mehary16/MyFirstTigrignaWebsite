import { redirect } from 'next/navigation';
import SettingsForm from '../../components/SettingsForm';
import { PageHeader } from '../../components/ui';
import { readPreferencesFromUserMetadata } from '../../lib/notificationPreferences';
import { getUserRole } from '../../lib/roleAuth';
import { createServerSupabaseClient } from '../../lib/supabaseServer';

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (user.user_metadata?.force_password_change) {
    redirect('/change-password');
  }

  const role = await getUserRole(supabase, user);
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split('@')[0] ??
    'User';

  const preferences = readPreferencesFromUserMetadata(user.user_metadata ?? {});

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Account Settings"
        title="Settings"
        description="Manage your profile, password, notifications, and account."
      />
      <SettingsForm
        email={user.email ?? ''}
        fullName={fullName}
        role={role}
        initialPreferences={preferences}
      />
    </section>
  );
}
