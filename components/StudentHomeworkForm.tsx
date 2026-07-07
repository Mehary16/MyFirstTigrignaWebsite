'use client';

import { useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import {
  SUBMISSION_ACCEPT,
  SUBMISSION_MAX_BYTES,
  SUBMISSION_TYPE_LABELS,
  VIDEO_TOO_LONG_MESSAGE,
  formatFileSize,
  inferSubmissionTypeFromFile,
  uploadStudentSubmission,
  validateVideoDuration,
  type SubmissionType
} from '../lib/submissionMedia';

import type { AssignmentRow } from './TeacherAssignmentManager';

interface StudentHomeworkFormProps {
  studentId: string;
  assignments?: AssignmentRow[];
}

export default function StudentHomeworkForm({ studentId, assignments = [] }: StudentHomeworkFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [submissionType, setSubmissionType] = useState<SubmissionType>('video');
  const [mediaUrl, setMediaUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [assignmentId, setAssignmentId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (nextType: SubmissionType) => {
    setSubmissionType(nextType);
    setMediaUrl('');
    setFile(null);
    setStatus(null);
  };

  const handleFileChange = async (event: { currentTarget: HTMLInputElement }) => {
    const selected = event.currentTarget.files?.[0] ?? null;
    setStatus(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (submissionType === 'video') {
      try {
        await validateVideoDuration(selected);
        setFile(selected);
      } catch (err) {
        setFile(null);
        event.currentTarget.value = '';
        setStatus(err instanceof Error ? err.message : VIDEO_TOO_LONG_MESSAGE);
      }
      return;
    }

    setFile(selected);
  };

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      let storedUrl = mediaUrl.trim();
      let resolvedType = submissionType;
      let fileName: string | null = null;

      if (submissionType === 'link') {
        if (!storedUrl) {
          setStatus('Please paste a video or media link.');
          return;
        }
      } else {
        if (!file) {
          setStatus(`Please choose a ${SUBMISSION_TYPE_LABELS[submissionType].toLowerCase()} to upload.`);
          return;
        }

        const detectedType = inferSubmissionTypeFromFile(file);
        if (detectedType !== submissionType) {
          setStatus(`Please upload a file that matches "${SUBMISSION_TYPE_LABELS[submissionType]}".`);
          return;
        }

        if (file.size > SUBMISSION_MAX_BYTES[submissionType]) {
          setStatus(`File is too large. Maximum size is ${formatFileSize(SUBMISSION_MAX_BYTES[submissionType])}.`);
          return;
        }

        if (submissionType === 'video') {
          try {
            await validateVideoDuration(file);
          } catch (err) {
            setStatus(err instanceof Error ? err.message : VIDEO_TOO_LONG_MESSAGE);
            return;
          }
        }

        const uploadResult = await uploadStudentSubmission(supabase, studentId, file, submissionType);
        storedUrl = uploadResult.mediaUrl;
        fileName = uploadResult.fileName;
        resolvedType = submissionType;
      }

      const basePayload = {
        videoUrl: storedUrl,
        submissionType: resolvedType,
        fileName,
        notes: notes.trim() || null,
        assignmentId: assignmentId || null
      };

      const response = await fetch('/api/submissions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basePayload)
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setStatus(`Submission failed: ${payload.error ?? 'Unknown error'}`);
        return;
      }

      setMediaUrl('');
      setNotes('');
      setAssignmentId('');
      setFile(null);
      setStatus('Homework submitted successfully!');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setStatus(message.startsWith('Upload failed') || message.includes('Bucket') ? `Upload failed: ${message}` : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {assignments.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Assignment (optional)</label>
          <select
            value={assignmentId}
            onChange={(event) => setAssignmentId(event.currentTarget.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          >
            <option value="">General homework (no specific assignment)</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title}
                {assignment.due_date ? ` — due ${new Date(assignment.due_date).toLocaleDateString()}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <p className="block text-sm font-medium text-slate-700">Submission type / ዝርከብ ዓይነት ስራሕ</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(SUBMISSION_TYPE_LABELS) as SubmissionType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                submissionType === type
                  ? 'bg-slate-950 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {SUBMISSION_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {submissionType === 'link' ? (
        <div>
          <label className="block text-sm font-medium text-slate-700">Video or media link</label>
          <input
            type="url"
            placeholder="https://youtube.com/... or other link"
            value={mediaUrl}
            onChange={(event) => setMediaUrl(event.currentTarget.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Upload {SUBMISSION_TYPE_LABELS[submissionType].toLowerCase()}
          </label>
          <input
            type="file"
            accept={SUBMISSION_ACCEPT[submissionType]}
            onChange={handleFileChange}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-slate-700 outline-none"
          />
          <p className="mt-2 text-xs text-slate-500">
            Max size: {formatFileSize(SUBMISSION_MAX_BYTES[submissionType])}.
            {submissionType === 'video' && ' MP4, WebM, or MOV. Maximum length: 10 minutes.'}
            {submissionType === 'image' && ' JPG, PNG, WebP, or GIF.'}
            {submissionType === 'document' && ' PDF or Word document.'}
          </p>
          {file && (
            <p className="mt-1 text-xs text-slate-600">
              Selected: {file.name} ({formatFileSize(file.size)})
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">Notes / ተወሳኺ ሓበሬታ</label>
        <textarea
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.currentTarget.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          placeholder="Optional message for your teacher"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? 'Submitting...' : 'Submit Homework'}
      </button>

      {status && (
        <p className={`text-sm ${status.includes('successfully') ? 'text-emerald-700' : 'text-red-600'}`}>{status}</p>
      )}
    </form>
  );
}
