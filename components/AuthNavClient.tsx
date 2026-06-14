'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

type AuthNavClientProps = {
  isLoggedIn: boolean;
};

export default function AuthNavClient({ isLoggedIn }: AuthNavClientProps) {
  const pathname = usePathname();
  const onLoginPage = pathname === '/login';

  return (
    <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
      <Link
        href="/"
        className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-slate-300 hover:bg-slate-50"
      >
        Home
      </Link>
      {isLoggedIn ? (
        <LogoutButton className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" />
      ) : (
        !onLoginPage && (
          <Link href="/login" className="rounded-full bg-slate-950 px-4 py-2 text-white transition hover:bg-slate-800">
            Login / መእተዊ
          </Link>
        )
      )}
    </nav>
  );
}
