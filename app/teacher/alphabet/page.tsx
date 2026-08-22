import { redirect } from 'next/navigation';
import AlphabetPageShell from '../../../components/alphabet/AlphabetPageShell';
import { isTeacherUser } from '../../../lib/auth';
import { getUserRole } from '../../../lib/roleAuth';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function TeacherAlphabetPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/teacher/alphabet');
  }

  if (user.user_metadata?.force_password_change) {
    redirect('/change-password');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!isTeacherUser(profile, user)) {
    const role = await getUserRole(supabase, user);
    redirect(role === 'Student' ? '/student/alphabet' : '/login');
  }

  return <AlphabetPageShell role="Teacher" dashboardHref="/teacher/dashboard" />;
}
