'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveDashboardPath } from '../lib/resolveDashboard';
import { syncRoleAndGetDashboardPath } from '../lib/clientRoleSync';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';

export default function AuthConfirmedClient() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeSignIn = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login?error=email-confirmation-failed');
        return;
      }

      try {
        const syncedPath = await syncRoleAndGetDashboardPath();
        const path = syncedPath ?? (await resolveDashboardPath(supabase, user.id, user));

        window.setTimeout(() => {
          router.replace(path);
        }, 2500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not finish signing you in.');
      }
    };

    completeSignIn();
  }, [router, supabase]);

  if (error) {
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
        <h1 className="text-2xl font-semibold text-red-900">Sign-in could not be completed</h1>
        <p className="mt-3 text-sm text-red-800">{error}</p>
        <button
          type="button"
          onClick={() => router.replace('/login')}
          className="mt-6 rounded-full bg-red-900 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800"
        >
          Go to login
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white">
        ✓
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-emerald-950">Email confirmed successfully!</h1>
      <p className="mt-2 text-lg font-medium text-emerald-900">ኢሜይልኩም ብዓወት ተረጋጊጹ!</p>
      <p className="mt-4 text-sm text-emerald-800">
        Your account is ready. We are taking you to your dashboard now...
      </p>
      <p className="mt-1 text-sm text-emerald-700">ናብ ዳሽቦርድኩም ይወሰዱ ኣለው...</p>
      <div className="mt-6 inline-flex items-center gap-2 text-sm text-emerald-800">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-700" />
        Redirecting...
      </div>
    </section>
  );
}
