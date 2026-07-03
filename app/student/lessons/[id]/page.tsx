import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import StudentLessonPlayer from '../../../../components/StudentLessonPlayer';
import { Badge } from '../../../../components/ui';
import { isStudentSuspended } from '../../../../lib/auth';
import { getCachedLesson } from '../../../../lib/lessonCache';
import { LESSON_LEVEL_LABELS, type LessonLevel } from '../../../../lib/lessonLevels';
import { getUserRole } from '../../../../lib/roleAuth';
import { dashboardPathForRole } from '../../../../lib/routes';
import { fetchLessonViews } from '../../../../lib/safeQueries';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

type StudentLessonPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudentLessonPage({ params }: StudentLessonPageProps) {
  const { id } = await params;
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  const role = await getUserRole(supabase, user);

  if (role !== 'Student') {
    redirect(dashboardPathForRole(role));
  }

  if (isStudentSuspended(profile)) {
    redirect('/suspended');
  }

  const lesson = await getCachedLesson(id);

  if (!lesson) {
    notFound();
  }

  const lessonViewsResult = await fetchLessonViews(supabase, user.id);
  const initiallyViewed = lessonViewsResult.data.includes(id);
  const levelLabel =
    lesson.level === 'Beginner' || lesson.level === 'Intermediate' || lesson.level === 'Advanced'
      ? LESSON_LEVEL_LABELS[lesson.level as LessonLevel]
      : null;

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/student/dashboard"
          className="text-sm font-semibold text-amber-800 hover:underline"
        >
          ← Back to dashboard
        </Link>
        {levelLabel && <Badge variant="brand">{levelLabel}</Badge>}
      </div>

      <StudentLessonPlayer
        lessonId={lesson.id}
        studentId={user.id}
        title={lesson.title}
        description={lesson.description}
        videoUrl={lesson.video_url}
        category={lesson.category}
        externalLink={lesson.external_link}
        initiallyViewed={initiallyViewed}
      />
    </section>
  );
}
