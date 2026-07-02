'use client';

import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';
import { ensureUserProfile, resolveDashboardPath } from '../../lib/resolveDashboard';
import { getEmailConfirmRedirectUrl } from '../../lib/siteUrl';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { cn } from '../../lib/cn';

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
    emailConfirmFailed: string;
    passwordResetFailed: string;
    forgotPassword: string;
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
    signUpSuccess: 'Account created. Check your email and click the confirmation link to continue.',
    emailConfirmFailed: 'Email confirmation failed or expired. Please sign up again or log in.',
    passwordResetFailed: 'Password reset link expired or invalid. Please request a new reset link.',
    forgotPassword: 'Forgot password?',
    supabaseConfigError:
      'Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.',
    languageEn: 'EN',
    languageTi: '??'
  },
  ti: {
    tagline: '????? ??? ???? ?? ???',
    welcomeTitle: '???? ???? ?????',
    welcomeBody: '?? ???? ????? ???? ???? ???? ?????? ?? ??????? ????? ??? ?? ????? ??? ????',
    roleStudents: '???? — ????? ?????? ?? ?? ????? ????? ?????',
    roleTeachers: '????? — ????? ????? ??? ??????',
    roleParents: '??? — ??? ????? ?????? ????? ??????',
    login: '???',
    signUp: '?????',
    accountType: '???? ???',
    student: '????',
    parent: '???',
    fullName: '??',
    email: '????',
    password: '???? ??',
    showPassword: '???? ?? ???',
    hidePassword: '???? ?? ???',
    processing: '???? ??...',
    signUpSuccess: '??? ????? ?????? ????? ??? ??? ????? ??? ????? ????',
    emailConfirmFailed: '???? ????? ???????? ??? ????? ?? ????',
    passwordResetFailed: '???? ?? ???? ??? ??? ???? ??? ??? ??? ??????',
    forgotPassword: '???? ?? ??????',
    supabaseConfigError:
      'Supabase ?????? ????? ???????? NEXT_PUBLIC_SUPABASE_URL? NEXT_PUBLIC_SUPABASE_ANON_KEY? ?? .env.local ?????? ???? dev server ??? ????',
    languageEn: 'EN',
    languageTi: '??'
  }
};

const LOCALE_STORAGE_KEY = 'login-locale';

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam === 'email-confirmation-failed') {
      setError(copy.emailConfirmFailed);
      window.history.replaceState({}, '', '/login');
    }
    if (errorParam === 'password-reset-failed') {
      setError(copy.passwordResetFailed);
      window.history.replaceState({}, '', '/login');
    }
  }, [copy.emailConfirmFailed, copy.passwordResetFailed]);

  const switchLocale = (next: LoginLocale) => {
    setLocale(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        if (data.user.user_metadata?.force_password_change) {
          router.replace('/change-password');
          return;
        }

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

        let emailRedirectTo: string;
        try {
          emailRedirectTo = getEmailConfirmRedirectUrl();
        } catch (configError) {
          setError(
            configError instanceof Error
              ? configError.message
              : 'Production site URL is not configured. Set NEXT_PUBLIC_SITE_URL to your live domain.'
          );
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
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
          await ensureUserProfile(supabase, userData.user);

          if (userData.user.user_metadata?.force_password_change) {
            router.replace('/change-password');
            return;
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
      <Card
        padding="lg"
        className="border-brand-900/20 bg-brand-900 text-white shadow-card-lg"
      >
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">{copy.tagline}</p>
        <h1 className="mt-4 font-ethiopic text-4xl font-semibold leading-tight">{copy.welcomeTitle}</h1>
        <p className="mt-4 max-w-xl text-white/75">{copy.welcomeBody}</p>

        <ul className="mt-8 space-y-3 text-sm text-white/75">
          <li>{copy.roleStudents}</li>
          <li>{copy.roleTeachers}</li>
          <li>{copy.roleParents}</li>
        </ul>
      </Card>

      <Card padding="lg" className="relative pt-14 shadow-card-lg sm:pt-8">
        <div className="absolute right-8 top-8">
          <div
            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              onClick={() => switchLocale('en')}
              className={cn(
                'rounded-full px-3 py-1 transition',
                locale === 'en' ? 'bg-brand-900 text-white' : 'text-slate-600 hover:text-slate-900'
              )}
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
              className={cn(
                'rounded-full px-3 py-1 transition',
                locale === 'ti' ? 'bg-brand-900 text-white' : 'text-slate-600 hover:text-slate-900'
              )}
              aria-pressed={locale === 'ti'}
            >
              {copy.languageTi}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pr-28">
          <Button type="button" variant={mode === 'signIn' ? 'primary' : 'secondary'} onClick={() => setMode('signIn')}>
            {copy.login}
          </Button>
          <Button type="button" variant={mode === 'signUp' ? 'primary' : 'secondary'} onClick={() => setMode('signUp')}>
            {copy.signUp}
          </Button>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {mode === 'signUp' && (
          <>
          <div>
            <p className="block text-sm font-medium text-slate-700">{copy.accountType}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['Student', 'Parent'] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={accountType === type ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setAccountType(type)}
                >
                  {type === 'Student' ? copy.student : copy.parent}
                </Button>
              ))}
            </div>
          </div>
          <Input
            label={copy.fullName}
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.currentTarget.value)}
            required
          />
          </>
        )}

        <Input
          label={copy.email}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          required
        />

        <div className="relative">
          <Input
            label={copy.password}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            required
            minLength={8}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-[2.35rem] rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={showPassword ? copy.hidePassword : copy.showPassword}
          >
            {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
          </button>
          {mode === 'signIn' && (
            <p className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm font-semibold text-slate-700 hover:underline">
                {copy.forgotPassword}
              </Link>
            </p>
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}

        <Button type="submit" disabled={loading} fullWidth size="lg">
          {loading ? copy.processing : mode === 'signUp' ? copy.signUp : copy.login}
        </Button>
        </form>
      </Card>
    </div>
  );
}
