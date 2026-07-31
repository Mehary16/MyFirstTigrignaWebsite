'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

type AuthNavClientProps = {
  isLoggedIn: boolean;
  dashboardHref?: string;
  dashboardLabel?: string;
};

export default function AuthNavClient({ isLoggedIn, dashboardHref, dashboardLabel }: AuthNavClientProps) {
  const pathname = usePathname();
  const onLoginPage = pathname === '/login';
  const onAboutPage = pathname === '/about';
  const onSettingsPage = pathname === '/settings';
  const onDashboard = Boolean(dashboardHref && pathname.startsWith(dashboardHref));

  return (
    <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
      <Link href="/" className="link-button-secondary">
        Home
      </Link>
      {!onAboutPage ? (
        <Link href="/about" className="link-button-secondary">
          About Us
        </Link>
      ) : null}
      {isLoggedIn && dashboardHref && dashboardLabel && !onDashboard ? (
        <Link href={dashboardHref} className="link-button-secondary">
          {dashboardLabel}
        </Link>
      ) : null}
      {isLoggedIn && !onSettingsPage ? (
        <Link href="/settings" className="link-button-secondary">
          Settings
        </Link>
      ) : null}
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
