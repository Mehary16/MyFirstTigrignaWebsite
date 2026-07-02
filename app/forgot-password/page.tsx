'use client';

import { useMemo, useState, type ComponentProps } from 'react';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';
import { getPasswordResetRedirectUrl } from '../../lib/siteUrl';

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      let redirectTo: string;
      try {
        redirectTo = getPasswordResetRedirectUrl();
      } catch (configError) {
        setError(
          configError instanceof Error
            ? configError.message
            : 'Production site URL is not configured. Set NEXT_PUBLIC_SITE_URL to your live domain.'
        );
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage('If an account exists for that email, a reset link has been sent. Check your inbox.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <h1 className="text-2xl font-semibold text-slate-950">Reset your password</h1>
      <p className="mt-2 text-sm text-slate-600">Enter your email and we will send you a link to choose a new password.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            required
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="font-semibold text-slate-900 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
