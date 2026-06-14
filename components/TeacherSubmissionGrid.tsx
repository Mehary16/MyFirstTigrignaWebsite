'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import { formatDatabaseError } from '../lib/supabaseErrors';
import { getSubmissionViewLabel, type SubmissionType } from '../lib/submissionMedia';

type SubmissionRow = {
  id: string;
  video_url: string | null;
  submission_type: SubmissionType;
  file_name: string | null;
  notes: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  } | {
    full_name: string;
  }[] | null;
};

function getStudentName(profiles: SubmissionRow['profiles']) {
  if (!profiles) return 'Unknown student';
  if (Array.isArray(profiles)) return profiles[0]?.full_name || 'Unknown student';
  return profiles.full_name;
}

export default function TeacherSubmissionGrid() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubmissions = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('submissions')
        .select('id, video_url, submission_type, file_name, notes, created_at, profiles(full_name)')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(formatDatabaseError(fetchError.message));
        setSubmissions([]);
      } else {
        setSubmissions((data ?? []) as SubmissionRow[]);
      }

      setLoading(false);
    };

    loadSubmissions();
  }, [supabase]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Student homework / ናይ ተማሃሮ ስራሕ ቤት</h2>
        <p className="mt-2 text-slate-600">Homework submitted by your students appears here.</p>
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
          const mediaUrl = submission.video_url;
          return (
            <article key={submission.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{studentName}</p>
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
            </article>
          );
        })}
      </div>
    </div>
  );
}
