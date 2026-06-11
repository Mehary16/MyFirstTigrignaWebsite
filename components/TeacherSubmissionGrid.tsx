'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';

type SubmissionRow = {
  id: string;
  video_url: string;
  notes: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  }[] | null;
};

export default function TeacherSubmissionGrid() {
  const supabase = createBrowserSupabaseClient();
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubmissions = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('submissions')
        .select('id, video_url, notes, created_at, profiles(full_name)')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setSubmissions(data ?? []);
      }
      setLoading(false);
    };

    loadSubmissions();
  }, [supabase]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Student submissions</h2>
          <p className="mt-2 text-slate-600">Review the latest homework submissions by student.</p>
        </div>
      </div>

      {loading && <p className="text-slate-600">Loading submissions...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !submissions.length && <p className="text-slate-600">No submissions yet.</p>}

      <div className="grid gap-4">
        {submissions.map((submission) => {
          const studentName = submission.profiles?.[0]?.full_name || 'Unknown student';
          return (
            <article key={submission.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{studentName}</p>
                  <p className="text-sm text-slate-500">{new Date(submission.created_at).toLocaleString()}</p>
                </div>
                <a
                  href={submission.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  View submission
                </a>
              </div>
              {submission.notes && <p className="mt-3 text-slate-600">Notes: {submission.notes}</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
