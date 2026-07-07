'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getScrollTargetId, highlightScrollTarget } from '../lib/notificationLinks';

export default function DashboardScrollTarget() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const targetId = getScrollTargetId(searchParams);
    if (!targetId) return;

    const scrollToTarget = () => {
      const element = document.getElementById(targetId);
      if (element) {
        highlightScrollTarget(element);
      }
    };

    const timeout = window.setTimeout(scrollToTarget, 150);
    return () => window.clearTimeout(timeout);
  }, [pathname, searchParams]);

  return null;
}
