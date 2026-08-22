'use client';

import { usePathname } from 'next/navigation';
import type { UserRole } from '../lib/routes';
import AuthNavLinks from './AuthNavLinks';
import MobileNavMenu from './MobileNavMenu';

type AuthNavClientProps = {
  isLoggedIn: boolean;
  role?: UserRole;
  dashboardHref?: string;
  dashboardLabel?: string;
  alphabetHref?: string;
};

export default function AuthNavClient({
  isLoggedIn,
  role,
  dashboardHref,
  dashboardLabel,
  alphabetHref
}: AuthNavClientProps) {
  const pathname = usePathname();
  const sharedProps = { isLoggedIn, role, dashboardHref, dashboardLabel, alphabetHref, pathname };

  return (
    <>
      <nav className="hidden flex-wrap items-center gap-3 text-sm font-medium lg:flex">
        <AuthNavLinks {...sharedProps} layout="inline" />
      </nav>
      <MobileNavMenu>
        <AuthNavLinks {...sharedProps} layout="stacked" />
      </MobileNavMenu>
    </>
  );
}
