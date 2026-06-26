import { redirect } from 'next/navigation';
import type { MaterialRow } from '../../../lib/teacherMaterials';
import { type StudentListItem } from '../../../components/TeacherStudentList';
import { type GradeRow } from '../../../components/TeacherGradeManager';
import TeacherDashboardShell from '../../../components/TeacherDashboardShell';
import LogoutButton from '../../../components/LogoutButton';
import DatabaseSetupAlert from '../../../components/DatabaseSetupAlert';
import { Badge, PageHeader } from '../../../components/ui';
import { isTeacherProfile, ensureTeacherProfileRole } from '../../../lib/auth';
import { fetchAssignments, fetchAnnouncements, fetchLessonsForDisplay, fetchLiveClasses } from '../../../lib/safeQueries';
import { formatDatabaseError } from '../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function TeacherDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    redirect('/login');
  }

  const user = sessionData.session.user;
  const userEmail = user.email ?? '';
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'teacher@example.com';
  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();

  if (profile?.role === 'Parent') {
    redirect('/parent/dashboard');
  }

  if (!isTeacherProfile(profile, userEmail, adminEmail)) {
    redirect('/student/dashboard');
  }

  await ensureTeacherProfileRole(supabase, user.id, userEmail, adminEmail, profile?.role);

  const [studentsResult, submissionsResult, gradesResult, documentsResult, lessonsResult, assignmentsResult, liveClassesResult, announcementsResult] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, created_at, is_active, suspended_reason', { count: 'exact' })
        .eq('role', 'Student')
        .order('created_at', { ascending: false }),
      supabase.from('submissions').select('student_id'),
      supabase.from('grades').select('id, student_id, title, grade, feedback, created_at').order('created_at', { ascending: false }),
      supabase
        .from('documents')
        .select('id, title, file_url, external_link, material_category, file_name, created_at')
        .order('created_at', { ascending: false }),
      fetchLessonsForDisplay(supabase),
      fetchAssignments(supabase),
      fetchLiveClasses(supabase),
      fetchAnnouncements(supabase)
    ]);

  const students = studentsResult.data;
  const studentCount = studentsResult.count;
  const submissionRows = submissionsResult.data;
  const gradeRows = gradesResult.data;
  const documents = (documentsResult.data ?? []) as MaterialRow[];
  const lessons = lessonsResult.data ?? [];
  const assignments = assignmentsResult.data ?? [];
  const liveClasses = liveClassesResult.data ?? [];
  const announcements = announcementsResult.data ?? [];

  const setupMessage = [submissionsResult.error, gradesResult.error, documentsResult.error, lessonsResult.error, assignmentsResult.error]
    .filter(Boolean)
    .map((error) => formatDatabaseError(error!.message))[0] ?? null;

  const submissionCountByStudent = (submissionRows ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.student_id] = (acc[row.student_id] ?? 0) + 1;
    return acc;
  }, {});

  const studentList: StudentListItem[] = (students ?? []).map((student) => ({
    id: student.id,
    full_name: student.full_name,
    created_at: student.created_at,
    is_active: student.is_active ?? true,
    suspended_reason: student.suspended_reason,
    submission_count: submissionCountByStudent[student.id] ?? 0
  }));

  const studentOptions = studentList.map(({ id, full_name }) => ({ id, full_name }));
  const studentNameById = Object.fromEntries(studentOptions.map((student) => [student.id, student.full_name]));

  const grades: GradeRow[] = (gradeRows ?? []).map((grade) => ({
    ...grade,
    profiles: { full_name: studentNameById[grade.student_id] ?? 'Student' }
  }));

  const displayName = profile?.full_name || user.user_metadata?.full_name || 'Teacher';

  return (
    <section className="space-y-8">
      <DatabaseSetupAlert message={setupMessage} />

      <PageHeader
        eyebrow="Teacher Dashboard / ናይ መምህር ዳሽቦርድ"
        title="ናይ ተማሃሮ ንጥፈታት መከታተሊ"
        description={`Welcome, ${displayName}. Create lessons, assign homework, schedule live classes, post announcements, review submissions, and manage grades.`}
        actions={
          <>
            <Badge variant="role">Teacher</Badge>
            <Badge>{displayName}</Badge>
            <LogoutButton />
          </>
        }
      />

      <TeacherDashboardShell
        studentList={studentList}
        studentCount={studentCount ?? studentList.length}
        studentOptions={studentOptions}
        grades={grades}
        documents={documents}
        lessons={lessons}
        assignments={assignments}
        liveClasses={liveClasses}
        announcements={announcements}
      />
    </section>
  );
}
