'use client';

import { usePathname } from 'next/navigation';
import AuthNavLinks from './AuthNavLinks';
import MobileNavMenu from './MobileNavMenu';

type AuthNavClientProps = {
  isLoggedIn: boolean;
  dashboardHref?: string;
  dashboardLabel?: string;
};

export default function AuthNavClient({ isLoggedIn, dashboardHref, dashboardLabel }: AuthNavClientProps) {
  const pathname = usePathname();
  const sharedProps = { isLoggedIn, dashboardHref, dashboardLabel, pathname };

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
