import { redirect } from 'next/navigation';
import LogoutButton from '../../../components/LogoutButton';
import ProgressSummary from '../../../components/ProgressSummary';
import AnnouncementsFeed from '../../../components/AnnouncementsFeed';
import LiveClassSchedule from '../../../components/LiveClassSchedule';
import ParentHomeworkView from '../../../components/ParentHomeworkView';
import {
  fetchAnnouncements,
  fetchChildSubmissionsForParent,
  fetchLessonViews,
  fetchLessonsForDisplay,
  fetchLiveClasses
} from '../../../lib/safeQueries';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

type ChildSummary = {
  id: string;
  full_name: string;
  submission_count: number;
  grades: {
    id: string;
    title: string;
    grade: string;
    feedback: string | null;
    created_at: string;
  }[];
  submissions: Awaited<ReturnType<typeof fetchChildSubmissionsForParent>>['data'];
  lessonsViewed: number;
};

export default async function ParentDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    redirect('/login');
  }

  const user = sessionData.session.user;
  const userEmail = user.email ?? '';
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'Teacher' || userEmail.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'teacher@example.com').toLowerCase()) {
    redirect('/teacher/dashboard');
  }

  if (profile?.role === 'Student') {
    redirect('/student/dashboard');
  }

  if (profile?.role !== 'Parent') {
    redirect('/login');
  }

  const [linksResult, announcementsResult, liveClassesResult, lessonsResult] = await Promise.all([
    supabase.from('parent_student_links').select('student_id').eq('parent_id', user.id),
    fetchAnnouncements(supabase),
    fetchLiveClasses(supabase),
    fetchLessonsForDisplay(supabase)
  ]);

  const studentIds = (linksResult.data ?? []).map((link) => link.student_id);
  const { data: studentProfiles } = studentIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', studentIds)
    : { data: [] as { id: string; full_name: string }[] };

  const children: ChildSummary[] = [];

  for (const student of studentProfiles ?? []) {
    const [{ count: submissionCount }, { data: grades }, submissionsResult, lessonViewsResult] = await Promise.all([
      supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('student_id', student.id),
      supabase
        .from('grades')
        .select('id, title, grade, feedback, created_at')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false }),
      fetchChildSubmissionsForParent(supabase, student.id),
      fetchLessonViews(supabase, student.id)
    ]);

    children.push({
      id: student.id,
      full_name: student.full_name,
      submission_count: submissionCount ?? 0,
      grades: grades ?? [],
      submissions: submissionsResult.data ?? [],
      lessonsViewed: lessonViewsResult.data.length
    });
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || 'Parent';
  const totalLessons = lessonsResult.data?.length ?? 0;
  const now = Date.now();
  const upcomingClasses = (liveClassesResult.data ?? []).filter(
    (item) => new Date(item.scheduled_at).getTime() >= now - item.duration_minutes * 60 * 1000
  ).length;

  const totalSubmissions = children.reduce((sum, child) => sum + child.submission_count, 0);
  const totalGrades = children.reduce((sum, child) => sum + child.grades.length, 0);
  const totalLessonsViewed = children.reduce((sum, child) => sum + child.lessonsViewed, 0);

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-amber-100 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-700">Parent Dashboard / ናይ ወለዲ ዳሽቦርድ</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Welcome, {displayName}</h1>
            <p className="mt-2 text-slate-600">See how your children are doing in Tigrigna class.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">{displayName}</p>
            <LogoutButton />
          </div>
        </div>
      </div>

      {children.length > 0 && (
        <ProgressSummary
          label="Family Progress Summary"
          lessonsViewed={totalLessonsViewed}
          totalLessons={totalLessons * children.length}
          submissionsCount={totalSubmissions}
          gradesCount={totalGrades}
          upcomingClasses={upcomingClasses}
        />
      )}

      <AnnouncementsFeed announcements={announcementsResult.data ?? []} />

      <LiveClassSchedule classes={liveClassesResult.data ?? []} />

      {!children.length ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-slate-600">
          No children linked yet. Ask your teacher to link your parent account to your child&apos;s student account.
        </div>
      ) : (
        children.map((child) => (
          <section key={child.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">{child.full_name}</h2>
                <p className="text-sm text-slate-600">
                  {child.lessonsViewed}/{totalLessons} lessons viewed · {child.submission_count} homework submission(s)
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
                {child.grades.length} grade record(s)
              </span>
            </div>

            <ParentHomeworkView submissions={child.submissions} childName={child.full_name} />

            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Assignment</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Grade</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Feedback</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {child.grades.length ? (
                    child.grades.map((grade) => (
                      <tr key={grade.id}>
                        <td className="px-4 py-3 text-slate-900">{grade.title}</td>
                        <td className="px-4 py-3 font-semibold text-amber-800">{grade.grade}</td>
                        <td className="px-4 py-3 text-slate-600">{grade.feedback ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(grade.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        No grades posted yet for {child.full_name}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </section>
  );
}
