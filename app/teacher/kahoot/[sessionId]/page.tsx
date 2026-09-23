import { redirect } from 'next/navigation';
import Link from 'next/link';
import KahootHostClient from '../../../../components/kahoot/KahootHostClient';
import { PageHeader } from '../../../../components/ui';
import { isTeacherUser } from '../../../../lib/auth';
import { getUserRole } from '../../../../lib/roleAuth';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

type PageProps = { params: Promise<{ sessionId: string }> };

export default async function TeacherKahootHostPage({ params }: PageProps) {
  const { sessionId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/teacher/kahoot/${sessionId}`);
  }

  if (user.user_metadata?.force_password_change) {
    redirect('/change-password');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!isTeacherUser(profile, user)) {
    const role = await getUserRole(supabase, user);
    redirect(role === 'Student' ? `/student/kahoot/${sessionId}` : '/login');
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Host view"
        title="Live game"
        description="Project this screen so students see the PIN and questions."
        actions={
          <Link href="/teacher/dashboard" className="link-button-secondary text-sm">
            Dashboard
          </Link>
        }
      />
      <KahootHostClient sessionId={sessionId} />
    </section>
  );
}
