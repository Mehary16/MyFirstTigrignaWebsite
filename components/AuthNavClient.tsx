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
    <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
      <Link href="/" className="link-button-secondary">
        Home
      </Link>
      {isLoggedIn ? (
        <LogoutButton variant="primary" />
      ) : (
        !onLoginPage && (
          <Link href="/login" className="link-button-primary px-4 py-2 text-sm">
            Login / መእተዊ
          </Link>
        )
      )}
    </nav>
  );
}
