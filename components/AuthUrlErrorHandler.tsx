'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

function hasAuthLinkError(search: string, hash: string) {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));

  const error = query.get('error') ?? fragment.get('error');
  const errorCode = query.get('error_code') ?? fragment.get('error_code');

  return error === 'access_denied' || errorCode === 'otp_expired';
}

export default function AuthUrlErrorHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/' && pathname !== '/login') return;
    if (!hasAuthLinkError(window.location.search, window.location.hash)) return;

    router.replace('/login?error=email-confirmation-failed');
  }, [pathname, router]);

  return null;
}
