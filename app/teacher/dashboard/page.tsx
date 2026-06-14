import { redirect } from 'next/navigation';
import TeacherLessonForm from '../../../components/TeacherLessonForm';
import TeacherDocumentForm from '../../../components/TeacherDocumentForm';
import TeacherSubmissionGrid from '../../../components/TeacherSubmissionGrid';
import TeacherStudentList, { type StudentListItem } from '../../../components/TeacherStudentList';
import LogoutButton from '../../../components/LogoutButton';
import { isTeacherProfile } from '../../../lib/auth';
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

  if (!isTeacherProfile(profile, userEmail, adminEmail)) {
    redirect('/student/dashboard');
  }

  const [{ data: students, count: studentCount }, { data: submissionRows }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, created_at, is_active, suspended_reason', { count: 'exact' })
      .eq('role', 'Student')
      .order('created_at', { ascending: false }),
    supabase.from('submissions').select('student_id')
  ]);

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

  const displayName = profile?.full_name || user.user_metadata?.full_name || 'Teacher';

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Teacher Dashboard</p>
            <h1 className="text-3xl font-semibold text-slate-900">ሓለዋ ዳሽቦርድ</h1>
            <p className="mt-1 text-sm text-slate-600">Welcome, {displayName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">{userEmail}</p>
            <LogoutButton />
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-slate-600">Create lessons, upload PDFs, review student submissions, and manage registered students.</p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <TeacherStudentList students={studentList} totalCount={studentCount ?? studentList.length} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-2xl font-semibold text-slate-900">Add New Lesson</h2>
            <p className="mt-2 text-slate-600">Enter the lesson title in Tigrigna and English, then save it to the lesson library.</p>
            <div className="mt-6"><TeacherLessonForm /></div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-2xl font-semibold text-slate-900">Upload Reading Material</h2>
            <p className="mt-2 text-slate-600">Upload PDFs directly to Supabase storage and link them for students.</p>
            <div className="mt-6"><TeacherDocumentForm /></div>
          </section>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <TeacherSubmissionGrid />
        </div>
      </div>
    </section>
  );
}
