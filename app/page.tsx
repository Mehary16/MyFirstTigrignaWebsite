import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, GraduationCap, Users } from 'lucide-react';
import HomeHero from '../components/HomeHero';
import { createServerSupabaseClient } from '../lib/supabaseServer';
import { dashboardPathForRole } from '../lib/routes';
import { getUserRole } from '../lib/roleAuth';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let dashboardHref = '/login';
  let dashboardLabel = 'Login to your dashboard';

  if (user) {
    const role = await getUserRole(supabase, user);
    dashboardHref = dashboardPathForRole(role);
    dashboardLabel =
      role === 'Teacher' ? 'Teacher Dashboard' : role === 'Parent' ? 'Parent Dashboard' : 'Student Dashboard';
  }

  return (
    <section className="space-y-12">
      <HomeHero
        isLoggedIn={Boolean(user)}
        dashboardHref={user ? dashboardHref : undefined}
        dashboardLabel={user ? dashboardLabel : undefined}
      />

      <section className="rounded-[2.5rem] border border-amber-100/80 bg-white/70 p-8 shadow-card-lg backdrop-blur">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">How it works</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            A simple flow for students, teachers, and parents—so learning stays organized and easy to follow.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50/50 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-sm font-semibold text-white">
                1
              </span>
              <h3 className="text-base font-semibold text-slate-950">Choose your role</h3>
            </div>
            <p className="mt-3 text-sm text-slate-600">Student, Teacher, or Parent—each opens a clean dashboard.</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-50/50 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold text-white">
                2
              </span>
              <h3 className="text-base font-semibold text-slate-950">Learn and submit</h3>
            </div>
            <p className="mt-3 text-sm text-slate-600">Watch lessons, practice Tigrinya, and upload homework.</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-50/50 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                3
              </span>
              <h3 className="text-base font-semibold text-slate-950">Track progress</h3>
            </div>
            <p className="mt-3 text-sm text-slate-600">Teachers review and grade. Parents can follow progress.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">A Tigrigna learning portal that feels modern</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Everything is grouped by your class grade—so students see only their lessons and homework, while teachers manage the classroom in one place.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Grade-focused</p>
              <p className="mt-1 text-sm text-slate-600">Lessons, materials, and homework are filtered by class.</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Simple workflow</p>
              <p className="mt-1 text-sm text-slate-600">Open, submit, review—no confusion.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-amber-100/80 bg-slate-50 shadow-card-lg">
            <Image
              src="/images/home-featured-two-students-tigrinya.png"
              alt="Eritrean boy and girl reading a Tigrinya alphabet book together"
              width={1200}
              height={720}
              className="h-auto min-h-[280px] w-full object-cover object-center sm:min-h-[360px] lg:min-h-[420px]"
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4">
            <ul className="space-y-1.5 text-xs leading-relaxed text-slate-800 sm:space-y-2 sm:text-sm">
              <li className="font-ethiopic text-sm font-semibold text-slate-950 sm:text-base">
                ቋንቋኻ ፡ መንነትካ እዩ፣
              </li>
              <li className="font-medium text-slate-900">Bridge the gap between generations.</li>
              <li className="font-ethiopic font-semibold text-slate-950">ታሪኽካ ባዕልኻ ኣንብቦ.</li>
              <li className="text-slate-700">
                Master one of the world&apos;s oldest surviving indigenous scripts.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Get your dashboard</h2>
        <p className="text-sm text-slate-600">Pick the role you want, then sign in or create an account.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="elevated" className="group flex h-full flex-col transition hover:-translate-y-0.5 hover:shadow-card-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="info">Student</Badge>
              <div className="rounded-2xl bg-sky-50 p-2 text-sky-700">
                <BookOpen className="h-5 w-5" aria-hidden />
              </div>
            </div>
            <CardTitle className="text-xl">Student</CardTitle>
            <CardDescription>Lessons, materials, homework, and grades.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between">
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Watch video lessons for your grade</li>
              <li>• Upload homework and receive feedback</li>
              <li>• Track grades in one place</li>
            </ul>
            {!user ? (
              <Link href="/login?accountType=Student" className="link-button-secondary mt-6 inline-flex px-4 py-2 text-sm">
                Student login
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card variant="elevated" className="group flex h-full flex-col transition hover:-translate-y-0.5 hover:shadow-card-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="brand">Teacher</Badge>
              <div className="rounded-2xl bg-amber-50 p-2 text-amber-800">
                <GraduationCap className="h-5 w-5" aria-hidden />
              </div>
            </div>
            <CardTitle className="text-xl">Teacher</CardTitle>
            <CardDescription>Create lessons, review submissions, and manage grades.</CardDescription>
          </CardHeader>
          {!user ? (
            <CardContent className="flex flex-1 flex-col justify-between">
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Publish lessons and classroom materials</li>
                <li>• Review homework and provide feedback</li>
                <li>• Post grades per class grade</li>
              </ul>
              <Link href="/login" className="link-button-secondary mt-6 inline-flex px-4 py-2 text-sm">
                Teacher login
              </Link>
            </CardContent>
          ) : null}
        </Card>

        <Card variant="elevated" className="group flex h-full flex-col transition hover:-translate-y-0.5 hover:shadow-card-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="success">Parent</Badge>
              <div className="rounded-2xl bg-emerald-50 p-2 text-emerald-700">
                <Users className="h-5 w-5" aria-hidden />
              </div>
            </div>
            <CardTitle className="text-xl">Parent</CardTitle>
            <CardDescription>Follow homework and progress for your child.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between">
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• See grades and homework status</li>
              <li>• Track progress per class grade</li>
              <li>• Stay informed with updates</li>
            </ul>
            {!user ? (
              <Link href="/login?accountType=Parent" className="link-button-secondary mt-6 inline-flex px-4 py-2 text-sm">
                Parent login
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
