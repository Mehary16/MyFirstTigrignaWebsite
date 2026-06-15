'use client';

import { useEffect } from 'react';

export default function StudentDashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="rounded-3xl border border-red-200 bg-red-50 p-8">
      <h1 className="text-2xl font-semibold text-red-900">Student dashboard could not load</h1>
      <p className="mt-3 text-sm text-red-800">
        Run these SQL files in Supabase SQL Editor, in order:{' '}
        <code className="rounded bg-red-100 px-1">FIX_RLS_RECURSION.sql</code>,{' '}
        <code className="rounded bg-red-100 px-1">FIX_MATERIAL_TYPES.sql</code>, then{' '}
        <code className="rounded bg-red-100 px-1">FIX_STUDENT_PROFILES.sql</code>.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <p className="mt-3 rounded bg-red-100/80 px-3 py-2 font-mono text-xs text-red-900">{error.message}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-red-900 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800"
      >
        Try again
      </button>
    </section>
  );
}
