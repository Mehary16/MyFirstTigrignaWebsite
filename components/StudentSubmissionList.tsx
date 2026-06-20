'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import {
  SUBMISSION_ACCEPT,
  SUBMISSION_MAX_BYTES,
  SUBMISSION_TYPE_LABELS,
  VIDEO_TOO_LONG_MESSAGE,
  formatFileSize,
  getSubmissionViewLabel,
  inferSubmissionTypeFromFile,
  uploadStudentSubmission,
  validateVideoDuration,
  type SubmissionType
} from '../lib/submissionMedia';

export type StudentSubmissionRow = {
  id: string;
  video_url: string | null;
  submission_type: string;
  file_name: string | null;
  notes: string | null;
  teacher_feedback?: string | null;
  feedback_at?: string | null;
  created_at: string;
};

type StudentSubmissionListProps = {
  studentId: string;
  initialSubmissions: StudentSubmissionRow[];
};

export default function StudentSubmissionList({ studentId, initialSubmissions }: StudentSubmissionListProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [editFeedback, setEditFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const submissionsSignature = useMemo(
    () =>
      initialSubmissions
        .map((item) => `${item.id}|${item.notes ?? ''}|${item.video_url ?? ''}|${item.file_name ?? ''}`)
        .join(';'),
    [initialSubmissions]
  );

  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [submissionsSignature, initialSubmissions]);

  const startEdit = (submission: StudentSubmissionRow) => {
    setEditingId(submission.id);
    setEditNotes(submission.notes ?? '');
    setEditMediaUrl(submission.video_url ?? '');
    setReplacementFile(null);
    setStatus(null);
    setEditFeedback(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNotes('');
    setEditMediaUrl('');
    setReplacementFile(null);
    setEditFeedback(null);
  };

  const handleSave = async (submission: StudentSubmissionRow) => {
    const submissionType = (submission.submission_type as SubmissionType) || 'link';

    if (submissionType === 'link' && !editMediaUrl.trim()) {
      setEditFeedback({ type: 'error', message: 'Please provide a video or media link.' });
      return;
    }

    setBusyId(submission.id);
    setStatus(null);
    setEditFeedback(null);

    try {
      let mediaUrl = submissionType === 'link' ? editMediaUrl.trim() : submission.video_url;
      let fileName = submission.file_name;
      let removeOldFile = false;

      if (submissionType !== 'link' && replacementFile) {
        const detectedType = inferSubmissionTypeFromFile(replacementFile);
        if (detectedType !== submissionType) {
          setEditFeedback({
            type: 'error',
            message: `Please upload a file that matches "${SUBMISSION_TYPE_LABELS[submissionType]}".`
          });
          return;
        }

        if (replacementFile.size > SUBMISSION_MAX_BYTES[submissionType]) {
          setEditFeedback({
            type: 'error',
            message: `File is too large. Maximum size is ${formatFileSize(SUBMISSION_MAX_BYTES[submissionType])}.`
          });
          return;
        }

        if (submissionType === 'video') {
          try {
            await validateVideoDuration(replacementFile);
          } catch (err) {
            setEditFeedback({
              type: 'error',
              message: err instanceof Error ? err.message : VIDEO_TOO_LONG_MESSAGE
            });
            return;
          }
        }

        const uploadResult = await uploadStudentSubmission(supabase, studentId, replacementFile, submissionType);
        mediaUrl = uploadResult.mediaUrl;
        fileName = uploadResult.fileName;
        removeOldFile = true;
      }

      const response = await fetch('/api/submissions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: submission.id,
          notes: editNotes.trim() || null,
          mediaUrl,
          fileName,
          removeOldFile
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        submission?: StudentSubmissionRow;
      };

      if (!response.ok || payload.error || !payload.submission) {
        setEditFeedback({ type: 'error', message: payload.error ?? 'Could not save changes.' });
        return;
      }

      setSubmissions((items) => items.map((item) => (item.id === submission.id ? payload.submission! : item)));
      cancelEdit();
      setStatus('Homework updated successfully.');
      router.refresh();
    } catch (err) {
      setEditFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Could not update homework.'
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (submission: StudentSubmissionRow) => {
    const confirmed = window.confirm('Delete this homework submission? This cannot be undone.');
    if (!confirmed) return;

    setBusyId(submission.id);
    setStatus(null);
    setEditFeedback(null);

    try {
      const response = await fetch('/api/submissions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submission.id })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok || payload.error) {
        setStatus(payload.error ?? 'Could not delete homework.');
        return;
      }

      setSubmissions((items) => items.filter((item) => item.id !== submission.id));
      if (editingId === submission.id) cancelEdit();
      setStatus('Homework deleted successfully.');
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not delete homework.');
    } finally {
      setBusyId(null);
    }
  };

  if (!submissions.length) {
    return <p className="text-slate-600">You have not submitted any homework yet.</p>;
  }

  return (
    <div className="space-y-4">
      {status && (
        <p role="status" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          {status}
        </p>
      )}

      {submissions.map((submission) => {
        const submissionType = (submission.submission_type as SubmissionType) || 'link';
        const isEditing = editingId === submission.id;
        const isBusy = busyId === submission.id;

        return (
          <article key={submission.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
            {isEditing ? (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-amber-700">
                  {SUBMISSION_TYPE_LABELS[submissionType]}
                </p>

                {submissionType === 'link' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Video or media link</label>
                    <input
                      value={editMediaUrl}
                      onChange={(event) => setEditMediaUrl(event.currentTarget.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Replace {SUBMISSION_TYPE_LABELS[submissionType].toLowerCase()} (optional)
                    </label>
                    <input
                      type="file"
                      accept={SUBMISSION_ACCEPT[submissionType]}
                      onChange={(event) => setReplacementFile(event.currentTarget.files?.[0] ?? null)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 text-slate-700 outline-none"
                    />
                    {submission.file_name && (
                      <p className="mt-2 text-xs text-slate-500">Current file: {submission.file_name}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700">Notes</label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(event) => setEditNotes(event.currentTarget.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
                    placeholder="Optional message for your teacher"
                  />
                </div>

                {editFeedback && (
                  <p
                    role="alert"
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      editFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {editFeedback.message}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleSave(submission)}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400"
                  >
                    {isBusy ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={cancelEdit}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{new Date(submission.created_at).toLocaleDateString()}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-amber-700">
                    {SUBMISSION_TYPE_LABELS[submissionType]}
                    {submission.file_name ? ` · ${submission.file_name}` : ''}
                  </p>
                  {submission.notes && <p className="mt-1 text-sm text-slate-600">{submission.notes}</p>}
                  {submission.teacher_feedback && (
                    <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs font-semibold uppercase text-emerald-800">Teacher feedback</p>
                      <p className="mt-1 text-sm text-emerald-900">{submission.teacher_feedback}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {submission.video_url && (
                    <a
                      href={submission.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      {getSubmissionViewLabel(submissionType)}
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => startEdit(submission)}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDelete(submission)}
                    className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {isBusy ? 'Working...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
