'use client';

import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';
import { dashboardPathForRole } from '../../lib/routes';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'teacher@example.com';

async function resolveDashboardPath(supabase: ReturnType<typeof createBrowserSupabaseClient>, userId: string, email: string | undefined, metadataRole?: string) {
  const lowerEmail = email?.toLowerCase() ?? '';
  if (lowerEmail === ADMIN_EMAIL.toLowerCase() || metadataRole?.toLowerCase() === 'teacher') {
    return '/teacher/dashboard';
  }

  const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', userId).maybeSingle();
  if (profile?.role === 'Teacher') {
    return '/teacher/dashboard';
  }

  if (profile?.role === 'Parent') {
    return '/parent/dashboard';
  }

  if (profile?.is_active === false) {
    return '/suspended';
  }

  return dashboardPathForRole(profile?.role);
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [accountType, setAccountType] = useState<'Student' | 'Parent'>('Student');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const path = await resolveDashboardPath(
          supabase,
          data.user.id,
          data.user.email,
          (data.user.user_metadata?.role as string | undefined) ?? (data.user.app_metadata?.role as string | undefined)
        );
        router.replace(path);
      }
    };
    checkSession();
  }, [router, supabase]);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signUp') {
        const role = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'Teacher' : accountType;

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role
            }
          }
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        // Profile is created by a Supabase trigger; upsert here only as a fallback when a session exists.
        if (data.session && data.user) {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            role,
            email: email.trim().toLowerCase()
          });
          if (profileError) {
            console.error('Profile upsert failed:', profileError.message);
          }
        }

        setMessage('መመዝገቢ መልእኽቲ ተሰዲዱ ኣሎ። ኢሜይልካ ምስ ተራጋገጸ እቶ።');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) {
          setError(signInError.message);
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
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      if (message === 'Failed to fetch') {
        setError(
          'Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.'
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[2rem] border border-amber-100 bg-slate-950 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight">Login / መእተዊ</h1>
        <p className="mt-4 max-w-xl text-white/75">
          Welcome to the Tigrigna learning portal. Sign in or create an account to access your dashboard.
        </p>

        <ul className="mt-8 space-y-3 text-sm text-white/75">
          <li>
            <strong className="text-white">Students</strong> — lessons, homework, and grades
          </li>
          <li>
            <strong className="text-white">Teachers</strong> — publish content and manage the class
          </li>
          <li>
            <strong className="text-white">Parents</strong> — view your child&apos;s progress and grades
          </li>
        </ul>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex gap-3">
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-sm font-semibold ${mode === 'signIn' ? 'bg-slate-950 text-white' : 'border border-slate-300 text-slate-700'}`}
            onClick={() => setMode('signIn')}
          >
            Login
          </button>
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-sm font-semibold ${mode === 'signUp' ? 'bg-slate-950 text-white' : 'border border-slate-300 text-slate-700'}`}
            onClick={() => setMode('signUp')}
          >
            Sign up / ምዝገባ
          </button>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {mode === 'signUp' && (
          <>
          <div>
            <p className="block text-sm font-medium text-slate-700">Account type</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['Student', 'Parent'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAccountType(type)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    accountType === type ? 'bg-slate-950 text-white' : 'border border-slate-300 text-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Full name / ስም</label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.currentTarget.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-slate-500"
            />
          </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700">Email / ኢሜይል</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            required
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Password / መሕለፊ ቃል</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            required
            minLength={8}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-slate-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? 'Processing ...' : mode === 'signUp' ? 'Sign up / መመዝገቢ' : 'Login / እተው'}
        </button>
        </form>
      </section>
    </div>
  );
}
