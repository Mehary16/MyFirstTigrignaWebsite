import Link from 'next/link';
import { BookOpen, GraduationCap, Users } from 'lucide-react';
import { createServerSupabaseClient } from '../lib/supabaseServer';
import { dashboardPathForRole } from '../lib/routes';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader } from '../components/ui';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let dashboardHref = '/login';
  let dashboardLabel = 'Login to your dashboard';

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'teacher@example.com';
    const role = user.email?.toLowerCase() === adminEmail.toLowerCase() ? 'Teacher' : profile?.role ?? 'Student';
    dashboardHref = dashboardPathForRole(role);
    dashboardLabel =
      role === 'Teacher' ? 'Teacher Dashboard' : role === 'Parent' ? 'Parent Dashboard' : 'Student Dashboard';
  }

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Welcome / እንቋዕ ብሰላም መጻእኩም"
        title="Welcome to ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ"
        description="A safe learning environment for students aged 6–17 to practice Tigrigna through videos, reading materials, and homework submissions. Teachers manage classes; parents track their children's progress."
        actions={
          user ? (
            <Link href={dashboardHref} className="link-button-primary">
              Go to {dashboardLabel}
            </Link>
          ) : undefined
        }
      />

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
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
