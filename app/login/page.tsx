'use client';

import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';
import { dashboardPathForRole } from '../../lib/routes';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'teacher@example.com';

type LoginLocale = 'en' | 'ti';

const LOGIN_COPY: Record<
  LoginLocale,
  {
    tagline: string;
    welcomeTitle: string;
    welcomeBody: string;
    roleStudents: string;
    roleTeachers: string;
    roleParents: string;
    login: string;
    signUp: string;
    accountType: string;
    student: string;
    parent: string;
    fullName: string;
    email: string;
    password: string;
    showPassword: string;
    hidePassword: string;
    processing: string;
    signUpSuccess: string;
    supabaseConfigError: string;
    languageEn: string;
    languageTi: string;
  }
> = {
  en: {
    tagline: 'Tigrigna language learning portal',
    welcomeTitle: 'Welcome',
    welcomeBody: 'Welcome to the Tigrigna learning portal. Sign in or create an account to access your dashboard.',
    roleStudents: 'Students — lessons, homework, and grades',
    roleTeachers: 'Teachers — publish content and manage the class',
    roleParents: 'Parents — view your child\'s progress and grades',
    login: 'Login',
    signUp: 'Sign up',
    accountType: 'Account type',
    student: 'Student',
    parent: 'Parent',
    fullName: 'Full name',
    email: 'Email',
    password: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    processing: 'Processing...',
    signUpSuccess: 'Sign-up message sent. Check your email to confirm your account.',
    supabaseConfigError:
      'Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.',
    languageEn: 'EN',
    languageTi: 'ትግ'
  },
  ti: {
    tagline: 'ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ',
    welcomeTitle: 'እንቋዕ ብሰላም መጻእኩም',
    welcomeBody: 'ናብ መድረኽ ትምህርቲ ትግርኛ እንኳዕ በደህና መጻእኩም። ንዳሽቦርድኩም ንምእታው እተዉ ወይ ተመዝገቡ።',
    roleStudents: 'ተማሃሮ — ትምህርቲ፣ ዕዮ ገዛ ምርካብ፣ ነጥብታት',
    roleTeachers: 'መማህራን — ትምህርቲ ምቕራብን ክፍሊ ምምሕዳርን',
    roleParents: 'ወለዲ — ዕቤት ቆልዖምን ነጥብታትን ምርኣይ',
    login: 'እተዉ',
    signUp: 'ተመዝገቡ',
    accountType: 'ዓይነት ሕሳብ',
    student: 'ተማሃሮ',
    parent: 'ወለዲ',
    fullName: 'ስም',
    email: 'ኢሜይል',
    password: 'መሕለፊ ቃል',
    showPassword: 'መሕለፊ ቃል ረኣይ',
    hidePassword: 'መሕለፊ ቃል ሕብእ',
    processing: 'ይሰርሕ ኣሎ...',
    signUpSuccess: 'መመዝገቢ መልእኽቲ ተሰዲዱ ኣሎ። ኢሜይልኩም ምስ ተራጋገጸ እተዉ።',
    supabaseConfigError:
      'Supabase ዝደለኽምዎ ክንረክቦ ኣይከኣልናን። NEXT_PUBLIC_SUPABASE_URLን NEXT_PUBLIC_SUPABASE_ANON_KEYን ኣብ .env.local ኣረጋግጹ፣ ድሕሪኡ dev server ዳግም ጽቀጡ።',
    languageEn: 'EN',
    languageTi: 'ትግ'
  }
};

const LOCALE_STORAGE_KEY = 'login-locale';

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
  const [showPassword, setShowPassword] = useState(false);
  const [locale, setLocale] = useState<LoginLocale>('en');

  const copy = LOGIN_COPY[locale];

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'en' || stored === 'ti') {
      setLocale(stored);
    }
  }, []);

  const switchLocale = (next: LoginLocale) => {
    setLocale(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  };

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

        setMessage(copy.signUpSuccess);
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
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userData.user.id)
            .maybeSingle();

          if (!existingProfile) {
            const metaRole = (userData.user.user_metadata?.role as string | undefined)?.toLowerCase();
            const role =
              userData.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
                ? 'Teacher'
                : metaRole === 'parent'
                  ? 'Parent'
                  : 'Student';

            await supabase.from('profiles').upsert({
              id: userData.user.id,
              full_name: (userData.user.user_metadata?.full_name as string | undefined) ?? userData.user.email?.split('@')[0] ?? 'Student',
              role,
              email: userData.user.email?.trim().toLowerCase(),
              is_active: true
            });
          }

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
        setError(copy.supabaseConfigError);
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
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">{copy.tagline}</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight">{copy.welcomeTitle}</h1>
        <p className="mt-4 max-w-xl text-white/75">{copy.welcomeBody}</p>

        <ul className="mt-8 space-y-3 text-sm text-white/75">
          <li>{copy.roleStudents}</li>
          <li>{copy.roleTeachers}</li>
          <li>{copy.roleParents}</li>
        </ul>
      </section>

      <section className="relative rounded-[2rem] border border-slate-200 bg-white p-8 pt-14 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:pt-8">
        <div className="absolute right-8 top-8">
          <div
            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              onClick={() => switchLocale('en')}
              className={`rounded-full px-3 py-1 transition ${
                locale === 'en' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-pressed={locale === 'en'}
            >
              {copy.languageEn}
            </button>
            <span className="px-0.5 text-slate-300" aria-hidden>
              |
            </span>
            <button
              type="button"
              onClick={() => switchLocale('ti')}
              className={`rounded-full px-3 py-1 transition ${
                locale === 'ti' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-pressed={locale === 'ti'}
            >
              {copy.languageTi}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pr-28">
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-sm font-semibold ${mode === 'signIn' ? 'bg-slate-950 text-white' : 'border border-slate-300 text-slate-700'}`}
            onClick={() => setMode('signIn')}
          >
            {copy.login}
          </button>
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-sm font-semibold ${mode === 'signUp' ? 'bg-slate-950 text-white' : 'border border-slate-300 text-slate-700'}`}
            onClick={() => setMode('signUp')}
          >
            {copy.signUp}
          </button>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {mode === 'signUp' && (
          <>
          <div>
            <p className="block text-sm font-medium text-slate-700">{copy.accountType}</p>
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
                  {type === 'Student' ? copy.student : copy.parent}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{copy.fullName}</label>
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
          <label className="block text-sm font-medium text-slate-700">{copy.email}</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            required
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">{copy.password}</label>
          <div className="relative mt-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              minLength={8}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 pr-12 text-slate-900 outline-none transition focus:border-slate-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              aria-label={showPassword ? copy.hidePassword : copy.showPassword}
            >
              {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? copy.processing : mode === 'signUp' ? copy.signUp : copy.login}
        </button>
        </form>
      </section>
    </div>
  );
}
