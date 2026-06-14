import Link from 'next/link';
import { createServerSupabaseClient } from '../lib/supabaseServer';
import { dashboardPathForRole } from '../lib/routes';

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
    const role =
      user.email?.toLowerCase() === adminEmail.toLowerCase() ? 'Teacher' : profile?.role ?? 'Student';
    dashboardHref = dashboardPathForRole(role);
    dashboardLabel =
      role === 'Teacher'
        ? 'Teacher Dashboard'
        : role === 'Parent'
          ? 'Parent Dashboard'
          : 'Student Dashboard';
  }

  return (
    <section className="-mx-4 -mt-2 space-y-8 rounded-[2rem] bg-gradient-to-b from-blue-600 via-blue-500 to-blue-700 px-4 py-10 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="rounded-3xl border border-blue-200/30 bg-white/95 p-8 shadow-lg shadow-blue-900/20 backdrop-blur">
        <h2 className="text-3xl font-semibold text-slate-900">Welcome to ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ</h2>
        <p className="mt-4 max-w-2xl text-slate-600">
          A safe learning environment for students aged 6-17 to practice Tigrigna through videos, reading materials, and
          homework submissions. Teachers manage classes; parents track their children&apos;s grades.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {!user ? (
            <Link href="/login" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Login / መእተዊ
            </Link>
          ) : (
            <Link href={dashboardHref} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Go to {dashboardLabel}
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h3 className="text-xl font-semibold">Student Dashboard</h3>
          <p className="mt-3 text-slate-600">Lessons, reading materials, homework uploads, and grades.</p>
          <p className="mt-2 text-sm text-slate-500">Sign up as <strong>Student</strong> at login.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h3 className="text-xl font-semibold">Teacher Dashboard</h3>
          <p className="mt-3 text-slate-600">Create lessons, review submissions, assign grades, and manage students.</p>
          <p className="mt-2 text-sm text-slate-500">Use the teacher email set in <code className="text-xs">NEXT_PUBLIC_ADMIN_EMAIL</code>.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h3 className="text-xl font-semibold">Parent Dashboard</h3>
          <p className="mt-3 text-slate-600">View linked children, homework activity, and grades from the teacher.</p>
          <p className="mt-2 text-sm text-slate-500">Sign up as <strong>Parent</strong>, then ask the teacher to link your child.</p>
        </div>
      </div>
    </section>
  );
}
