'use client';

import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { BookOpen, Eye, EyeOff, GraduationCap, Sparkles, Users } from 'lucide-react';
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
    fullNamePlaceholder: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
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
    formLoginSubtitle: string;
    formSignUpSubtitle: string;
    exploreAlphabet: string;
    aboutUs: string;
    backHome: string;
    howItWorks: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    heritageGreen: string;
    heritageBlue: string;
    heritageGold: string;
    studentCardHint: string;
    teacherCardHint: string;
    parentCardHint: string;
    teachers: string;
    gradeRequired: string;
    contactTeacher: string;
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
    fullNamePlaceholder: 'Write your full name',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Put your password',
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
    languageTi: 'ትግ',
    formLoginSubtitle: 'Sign in to open your dashboard — lessons, homework, and grades in one place.',
    formSignUpSubtitle: 'Create a free account in under a minute. Students pick a class grade to get the right content.',
    exploreAlphabet: 'Explore full alphabet →',
    aboutUs: 'About us',
    backHome: '← Home',
    howItWorks: 'How it works',
    step1Title: 'Choose your role',
    step1Body: 'Student, Teacher, or Parent — each gets a focused dashboard.',
    step2Title: 'Learn and submit',
    step2Body: 'Watch lessons, practice Tigrinya, and upload homework.',
    step3Title: 'Track progress',
    step3Body: 'Teachers review work. Parents follow grades and updates.',
    heritageGreen: 'ቋንቋኻ ፡ መንነትካ ኢዩ፣',
    heritageBlue: 'ታሪኽካ ባዕልኻ ኣንብቦ.',
    heritageGold: 'Master one of the world\'s oldest surviving indigenous scripts.',
    studentCardHint: 'Learn at your own pace',
    teacherCardHint: 'Lessons, grades, and class tools',
    parentCardHint: 'Follow homework and progress',
    teachers: 'Teachers',
    gradeRequired: 'Please select a class grade.',
    contactTeacher: 'Questions? Email Teacher Mehary'
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
    fullNamePlaceholder: 'ምሉእ ስምካ ጽሓፍ',
    emailPlaceholder: 'ኢሜይልካ ኣእትው',
    passwordPlaceholder: 'መሕለፊ ቃል ኣእትው',
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
    languageTi: 'ትግ',
    formLoginSubtitle: 'ናብ ዳሽቦርድኹም እተዉ — ትምህርቲ፡ ዕዮ ገዛን ነጥብታትን ኣብ ሓደ ቦታ።',
    formSignUpSubtitle: 'ብኣድኑ ኣካውንት ፈጠሩ። ተማሃራይ ንዝግበረሉ ትምህርቲ ደረጃ ትምህርቲ ምረጹ።',
    exploreAlphabet: 'ኩሉ ፊደላት ርአ →',
    aboutUs: 'ብዛዕባና',
    backHome: '← መጀመርታ',
    howItWorks: 'ከመይ ይሰርሕ',
    step1Title: 'ዓይነት ሕሳብ ምረጽ',
    step1Body: 'ተማሃራይ፣ መምህር ወይ ወለዲ — ነፍሲ ወከፍ ዳሽቦርድ ይረኸብ።',
    step2Title: 'ምምሃርን ምስጋምን',
    step2Body: 'ትምህርቲ ተዓዘት፣ ትግርኛ ተለማመድ፣ ዕዮ ገዛ ኣእቱ።',
    step3Title: 'ዕቤት ምክትታል',
    step3Body: 'መምህር ይገምግም። ወለዲ ነጥብታትን ዕቤትን ይከታተሉ።',
    heritageGreen: 'ቋንቋኻ ፡ መንነትካ ኢዩ፣',
    heritageBlue: 'ታሪኽካ ባዕልኻ ኣንብቦ.',
    heritageGold: 'ሓደ ካብቶም ዝነቡ ቋንቋታት ጥንታዊ ፊደላት ተማሃር።',
    studentCardHint: 'ብናይ ዓይነትካ ፍጥነት ተማሃር',
    teacherCardHint: 'ትምህርቲ፣ ነጥብታትን ክፍሊን',
    parentCardHint: 'ዕዮ ገዛን ዕቤትን ርአ',
    teachers: 'መማህራን',
    gradeRequired: 'ደረጃ ትምህርቲ ምረጽ/ጺ።',
    contactTeacher: 'ሕቶታት? መምህር መሓሪ ኣይንኣለም ኢሜል ገለጹ'
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
          setError(copy.gradeRequired);
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
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Card
          padding="none"
          className="relative overflow-hidden border-brand-900/20 !bg-brand-900 text-white shadow-card-lg"
        >
          <div className="relative h-56 sm:h-64 lg:h-72">
            <Image
              src="/images/home-featured-two-students-tigrinya.png"
              alt="Eritrean students reading a Tigrinya alphabet book together"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/50 to-brand-900/25" />
            <EritreanHeritagePattern className="absolute bottom-0 left-0 right-0 h-10 text-amber-300/30" />
          </div>

          <div className="relative bg-brand-900 px-6 pb-8 pt-6 sm:px-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-100/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {copy.tagline}
            </p>
            <h1 className="mt-4 font-ethiopic-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
              {copy.welcomeTitle}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">{copy.welcomeBody}</p>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-sky-200/20 bg-sky-400/10 p-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-white/10 p-2 text-sky-200">
                    <BookOpen className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{copy.student}</p>
                    <p className="text-[11px] text-white/70">{copy.studentCardHint}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200/20 bg-amber-400/10 p-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-white/10 p-2 text-amber-200">
                    <GraduationCap className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{copy.teachers}</p>
                    <p className="text-[11px] text-white/70">{copy.teacherCardHint}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200/20 bg-emerald-400/10 p-3 sm:col-span-3 lg:col-span-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-white/10 p-2 text-emerald-200">
                    <Users className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{copy.parent}</p>
                    <p className="text-[11px] text-white/70">{copy.parentCardHint}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-1.5">
              <div className="rounded-xl border border-[#078930]/40 bg-[#078930]/25 px-3 py-2">
                <p className="font-ethiopic text-sm font-semibold text-white">{copy.heritageGreen}</p>
              </div>
              <div className="rounded-xl border border-[#4189DD]/40 bg-[#4189DD]/20 px-3 py-2">
                <p className="font-ethiopic text-sm font-semibold text-white">{copy.heritageBlue}</p>
              </div>
              <div className="rounded-xl border border-[#F7D020]/40 bg-[#F7D020]/15 px-3 py-2">
                <p className="text-xs text-amber-100">{copy.heritageGold}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
                    {locale === 'ti' ? 'ፊደላት ትግርኛ' : 'Tigrinya Alphabet'}
                  </p>
                  <p className="mt-1 text-sm text-white/75">
                    {locale === 'ti'
                      ? 'ንምምሃር ዝሕግዙ መበገሲ ፊደላት'
                      : 'Starter fidel letters shown in Tigrinya script.'}
                  </p>
                </div>
                <Link
                  href="/resources/alphabet"
                  className="text-xs font-semibold text-amber-200 hover:text-white hover:underline"
                >
                  {copy.exploreAlphabet}
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {alphabetPreview.map((entry) => (
                  <div
                    key={`${entry.char}-${entry.transliteration}`}
                    className="rounded-2xl border border-amber-200/30 bg-amber-50/95 px-2 py-3 text-center shadow-sm"
                  >
                    <p className="font-ethiopic-display text-2xl font-semibold text-brand-900 sm:text-3xl">{entry.char}</p>
                    <p className="mt-1 text-[11px] font-medium text-amber-800">{entry.transliteration.trim()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="relative shadow-card-lg">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2 pr-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {mode === 'signIn' ? copy.login : copy.signUp}
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                {mode === 'signIn' ? copy.formLoginSubtitle : copy.formSignUpSubtitle}
              </p>
            </div>
            <div
              className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold"
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

          <div
            className="inline-flex w-full rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-semibold"
            role="group"
            aria-label="Account mode"
          >
            <button
              type="button"
              onClick={() => setMode('signIn')}
              className={cn(
                'flex-1 rounded-full px-4 py-2 transition',
                mode === 'signIn' ? 'bg-brand-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              )}
              aria-pressed={mode === 'signIn'}
            >
              {copy.login}
            </button>
            <button
              type="button"
              onClick={() => setMode('signUp')}
              className={cn(
                'flex-1 rounded-full px-4 py-2 transition',
                mode === 'signUp' ? 'bg-brand-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              )}
              aria-pressed={mode === 'signUp'}
            >
              {copy.signUp}
            </button>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
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
                  placeholder={copy.fullNamePlaceholder}
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
              placeholder={copy.emailPlaceholder}
              required
            />

            <div className="relative">
              <Input
                label={copy.password}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                placeholder={copy.passwordPlaceholder}
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

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.howItWorks}</p>
            <ol className="mt-3 space-y-3">
              {[
                { title: copy.step1Title, body: copy.step1Body, color: 'bg-brand-900' },
                { title: copy.step2Title, body: copy.step2Body, color: 'bg-amber-500' },
                { title: copy.step3Title, body: copy.step3Body, color: 'bg-emerald-600' }
              ].map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
                      step.color
                    )}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className={cn('text-sm font-semibold text-slate-900', locale === 'ti' && 'font-ethiopic')}>
                      {step.title}
                    </p>
                    <p className={cn('text-xs text-slate-600', locale === 'ti' && 'font-ethiopic')}>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm">
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="font-semibold text-slate-700 hover:text-brand-800 hover:underline">
                {copy.backHome}
              </Link>
              <Link href="/about" className="font-semibold text-slate-700 hover:text-brand-800 hover:underline">
                {copy.aboutUs}
              </Link>
            </div>
            <a
              href="mailto:mehary.aynealem1@gmail.com"
              className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
            >
              {copy.contactTeacher}
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
