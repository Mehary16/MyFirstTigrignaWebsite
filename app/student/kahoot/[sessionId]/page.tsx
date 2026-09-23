import { redirect } from 'next/navigation';
import Link from 'next/link';
import KahootPlayerClient from '../../../../components/kahoot/KahootPlayerClient';
import { PageHeader } from '../../../../components/ui';
import { getUserRole } from '../../../../lib/roleAuth';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

type PageProps = { params: Promise<{ sessionId: string }> };

export default async function StudentKahootPlayPage({ params }: PageProps) {
  const { sessionId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/student/kahoot/${sessionId}`);
  }

  if (user.user_metadata?.force_password_change) {
    redirect('/change-password');
  }

  const role = await getUserRole(supabase, user);
  if (role !== 'Student') {
    redirect(role === 'Teacher' ? `/teacher/kahoot/${sessionId}` : '/login');
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Player"
        title="Live quiz"
        description="Tap the answer on your device before time runs out."
        actions={
          <Link href="/student/dashboard" className="link-button-secondary text-sm">
            Dashboard
          </Link>
        }
      />
      <KahootPlayerClient sessionId={sessionId} />
    </section>
  );
}
