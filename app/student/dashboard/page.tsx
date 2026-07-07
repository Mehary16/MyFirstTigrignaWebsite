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
import NotificationBell from '../../../components/NotificationBell';
import { Badge, PageHeader, Alert } from '../../../components/ui';
import { isStudentSuspended } from '../../../lib/auth';
import { CLASS_GRADE_LABELS, normalizeClassGrade, type ClassGrade } from '../../../lib/classGrades';
import { getUserRole } from '../../../lib/roleAuth';
import { dashboardPathForRole } from '../../../lib/routes';
import {
  fetchAnnouncements,
  fetchAssignments,
  fetchDocumentsForDisplay,
  fetchLessonViews,
  fetchLiveClasses,
  fetchStudentGrades,
  fetchStudentSubmissions,
  firstQueryError
} from '../../../lib/safeQueries';
import { loadLessonsForStudent } from '../../../lib/loadLessonsForStudent';
import { countUnreadNotifications, fetchNotificationsForUser } from '../../../lib/inAppNotifications';
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

    if (user.user_metadata?.force_password_change) {
      redirect('/change-password');
    }

    const userEmail = user.email ?? '';

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role, is_active, class_grade')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    const role = await getUserRole(supabase, user);

    if (role !== 'Student') {
      redirect(dashboardPathForRole(role));
    }

    if (isStudentSuspended(profile)) {
      redirect('/suspended');
    }

    const classGrade = normalizeClassGrade(profile?.class_grade);

    const [
      lessons,
      documentsResult,
      submissionsResult,
      gradesResult,
      assignmentsResult,
      announcementsResult,
      liveClassesResult,
      lessonViewsResult,
      notificationsResult,
      unreadNotificationsResult
    ] = await Promise.all([
      loadLessonsForStudent(supabase, classGrade),
      fetchDocumentsForDisplay(supabase, classGrade),
      fetchStudentSubmissions(supabase, user.id),
      fetchStudentGrades(supabase, user.id),
      fetchAssignments(supabase, classGrade),
      fetchAnnouncements(supabase, classGrade),
      fetchLiveClasses(supabase, classGrade),
      fetchLessonViews(supabase, user.id),
      fetchNotificationsForUser(supabase, user.id),
      countUnreadNotifications(supabase, user.id)
    ]);
    const submissions = submissionsResult.data;
    const grades = gradesResult.data;
    const assignments = assignmentsResult.data;
    const announcements = announcementsResult.data;
    const liveClasses = liveClassesResult.data;
    const viewedLessonIds = lessonViewsResult.data;
    const notifications = notificationsResult.data;
    const unreadNotificationCount = unreadNotificationsResult.count;

    const setupMessage = firstQueryError([
      profileError,
      documentsResult.error,
      submissionsResult.error,
      gradesResult.error,
      assignmentsResult.error,
      announcementsResult.error,
      liveClassesResult.error,
      lessonViewsResult.error
    ]);

    const displayName = profile?.full_name || user.user_metadata?.full_name || 'Student';
    const gradeLabel = classGrade ? CLASS_GRADE_LABELS[classGrade] : null;
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
          description={
            gradeLabel
              ? `Your ${gradeLabel} classroom — lessons, homework, and announcements for your class only.`
              : 'Watch lessons, download materials, submit homework, and track your progress.'
          }
          actions={
            <>
              <NotificationBell
                initialNotifications={notifications}
                initialUnreadCount={unreadNotificationCount}
              />
              <Badge>{displayName}</Badge>
              {gradeLabel ? <Badge variant="brand">{gradeLabel}</Badge> : null}
              <Badge variant="info">{profile?.role ?? 'Student'}</Badge>
              <LogoutButton variant="primary" />
            </>
          }
        />

        {!classGrade ? (
          <Alert variant="info" title="Class grade not assigned yet">
            Ask your teacher to assign you to Grade 1, Grade 2, or Grade 3 so you can see your class lessons and homework.
          </Alert>
        ) : null}

        <ProgressSummary
          lessonsViewed={viewedLessonIds.length}
          totalLessons={lessons.length}
          submissionsCount={submissions?.length ?? 0}
          gradesCount={grades?.length ?? 0}
          upcomingClasses={upcomingClasses}
        />

        <AnnouncementsFeed announcements={announcements ?? []} />

        <LiveClassSchedule classes={liveClasses ?? []} />

        <StudentAssignmentsList assignments={assignments ?? []} submittedAssignmentIds={submittedAssignmentIds} />

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <StudentLessonSection lessons={lessons} viewedLessonIds={viewedLessonIds} gradeLabel={gradeLabel} />

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

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
              <h2 className="text-2xl font-semibold text-slate-950">Homework Submission</h2>
              <p className="mt-2 text-slate-600">Submit a video link, short clip, image, or document for your teacher to review.</p>
              <div className="mt-6">
                <HomeworkSubmissionForm studentId={user.id} assignments={assignments ?? []} />
              </div>
            </section>

            <StudentSubmissionList studentId={user.id} initialSubmissions={submissions ?? []} />

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
          </div>
        </div>
      </section>
    );
  } catch (error) {
    return (
      <section className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-900 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h1 className="text-2xl font-semibold">Could not load student dashboard</h1>
        <p className="mt-2 text-sm">{error instanceof Error ? formatDatabaseError(error.message) : 'Please try again.'}</p>
      </section>
    );
  }
}
