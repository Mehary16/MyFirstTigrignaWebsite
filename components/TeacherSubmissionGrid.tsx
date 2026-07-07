'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import { formatDatabaseError } from '../lib/supabaseErrors';
import { highlightScrollTarget } from '../lib/notificationLinks';
import { getSubmissionViewLabel, type SubmissionType } from '../lib/submissionMedia';

type SubmissionRow = {
  id: string;
  video_url: string | null;
  submission_type: SubmissionType;
  file_name: string | null;
  notes: string | null;
  teacher_feedback: string | null;
  feedback_at: string | null;
  created_at: string;
  assignment_id: string | null;
  profiles: {
    full_name: string;
  } | {
    full_name: string;
  }[] | null;
  assignments?: { title: string } | { title: string }[] | null;
};

function getStudentName(profiles: SubmissionRow['profiles']) {
  if (!profiles) return 'Unknown student';
  if (Array.isArray(profiles)) return profiles[0]?.full_name || 'Unknown student';
  return profiles.full_name;
}

function getAssignmentTitle(assignments: SubmissionRow['assignments']) {
  if (!assignments) return null;
  if (Array.isArray(assignments)) return assignments[0]?.title ?? null;
  return assignments.title;
}

export default function TeacherSubmissionGrid({
  highlightSubmissionId
}: {
  highlightSubmissionId?: string | null;
}) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadSubmissions = async () => {
    setLoading(true);
    setError(null);

    const fullSelect =
      'id, video_url, submission_type, file_name, notes, teacher_feedback, feedback_at, created_at, assignment_id, profiles(full_name), assignments(title)';
    const basicSelect =
      'id, video_url, submission_type, file_name, notes, teacher_feedback, feedback_at, created_at, assignment_id, profiles(full_name)';

    let data: SubmissionRow[] | null = null;
    let fetchError: { message: string } | null = null;

    const fullResult = await supabase.from('submissions').select(fullSelect).order('created_at', { ascending: false });
    data = (fullResult.data ?? null) as SubmissionRow[] | null;
    fetchError = fullResult.error;

    if (fetchError?.message.includes('relationship') && fetchError.message.includes('assignments')) {
      const basicResult = await supabase.from('submissions').select(basicSelect).order('created_at', { ascending: false });
      data = (basicResult.data ?? null) as SubmissionRow[] | null;
      fetchError = basicResult.error;
    }

    if (fetchError?.message.includes('assignment_id') || fetchError?.message.includes('teacher_feedback')) {
      const legacyResult = await supabase
        .from('submissions')
        .select('id, video_url, submission_type, file_name, notes, created_at, profiles(full_name)')
        .order('created_at', { ascending: false });
      data = (legacyResult.data ?? null) as SubmissionRow[] | null;
      fetchError = legacyResult.error;
    }

    if (fetchError) {
      setError(formatDatabaseError(fetchError.message));
      setSubmissions([]);
    } else {
      const rows = (data ?? []) as SubmissionRow[];
      setSubmissions(rows);
      setFeedbackDrafts(
        Object.fromEntries(rows.map((row) => [row.id, row.teacher_feedback ?? '']))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    loadSubmissions();
  }, [supabase]);

  useEffect(() => {
    if (!highlightSubmissionId || loading) return;

    const timeout = window.setTimeout(() => {
      const element = document.getElementById(`submission-${highlightSubmissionId}`);
      if (element) {
        highlightScrollTarget(element);
      }
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [highlightSubmissionId, loading, submissions.length]);

  const saveFeedback = async (submissionId: string) => {
    setSavingId(submissionId);
    const feedback = feedbackDrafts[submissionId]?.trim() || null;

    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        teacher_feedback: feedback,
        feedback_at: feedback ? new Date().toISOString() : null
      })
      .eq('id', submissionId);

    setSavingId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSubmissions((current) =>
      current.map((row) =>
        row.id === submissionId
          ? { ...row, teacher_feedback: feedback, feedback_at: feedback ? new Date().toISOString() : null }
          : row
      )
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Student homework / ዕዮ ገዛ</h2>
        <p className="mt-2 text-slate-600">Review submissions and leave feedback for each student.</p>
      </div>

      {loading && <p className="text-slate-600">Loading student homework...</p>}

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && !submissions.length && (
        <p className="text-slate-600">No student homework submitted yet.</p>
      )}

      <div className="grid gap-4">
        {submissions.map((submission) => {
          const studentName = getStudentName(submission.profiles);
          const assignmentTitle = getAssignmentTitle(submission.assignments);
          const mediaUrl = submission.video_url;
          return (
            <article
              key={submission.id}
              id={`submission-${submission.id}`}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{studentName}</p>
                  {assignmentTitle && <p className="text-sm text-amber-800">{assignmentTitle}</p>}
                  <p className="text-sm text-slate-500">{new Date(submission.created_at).toLocaleString()}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-amber-700">
                    {submission.submission_type}
                    {submission.file_name ? ` · ${submission.file_name}` : ''}
                  </p>
                </div>
                {mediaUrl ? (
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    {getSubmissionViewLabel(submission.submission_type)}
                  </a>
                ) : (
                  <span className="text-sm text-slate-500">No file attached</span>
                )}
              </div>
              {submission.notes && <p className="mt-3 text-slate-600">Notes: {submission.notes}</p>}

              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-slate-700">Teacher feedback</label>
                <textarea
                  rows={3}
                  value={feedbackDrafts[submission.id] ?? ''}
                  onChange={(event) =>
                    setFeedbackDrafts((current) => ({ ...current, [submission.id]: event.currentTarget.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-slate-500"
                  placeholder="Write helpful feedback for the student..."
                />
                <button
                  type="button"
                  disabled={savingId === submission.id}
                  onClick={() => saveFeedback(submission.id)}
                  className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:bg-slate-400"
                >
                  {savingId === submission.id ? 'Saving...' : 'Save feedback'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
