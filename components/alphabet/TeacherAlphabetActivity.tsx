'use client';

import { useEffect, useState } from 'react';
import { activityLabel, type AlphabetActivityRow } from '../../lib/alphabetProgressDb';
import Badge from '../ui/Badge';

export default function TeacherAlphabetActivity() {
  const [activities, setActivities] = useState<AlphabetActivityRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'learn' | 'trace' | 'quiz_answer' | 'quiz_start'>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = filter === 'all' ? '' : `?type=${filter}&limit=100`;
        const response = await fetch(`/api/alphabet/activity${query}`);
        const payload = (await response.json()) as { activities?: AlphabetActivityRow[]; error?: string };
        if (!response.ok) {
          if (active) setError(payload.error ?? 'Could not load alphabet activity.');
          return;
        }
        if (active) setActivities(payload.activities ?? []);
      } catch {
        if (active) setError('Could not load alphabet activity.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [filter]);

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Alphabet activity log</p>
          <p className="text-xs text-slate-500">See who is tracing letters, studying, or taking the quiz.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'learn', 'trace', 'quiz_start', 'quiz_answer'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === option ? 'bg-brand-900 text-white' : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {option === 'all' ? 'All' : activityLabel(option)}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading activity…</p>
      ) : activities.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Student / user</th>
                <th className="px-3 py-2">Activity</th>
                <th className="px-3 py-2">Details</th>
                <th className="px-3 py-2">Result</th>
                <th className="px-3 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-900">{item.profiles?.full_name ?? 'User'}</p>
                    <p className="text-xs text-slate-500">
                      {item.profiles?.class_grade ? `${item.profiles.class_grade} · ` : ''}
                      {item.profiles?.email ?? item.user_id.slice(0, 8)}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={item.activity_type.startsWith('quiz') ? 'brand' : 'info'}>
                      {activityLabel(item.activity_type)}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {item.form_key ?? item.family_id ?? '—'}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {item.activity_type === 'quiz_answer'
                      ? item.correct
                        ? 'Correct'
                        : 'Wrong'
                      : '—'}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No alphabet activity yet. Students will appear here when they study or take the quiz.</p>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Run <code className="rounded bg-slate-100 px-1">supabase/FIX_ALPHABET_PROGRESS.sql</code> if this section shows a database error.
      </p>
    </div>
  );
}
