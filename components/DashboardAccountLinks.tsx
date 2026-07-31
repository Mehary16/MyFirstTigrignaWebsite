import Link from 'next/link';
import { KeyRound, Settings } from 'lucide-react';

export default function DashboardAccountLinks() {
  return (
    <>
      <Link
        href="/settings#password"
        className="link-button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
      >
        <KeyRound className="h-4 w-4" aria-hidden />
        Change password
      </Link>
      <Link href="/settings" className="link-button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm">
        <Settings className="h-4 w-4" aria-hidden />
        Settings
      </Link>
    </>
  );
}
