import { redirect } from 'next/navigation';
import Link from 'next/link';
import KahootStudentJoin from '../../../components/kahoot/KahootStudentJoin';
import { PageHeader } from '../../../components/ui';
import { getUserRole } from '../../../lib/roleAuth';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function StudentKahootPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/student/kahoot');
  }

  if (user.user_metadata?.force_password_change) {
    redirect('/change-password');
  }

  const role = await getUserRole(supabase, user);
  if (role !== 'Student') {
    redirect(role === 'Teacher' ? '/teacher/kahoot' : '/login');
  }

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Live competition"
        title="Join Fidel quiz"
        description="Use the PIN your teacher shares in class."
        actions={
          <Link href="/student/dashboard" className="link-button-secondary text-sm">
            Back to dashboard
          </Link>
        }
      />
      <KahootStudentJoin />
    </section>
  );
}
