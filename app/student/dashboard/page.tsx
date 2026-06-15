import { redirect } from 'next/navigation';
import HomeworkSubmissionForm from '../../../components/StudentHomeworkForm';
import LogoutButton from '../../../components/LogoutButton';
import StudentMaterialSection, { splitStudentMaterials } from '../../../components/StudentMaterialSection';
import DatabaseSetupAlert from '../../../components/DatabaseSetupAlert';
import { isStudentSuspended } from '../../../lib/auth';
import {
  fetchDocumentsForDisplay,
  fetchStudentSubmissions,
  firstQueryError
} from '../../../lib/safeQueries';
import { getSubmissionViewLabel, type SubmissionType } from '../../../lib/submissionMedia';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

function getVideoEmbedUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl);

    if (url.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed${url.pathname}`;
    }

    if (url.hostname.includes('youtube.com')) {
      const videoId = url.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      if (url.pathname.startsWith('/embed/')) {
        return videoUrl;
      }
    }

    if (url.hostname.includes('vimeo.com')) {
      const vimeoId = url.pathname.split('/').filter(Boolean).pop();
      if (vimeoId) {
        return `https://player.vimeo.com/video/${vimeoId}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export default async function StudentDashboardPage() {
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

  const [lessonsResult, documentsResult, submissionsResult, gradesResult] = await Promise.all([
    supabase.from('lessons').select('id, title, description, video_url, category, external_link').order('created_at', { ascending: false }),
    fetchDocumentsForDisplay(supabase),
    fetchStudentSubmissions(supabase, user.id),
    supabase.from('grades').select('id, title, grade, feedback, created_at').eq('student_id', user.id).order('created_at', { ascending: false })
  ]);

  const lessons = lessonsResult.data;
  const submissions = submissionsResult.data;
  const grades = gradesResult.data;
  const setupMessage = firstQueryError([
    profileError,
    lessonsResult.error,
    documentsResult.error,
    submissionsResult.error,
    gradesResult.error
  ]);

  const displayName = profile?.full_name || user.user_metadata?.full_name || 'Student';
  const { documents: documentMaterials, media: mediaMaterials } = splitStudentMaterials(documentsResult.data);

  return (
    <section className="space-y-8">
      <DatabaseSetupAlert message={setupMessage} />

      <div className="rounded-[2rem] border border-amber-100 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-700">Student Dashboard / ናይ ተማሃሮ ዳሽቦርድ</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Welcome, {displayName}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">{userEmail}</p>
            <p className="rounded-full bg-amber-100 px-4 py-2 text-sm text-amber-800">{profile?.role ?? 'Student'}</p>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold text-slate-950">Video Lessons</h2>
            <div className="mt-5 space-y-4">
              {lessons?.length ? (
                lessons.map((lesson) => (
                  <article key={lesson.id} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50">
                    {getVideoEmbedUrl(lesson.video_url) ? (
                      <div className="aspect-video w-full bg-slate-200">
                        <iframe
                          src={getVideoEmbedUrl(lesson.video_url) ?? undefined}
                          title={lesson.title}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="border-b border-slate-200 p-4">
                        <a href={lesson.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                          Open Video
                        </a>
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-950">{lesson.title}</h3>
                      {lesson.category && <p className="mt-1 text-sm text-amber-700">{lesson.category}</p>}
                      <p className="mt-3 text-slate-600">{lesson.description}</p>
                      {lesson.external_link && (
                        <a href={lesson.external_link} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                          Open extra link
                        </a>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-slate-600">No lessons assigned yet. Please check back later.</p>
              )}
            </div>
          </section>

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
            <HomeworkSubmissionForm studentId={user.id} />
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
        <div className="mt-5 grid gap-4">
          {submissions?.length ? (
            submissions.map((submission) => (
              <article key={submission.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{new Date(submission.created_at).toLocaleDateString()}</p>
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-amber-700">
                      {(submission.submission_type as SubmissionType) || 'link'}
                      {submission.file_name ? ` · ${submission.file_name}` : ''}
                    </p>
                    {submission.notes && <p className="mt-1 text-sm text-slate-600">{submission.notes}</p>}
                  </div>
                  {submission.video_url ? (
                    <a
                      href={submission.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      {getSubmissionViewLabel((submission.submission_type as SubmissionType) || 'link')}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-500">No file attached</span>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p className="text-slate-600">You have not submitted any homework yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}
