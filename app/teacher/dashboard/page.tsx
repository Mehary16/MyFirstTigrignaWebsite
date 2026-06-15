import { redirect } from 'next/navigation';
import TeacherLessonForm from '../../../components/TeacherLessonForm';
import TeacherMaterialForm from '../../../components/TeacherMaterialForm';
import TeacherMaterialList from '../../../components/TeacherMaterialList';
import type { MaterialRow } from '../../../lib/teacherMaterials';
import TeacherSubmissionGrid from '../../../components/TeacherSubmissionGrid';
import TeacherStudentList, { type StudentListItem } from '../../../components/TeacherStudentList';
import TeacherGradeManager, { type GradeRow } from '../../../components/TeacherGradeManager';
import TeacherParentLinkForm from '../../../components/TeacherParentLinkForm';
import LogoutButton from '../../../components/LogoutButton';
import DatabaseSetupAlert from '../../../components/DatabaseSetupAlert';
import { isTeacherProfile, ensureTeacherProfileRole } from '../../../lib/auth';
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

  const [studentsResult, submissionsResult, gradesResult, documentsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, created_at, is_active, suspended_reason', { count: 'exact' })
      .eq('role', 'Student')
      .order('created_at', { ascending: false }),
    supabase.from('submissions').select('student_id'),
    supabase.from('grades').select('id, student_id, title, grade, feedback, created_at').order('created_at', { ascending: false }).limit(50),
    supabase
      .from('documents')
      .select('id, title, file_url, external_link, material_category, file_name, created_at')
      .order('created_at', { ascending: false })
  ]);

  const students = studentsResult.data;
  const studentCount = studentsResult.count;
  const submissionRows = submissionsResult.data;
  const gradeRows = gradesResult.data;
  const documents = (documentsResult.data ?? []) as MaterialRow[];

  const setupMessage = [submissionsResult.error, gradesResult.error, documentsResult.error]
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

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-700">Teacher Dashboard / ናይ መምህር ዳሽቦርድ</p>
            <h1 className="text-3xl font-semibold text-slate-900">ሓለዋ ዳሽቦርድ</h1>
            <p className="mt-1 text-sm text-slate-600">Welcome, {displayName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">Teacher</p>
            <p className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">{userEmail}</p>
            <LogoutButton />
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-slate-600">
          Create lessons, upload documents and media, review submissions, manage students, assign grades, and link parents.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <TeacherStudentList students={studentList} totalCount={studentCount ?? studentList.length} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <TeacherGradeManager students={studentOptions} initialGrades={grades} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <TeacherParentLinkForm students={studentOptions} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-2xl font-semibold text-slate-900">Add New Lesson</h2>
            <p className="mt-2 text-slate-600">Enter the lesson title in Tigrigna and English, then save it to the lesson library.</p>
            <div className="mt-6"><TeacherLessonForm /></div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-2xl font-semibold text-slate-900">Upload Documents</h2>
            <p className="mt-2 text-slate-600">
              Share PDFs, Word, Excel, PowerPoint, images, and other files with students.
            </p>
            <div className="mt-6">
              <TeacherMaterialForm category="document" />
            </div>
            <TeacherMaterialList category="document" initialMaterials={documents} />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-2xl font-semibold text-slate-900">Upload Video / Audio</h2>
            <p className="mt-2 text-slate-600">
              Share lesson recordings, pronunciation clips, or audio materials with students.
            </p>
            <div className="mt-6">
              <TeacherMaterialForm category="media" />
            </div>
            <TeacherMaterialList category="media" initialMaterials={documents} />
          </section>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <TeacherSubmissionGrid />
        </div>
      </div>
    </section>
  );
}
