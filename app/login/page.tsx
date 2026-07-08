'use client';

import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';
import { resolveDashboardPath } from '../../lib/resolveDashboard';
import { syncRoleAndGetDashboardPath } from '../../lib/clientRoleSync';
import { getEmailConfirmRedirectUrl } from '../../lib/siteUrl';
import { TIGRINYA_ALPHABET } from '../../lib/tigrinyaAlphabet';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import ClassGradeSelect from '../../components/ClassGradeSelect';
import Input from '../../components/ui/Input';
import EritreanHeritagePattern from '../../components/EritreanHeritagePattern';
import { cn } from '../../lib/cn';
import type { ClassGrade } from '../../lib/classGrades';

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
    languageTi: 'ትግ'
  },
  ti: {
    tagline: 'ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ',
    welcomeTitle: 'እንቋዕ ብሰላም መጻእኩም',
    welcomeBody: 'ናብ መድረኽ ትምህርቲ ትግርኛ እንቋዕ ብሰላም መጻእኩም። ናብ ዳሽቦርድኹም ንምእታው እተዉ ወይ ተመዝገቡ ዝብለ ጠውቁ።',
    roleStudents: 'ተማሃሮ — ትምህርቲ ንምምሃር፡ ዕዮ ገዛ ምርካብ፡ ነጥብታት ንምርኣይ',
    roleTeachers: 'መማህራን — ትምህርቲ ምቕራብን ክፍሊ ምምሕዳርን',
    roleParents: 'ወለዲ — ዕቤት ቆልዖምን ነጥብታትን ምርኣይን ምክትታልን',
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
    signUpSuccess: 'ሕሳብ ተፈጢሩ። ኢሜይልኩም ተመልክቶ ኣሎ። ኣብቲ ምርግጋፅ ሊንክ ጠዊቕኩም ቀጽሉ።',
    emailConfirmFailed: 'ኢሜይል ምርግጋጽ ኣይተኻእለን። ዳግም ተመዝገቡ ወይ እተዉ።',
    passwordResetFailed: 'መሕለፊ ቃል ምቕይር ሊንክ ጊዜኡ ጸኒሑ። ዳግም ሓዱሽ ሊንክ ሓቲትኩም።',
    forgotPassword: 'መሕለፊ ቃል ረሲዕኩም?',
    supabaseConfigError:
      'Supabase ዝደለኽምዎ ክንረክቦ ኣይከኣልናን። NEXT_PUBLIC_SUPABASE_URLን NEXT_PUBLIC_SUPABASE_ANON_KEYን ኣብ .env.local ኣረጋግጹ፣ ድሕሪኡ dev server ዳግም ጽቀጡ።',
    languageEn: 'EN',
    languageTi: 'ትግ'
  }
};

const LOCALE_STORAGE_KEY = 'login-locale';

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const alphabetPreview = useMemo(() => TIGRINYA_ALPHABET.slice(0, 8), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [accountType, setAccountType] = useState<'Student' | 'Parent'>('Student');
  const [classGrade, setClassGrade] = useState<ClassGrade | ''>('Grade 1');
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
    const modeParam = params.get('mode');
    const accountTypeParam = params.get('accountType');
    const errorParam = params.get('error');

    if (modeParam === 'signup') {
      setMode('signUp');
    } else if (modeParam === 'signin') {
      setMode('signIn');
    }

    if (accountTypeParam === 'Student' || accountTypeParam === 'Parent') {
      setAccountType(accountTypeParam);
    }

    if (errorParam === 'email-confirmation-failed') {
      setError(copy.emailConfirmFailed);
      params.delete('error');
      const nextQuery = params.toString();
      window.history.replaceState({}, '', nextQuery ? `/login?${nextQuery}` : '/login');
    }
    if (errorParam === 'password-reset-failed') {
      setError(copy.passwordResetFailed);
      params.delete('error');
      const nextQuery = params.toString();
      window.history.replaceState({}, '', nextQuery ? `/login?${nextQuery}` : '/login');
    }
  }, [copy.emailConfirmFailed, copy.passwordResetFailed]);

  const switchLocale = (next: LoginLocale) => {
    setLocale(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  };

  const redirectAuthenticatedUser = async (options?: { accountType?: 'Student' | 'Parent'; fullName?: string; classGrade?: ClassGrade | null }) => {
    const syncedPath = await syncRoleAndGetDashboardPath(options);
    if (syncedPath) {
      router.replace(syncedPath);
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const path = await resolveDashboardPath(supabase, data.user.id, data.user);
      router.replace(path);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        if (data.user.user_metadata?.force_password_change) {
          router.replace('/change-password');
          return;
        }

        await redirectAuthenticatedUser();
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
        if (accountType === 'Student' && !classGrade) {
          setError('Please select a class grade.');
          return;
        }

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
              role: accountType,
              ...(accountType === 'Student' ? { class_grade: classGrade || undefined } : {})
            }
          }
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.session && data.user) {
          if (data.user.user_metadata?.force_password_change) {
            router.replace('/change-password');
            return;
          }

          await redirectAuthenticatedUser({
            accountType,
            fullName,
            classGrade: accountType === 'Student' ? (classGrade || null) : null
          });
          return;
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
          if (userData.user.user_metadata?.force_password_change) {
            router.replace('/change-password');
            return;
          }

          await redirectAuthenticatedUser();
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
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <Card
        padding="none"
        className="relative overflow-hidden border-brand-900/20 bg-brand-900 text-white shadow-card-lg"
      >
        <div className="relative h-72 sm:h-80 lg:h-96">
          <Image
            src="/images/eritrean-heritage-red-sea-hero-v2.png"
            alt="Eritrean heritage panorama: traditional stone house, women carrying water, highlands, Asmara, and the Red Sea"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/25 to-transparent" />
          <EritreanHeritagePattern className="absolute bottom-0 left-0 right-0 h-12 text-amber-300/30" />
        </div>

        <div className="relative px-8 pb-8 pt-6">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">{copy.tagline}</p>
          <h1 className="mt-4 font-ethiopic-display text-4xl font-semibold leading-tight">{copy.welcomeTitle}</h1>
          <p className="mt-4 max-w-xl text-white/75">{copy.welcomeBody}</p>

          <ul className="mt-8 space-y-3 border-t border-white/10 pt-6 text-sm text-white/75">
            <li>{copy.roleStudents}</li>
            <li>{copy.roleTeachers}</li>
            <li>{copy.roleParents}</li>
          </ul>

          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                  {locale === 'ti' ? 'ፊደላት ትግርኛ' : 'Tigrinya Alphabet'}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {locale === 'ti'
                    ? 'ንምምሃር ዝሕግዙ መበገሲ ፊደላት'
                    : 'Starter fidel letters shown in Tigrinya script.'}
                </p>
              </div>
              <span className="rounded-full border border-amber-200/40 bg-amber-100/20 px-3 py-1 text-xs font-medium text-amber-100">
                8
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {alphabetPreview.map((entry) => (
                <div
                  key={`${entry.char}-${entry.transliteration}`}
                  className="rounded-2xl border border-amber-200/30 bg-amber-50/95 px-3 py-4 text-center shadow-sm"
                >
                  <p className="font-ethiopic-display text-3xl font-semibold text-brand-900">{entry.char}</p>
                  <p className="mt-1 text-xs font-medium text-amber-800">
                    {locale === 'ti' ? 'ፊደል' : 'Fidel'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
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
          {accountType === 'Student' && (
            <ClassGradeSelect
              label={locale === 'ti' ? 'ደረጃ ትምህርቲ' : 'Class grade'}
              placeholder={locale === 'ti' ? 'ደረጃ ትምህርቲ ምረጽ/ጺ' : 'Select grade'}
              value={classGrade}
              onChange={setClassGrade}
              optionLabels={
                locale === 'ti'
                  ? { 'Grade 1': '1ይ ክፍሊ', 'Grade 2': '2ይ ክፍሊ', 'Grade 3': '3ይ ክፍሊ' }
                  : undefined
              }
            />
          )}
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
