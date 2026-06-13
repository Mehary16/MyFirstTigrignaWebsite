'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'teacher@example.com';

async function resolveDashboardPath(supabase: ReturnType<typeof createBrowserSupabaseClient>, userId: string, email: string | undefined, metadataRole?: string) {
  const lowerEmail = email?.toLowerCase() ?? '';
  if (lowerEmail === ADMIN_EMAIL.toLowerCase() || metadataRole?.toLowerCase() === 'teacher') {
    return '/teacher/dashboard';
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (profile?.role === 'Teacher') {
    return '/teacher/dashboard';
  }

  return '/student/dashboard';
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signUp') {
        const role = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'Teacher' : 'Student';

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

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            role
          });
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[2rem] border border-amber-100 bg-slate-950 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight">Login / መእተዊ</h1>
        <p className="mt-4 max-w-xl text-white/75">Students enter lessons, documents, and homework. Teachers publish content, manage materials, and review submissions.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">ብኽልተ ቋንቋታት ምእታውን ምዝገባን</p>
            <p className="mt-2 text-sm text-white/75">Bilingual login and signup</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">መምህር</p>
            <p className="mt-2 text-sm text-white/75">Teacher role by email or metadata</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">ተማሃሮ</p>
            <p className="mt-2 text-sm text-white/75">Protected dashboard access</p>
          </div>
        </div>
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
          <div>
            <label className="block text-sm font-medium text-slate-700">Full name / ስም</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-slate-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700">Email / ኢሜይል</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Password / መሕለፊ ቃል</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
