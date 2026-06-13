import { redirect } from 'next/navigation';
import HomeworkSubmissionForm from '../../../components/StudentHomeworkForm';
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
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    redirect('/login');
  }

  const user = sessionData.session.user;
  const userEmail = user.email ?? '';
  const isTeacher = userEmail.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'teacher@example.com').toLowerCase();

  if (isTeacher) {
    redirect('/teacher/dashboard');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  const [{ data: lessons }, { data: documents }, { data: submissions }] = await Promise.all([
    supabase.from('lessons').select('id, title, description, video_url, category, external_link').order('created_at', { ascending: false }),
    supabase.from('documents').select('id, title, file_url, external_link').order('created_at', { ascending: false }),
    supabase.from('submissions').select('id, video_url, notes, created_at').eq('student_id', user.id).order('created_at', { ascending: false })
  ]);

  const displayName = profile?.full_name || user.user_metadata?.full_name || 'Student';

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-amber-100 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-700">Student Dashboard / የተማሪ ዳሽቦርድ</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Welcome, {displayName}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <p className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">{userEmail}</p>
            <p className="rounded-full bg-amber-100 px-4 py-2 text-sm text-amber-800">{profile?.role ?? 'Student'}</p>
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

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold text-slate-950">Reading Materials</h2>
            <div className="mt-5 grid gap-4">
              {documents?.length ? (
                documents.map((doc) => (
                  <article key={doc.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{doc.title}</h3>
                        <p className="text-sm text-slate-500">PDF materials and extra links from your teacher.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noreferrer" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                            Download PDF
                          </a>
                        )}
                        {doc.external_link && (
                          <a href={doc.external_link} target="_blank" rel="noreferrer" className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            Open Link
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-slate-600">No reading materials uploaded yet.</p>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold text-slate-950">Homework Submission</h2>
          <p className="mt-2 text-slate-600">Submit your practice videos using a link or upload a short clip directly.</p>
          <div className="mt-6">
            <HomeworkSubmissionForm studentId={user.id} />
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
        <h2 className="text-2xl font-semibold text-slate-950">Your Submissions</h2>
        <div className="mt-5 grid gap-4">
          {submissions?.length ? (
            submissions.map((submission) => (
              <article key={submission.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{new Date(submission.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-600">{submission.notes}</p>
                  </div>
                  <a href={submission.video_url} target="_blank" rel="noreferrer" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    View Submission
                  </a>
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
