'use client';

import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';
import { establishSessionFromAuthUrl } from '../../lib/authUrlSession';
import { resolveDashboardPath } from '../../lib/resolveDashboard';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyResetLink = async () => {
      setVerifying(true);
      setError(null);

      const result = await establishSessionFromAuthUrl(supabase);

      if (!result.ok) {
        router.replace('/login?error=password-reset-failed');
        return;
      }

      setReady(true);
      setVerifying(false);
    };

    verifyResetLink();
  }, [router, supabase]);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const path = await resolveDashboardPath(
          supabase,
          userData.user.id,
          userData.user.email,
          (userData.user.user_metadata?.role as string | undefined) ?? (userData.user.app_metadata?.role as string | undefined)
        );
        router.replace(path);
      } else {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying || !ready) {
    return (
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Verifying reset link...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <h1 className="text-2xl font-semibold text-slate-950">Choose a new password</h1>
      <p className="mt-2 text-sm text-slate-600">Enter your new password below.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700">New password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            required
            minLength={8}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            required
            minLength={8}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
        >
          {loading ? 'Saving...' : 'Update password'}
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
