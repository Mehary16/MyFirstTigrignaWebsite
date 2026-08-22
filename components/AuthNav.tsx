import { createServerSupabaseClient } from '../lib/supabaseServer';
import { getUserRole } from '../lib/roleAuth';
import { alphabetPathForRole, dashboardPathForRole } from '../lib/routes';
import AuthNavClient from './AuthNavClient';

export default async function AuthNav() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <AuthNavClient isLoggedIn={false} />;
  }

  const role = await getUserRole(supabase, user);

  return (
    <AuthNavClient
      isLoggedIn
      role={role}
      dashboardHref={dashboardPathForRole(role)}
      dashboardLabel={role === 'Teacher' ? 'Teacher Dashboard' : role === 'Parent' ? 'Parent Dashboard' : 'Student Dashboard'}
      alphabetHref={role === 'Teacher' || role === 'Student' ? alphabetPathForRole(role) : undefined}
    />
  );
}
