import { redirect } from 'next/navigation';
import Link from 'next/link';
import KahootTeacherCreate from '../../../components/kahoot/KahootTeacherCreate';
import { PageHeader } from '../../../components/ui';
import { isTeacherUser } from '../../../lib/auth';
import { getUserRole } from '../../../lib/roleAuth';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function TeacherKahootPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/teacher/kahoot');
  }

  if (user.user_metadata?.force_password_change) {
    redirect('/change-password');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!isTeacherUser(profile, user)) {
    const role = await getUserRole(supabase, user);
    redirect(role === 'Student' ? '/student/kahoot' : '/login');
  }

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Live competition"
        title="Tigrigna Fidel Kahoot"
        description="Host a timed quiz for your class. Questions are drawn from the same Fidel curriculum as ቋንቋ ትግርኛ መጽሓፍ ፊደል ን 1ይ ክፍሊ."
        actions={
          <Link href="/teacher/dashboard" className="link-button-secondary text-sm">
            Back to dashboard
          </Link>
        }
      />
      <KahootTeacherCreate />
    </section>
  );
}
