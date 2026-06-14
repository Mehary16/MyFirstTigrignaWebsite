import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { createServerSupabaseClient } from '../lib/supabaseServer';

export default async function AuthNav() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
      <Link
        href="/"
        className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-slate-300 hover:bg-slate-50"
      >
        Home
      </Link>
      {user ? (
        <LogoutButton className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" />
      ) : (
        <Link href="/login" className="rounded-full bg-slate-950 px-4 py-2 text-white transition hover:bg-slate-800">
          Login / መእተዊ
        </Link>
      )}
    </nav>
  );
}
