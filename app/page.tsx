import Link from 'next/link';
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
    <section className="space-y-10">
      <HomeHero
        isLoggedIn={Boolean(user)}
        dashboardHref={user ? dashboardHref : undefined}
        dashboardLabel={user ? dashboardLabel : undefined}
      />

      <div>
        <h2 className="text-xl font-semibold text-slate-900">Choose your dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">Each role has its own organized workspace inside the portal.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="elevated" className="group transition hover:-translate-y-0.5 hover:shadow-card-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="info">Student</Badge>
              <div className="rounded-2xl bg-sky-50 p-2 text-sky-700">
                <BookOpen className="h-5 w-5" aria-hidden />
              </div>
            </div>
            <CardTitle className="text-xl">Student Dashboard</CardTitle>
            <CardDescription>Lessons, reading materials, homework uploads, and grades.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Sign up as <strong>Student</strong> at login.
            </p>
            {!user ? (
              <Link href="/login" className="link-button-secondary mt-4 inline-flex px-4 py-2 text-sm">
                Student login
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card variant="elevated" className="group transition hover:-translate-y-0.5 hover:shadow-card-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="brand">Teacher</Badge>
              <div className="rounded-2xl bg-amber-50 p-2 text-amber-800">
                <GraduationCap className="h-5 w-5" aria-hidden />
              </div>
            </div>
            <CardTitle className="text-xl">Teacher Dashboard</CardTitle>
            <CardDescription>Create lessons, review submissions, assign grades, and manage students.</CardDescription>
          </CardHeader>
          {!user ? (
            <CardContent>
              <Link href="/login" className="link-button-secondary inline-flex px-4 py-2 text-sm">
                Teacher login
              </Link>
            </CardContent>
          ) : null}
        </Card>

        <Card variant="elevated" className="group transition hover:-translate-y-0.5 hover:shadow-card-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="success">Parent</Badge>
              <div className="rounded-2xl bg-emerald-50 p-2 text-emerald-700">
                <Users className="h-5 w-5" aria-hidden />
              </div>
            </div>
            <CardTitle className="text-xl">Parent Dashboard</CardTitle>
            <CardDescription>View linked children, homework activity, and grades from the teacher.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Sign up as <strong>Parent</strong>, then ask the teacher to link your child.
            </p>
            {!user ? (
              <Link href="/login" className="link-button-secondary mt-4 inline-flex px-4 py-2 text-sm">
                Parent login
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
