'use client';

import { useEffect } from 'react';
import { captureClientError } from '../lib/errorMonitoring';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureClientError(error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-700">Error</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Something went wrong</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            An unexpected error occurred. You can try again, or return to the home page.
          </p>
          {error.message ? (
            <p className="mt-4 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left font-mono text-xs text-red-900">
              {error.message}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
