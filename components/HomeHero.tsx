import Link from 'next/link';
import { BookOpen, GraduationCap, Sparkles, Users } from 'lucide-react';

type HomeHeroProps = {
  dashboardHref?: string;
  dashboardLabel?: string;
  isLoggedIn: boolean;
};

export default function HomeHero({ dashboardHref, dashboardLabel, isLoggedIn }: HomeHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-amber-100/80 bg-white shadow-card-lg">
      <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(251,191,36,0.12),transparent_45%)]" />

      <div className="relative grid gap-10 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Welcome / እንቋዕ ብሰላም መጻእኩም
          </p>

          <div className="space-y-3">
            <h1 className="font-ethiopic-display text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
              A safe, organized learning home for students aged 6–17 — with video lessons, reading materials,
              homework, and grades in one bilingual portal.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isLoggedIn && dashboardHref && dashboardLabel ? (
              <Link href={dashboardHref} className="link-button-primary px-6 py-3.5 text-base">
                Go to {dashboardLabel}
              </Link>
            ) : (
              <Link href="/login" className="link-button-primary px-6 py-3.5 text-base">
                Login / መእተዊ
              </Link>
            )}
            <Link href="/login?mode=signup&accountType=Student" className="link-button-secondary px-6 py-3.5 text-base">
              Create account
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {['Video lessons', 'Reading materials', 'Homework', 'Parent progress'].map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-5 transition hover:-translate-y-0.5 hover:shadow-card">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-2.5 text-sky-700 shadow-sm">
                <BookOpen className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Students</p>
                <p className="text-xs text-slate-600">Learn at your own pace</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50/80 p-5 transition hover:-translate-y-0.5 hover:shadow-card">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-2.5 text-amber-800 shadow-sm">
                <GraduationCap className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Teachers</p>
                <p className="text-xs text-slate-600">Lessons, grades, and class tools</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5 transition hover:-translate-y-0.5 hover:shadow-card sm:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-2.5 text-emerald-700 shadow-sm">
                <Users className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Parents</p>
                <p className="text-xs text-slate-600">Follow homework and progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
