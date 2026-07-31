'use client';

import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { cn } from '../lib/cn';

export type AuthNavLinksProps = {
  isLoggedIn: boolean;
  dashboardHref?: string;
  dashboardLabel?: string;
  pathname: string;
  layout?: 'inline' | 'stacked';
};

function navLinkClass(layout: 'inline' | 'stacked') {
  return cn(
    'link-button-secondary text-sm',
    layout === 'inline' ? 'px-4 py-2' : 'w-full justify-start px-4 py-3'
  );
}

export default function AuthNavLinks({
  isLoggedIn,
  dashboardHref,
  dashboardLabel,
  pathname,
  layout = 'inline'
}: AuthNavLinksProps) {
  const onLoginPage = pathname === '/login';
  const onAboutPage = pathname === '/about';
  const onAlphabetPage = pathname === '/resources/alphabet';
  const onHelpPage = pathname === '/help';
  const onSettingsPage = pathname === '/settings';
  const onDashboard = Boolean(dashboardHref && pathname.startsWith(dashboardHref));
  const linkClass = navLinkClass(layout);

  return (
    <>
      <Link href="/" className={linkClass}>
        Home
      </Link>
      {!onAboutPage ? (
        <Link href="/about" className={linkClass}>
          About Us
        </Link>
      ) : null}
      {!onAlphabetPage ? (
        <Link href="/resources/alphabet" className={linkClass}>
          Alphabet / ፊደል
        </Link>
      ) : null}
      {!onHelpPage ? (
        <Link href="/help" className={linkClass}>
          Help
        </Link>
      ) : null}
      {isLoggedIn && dashboardHref && dashboardLabel && !onDashboard ? (
        <Link href={dashboardHref} className={linkClass}>
          {dashboardLabel}
        </Link>
      ) : null}
      {isLoggedIn && !onSettingsPage ? (
        <Link href="/settings" className={linkClass}>
          Settings
        </Link>
      ) : null}
      {isLoggedIn ? (
        <LogoutButton variant="primary" fullWidth={layout === 'stacked'} />
      ) : (
        !onLoginPage && (
          <Link
            href="/login"
            className={cn(
              'link-button-primary text-sm',
              layout === 'inline' ? 'px-4 py-2' : 'w-full justify-start px-4 py-3'
            )}
          >
            Login / መእተዊ
          </Link>
        )
      )}
    </>
  );
}
