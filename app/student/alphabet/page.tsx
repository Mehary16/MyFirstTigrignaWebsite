import { redirect } from 'next/navigation';
import AlphabetPageShell from '../../../components/alphabet/AlphabetPageShell';
import { getUserRole } from '../../../lib/roleAuth';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function StudentAlphabetPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/student/alphabet');
  }

  if (user.user_metadata?.force_password_change) {
    redirect('/change-password');
  }

  const role = await getUserRole(supabase, user);
  if (role !== 'Student') {
    redirect(role === 'Teacher' ? '/teacher/alphabet' : '/login');
  }

  return <AlphabetPageShell role="Student" dashboardHref="/student/dashboard" />;
}
