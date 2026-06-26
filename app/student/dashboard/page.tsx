import { redirect } from 'next/navigation';
import HomeworkSubmissionForm from '../../../components/StudentHomeworkForm';
import StudentSubmissionList from '../../../components/StudentSubmissionList';
import LogoutButton from '../../../components/LogoutButton';
import StudentMaterialSection from '../../../components/StudentMaterialSection';
import StudentLessonSection from '../../../components/StudentLessonSection';
import StudentAssignmentsList from '../../../components/StudentAssignmentsList';
import ProgressSummary from '../../../components/ProgressSummary';
import AnnouncementsFeed from '../../../components/AnnouncementsFeed';
import LiveClassSchedule from '../../../components/LiveClassSchedule';
import { splitStudentMaterials } from '../../../lib/teacherMaterials';
import DatabaseSetupAlert from '../../../components/DatabaseSetupAlert';
import { Badge, PageHeader } from '../../../components/ui';
import { isStudentSuspended } from '../../../lib/auth';
import {
  fetchAnnouncements,
  fetchAssignments,
  fetchDocumentsForDisplay,
  fetchLessonsForDisplay,
  fetchLessonViews,
  fetchLiveClasses,
  fetchStudentGrades,
  fetchStudentSubmissions,
  firstQueryError
} from '../../../lib/safeQueries';
import { formatDatabaseError } from '../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function StudentDashboardPage() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const userEmail = user.email ?? '';
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'teacher@example.com';
    const isTeacher = userEmail.toLowerCase() === adminEmail.toLowerCase();

    const { data: initialProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role, is_active')
      .eq('id', user.id)
      .maybeSingle();

    let profile = initialProfile;

    if (!profile && !profileError) {
      const role = (user.user_metadata?.role as string | undefined)?.toLowerCase() === 'parent' ? 'Parent' : 'Student';
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: (user.user_metadata?.full_name as string | undefined) ?? userEmail.split('@')[0] ?? 'Student',
        role,
        email: userEmail.toLowerCase(),
        is_active: true
      });

      if (!upsertError) {
        const { data: createdProfile } = await supabase
          .from('profiles')
          .select('full_name, role, is_active')
          .eq('id', user.id)
          .maybeSingle();

        profile = createdProfile;
      }
    }

    if (isTeacher || profile?.role === 'Teacher') {
      redirect('/teacher/dashboard');
    }

    if (profile?.role === 'Parent') {
      redirect('/parent/dashboard');
    }

    if (isStudentSuspended(profile)) {
      redirect('/suspended');
    }

    const [
      lessonsResult,
      documentsResult,
      submissionsResult,
      gradesResult,
      assignmentsResult,
      announcementsResult,
      liveClassesResult,
      lessonViewsResult
    ] = await Promise.all([
      fetchLessonsForDisplay(supabase),
      fetchDocumentsForDisplay(supabase),
      fetchStudentSubmissions(supabase, user.id),
      fetchStudentGrades(supabase, user.id),
      fetchAssignments(supabase),
      fetchAnnouncements(supabase),
      fetchLiveClasses(supabase),
      fetchLessonViews(supabase, user.id)
    ]);

    const lessons = lessonsResult.data;
    const submissions = submissionsResult.data;
    const grades = gradesResult.data;
    const assignments = assignmentsResult.data;
    const announcements = announcementsResult.data;
    const liveClasses = liveClassesResult.data;
    const viewedLessonIds = lessonViewsResult.data;

    const setupMessage = firstQueryError([
      profileError,
      lessonsResult.error,
      documentsResult.error,
      submissionsResult.error,
      gradesResult.error,
      assignmentsResult.error,
      announcementsResult.error,
      liveClassesResult.error,
      lessonViewsResult.error
    ]);

    const displayName = profile?.full_name || user.user_metadata?.full_name || 'Student';
    const { documents: documentMaterials, media: mediaMaterials } = splitStudentMaterials(documentsResult.data ?? []);
    const submittedAssignmentIds = (submissions ?? [])
      .map((item) => item.assignment_id)
      .filter((id): id is string => Boolean(id));
    const now = Date.now();
    const upcomingClasses = (liveClasses ?? []).filter(
      (item) => new Date(item.scheduled_at).getTime() >= now - item.duration_minutes * 60 * 1000
    ).length;

    return (
      <section className="space-y-8">
        <DatabaseSetupAlert message={setupMessage} />

        <PageHeader
          eyebrow="Student Dashboard / ናይ ተማሃሮ ዳሽቦርድ"
          title={`Welcome, ${displayName}`}
          description="Watch lessons, download materials, submit homework, and track your progress."
          actions={
            <>
              <Badge>{displayName}</Badge>
              <Badge variant="info">{profile?.role ?? 'Student'}</Badge>
              <LogoutButton variant="primary" />
            </>
          }
        />

        <ProgressSummary
          lessonsViewed={viewedLessonIds.length}
          totalLessons={lessons?.length ?? 0}
          submissionsCount={submissions?.length ?? 0}
          gradesCount={grades?.length ?? 0}
          upcomingClasses={upcomingClasses}
        />

        <AnnouncementsFeed announcements={announcements ?? []} />

        <LiveClassSchedule classes={liveClasses ?? []} />

        <StudentAssignmentsList assignments={assignments ?? []} submittedAssignmentIds={submittedAssignmentIds} />

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <StudentLessonSection lessons={lessons ?? []} viewedLessonIds={viewedLessonIds} studentId={user.id} />

            <StudentMaterialSection
              title="Documents & Files"
              description="PDFs, Word, Excel, PowerPoint, images, and other files from your teacher."
              emptyMessage="No documents uploaded yet."
              materials={documentMaterials}
            />

            <StudentMaterialSection
              title="Video & Audio"
              description="Lesson recordings, clips, and audio materials from your teacher."
              emptyMessage="No video or audio uploaded yet."
              materials={mediaMaterials}
            />
          </div>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold text-slate-950">Homework Submission</h2>
            <p className="mt-2 text-slate-600">Submit a video link, short clip, image, or document for your teacher to review.</p>
            <div className="mt-6">
              <HomeworkSubmissionForm studentId={user.id} assignments={assignments ?? []} />
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold text-slate-950">Your Grades</h2>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
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
                {grades?.length ? (
                  grades.map((grade) => (
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
                      No grades posted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold text-slate-950">Your Submissions</h2>
          <p className="mt-2 text-slate-600">Edit or delete homework you have already submitted.</p>
          <div className="mt-5">
            <StudentSubmissionList studentId={user.id} initialSubmissions={submissions ?? []} />
          </div>
        </section>
      </section>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Student dashboard could not load.';
    return (
      <section className="space-y-6">
        <DatabaseSetupAlert message={formatDatabaseError(message)} />
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-2xl font-semibold text-red-900">Student dashboard could not load</h1>
          <p className="mt-3 text-sm text-red-800">
            Run <code className="rounded bg-red-100 px-1">supabase/TIER_1_AND_2_FEATURES.sql</code> in Supabase SQL Editor if new features are missing.
          </p>
          <p className="mt-3 rounded bg-red-100/80 px-3 py-2 font-mono text-xs text-red-900">{message}</p>
        </div>
      </section>
    );
  }
}
