'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { COOKIE_NOTICE } from '../lib/legalCopy';

const CONSENT_STORAGE_KEY = 'cookie-consent-v1';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-body"
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-card-lg sm:inset-x-auto sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p id="cookie-notice-title" className="text-sm font-semibold text-slate-950">
            {COOKIE_NOTICE.title}
          </p>
          <p id="cookie-notice-body" className="mt-1 text-sm leading-relaxed text-slate-600">
            {COOKIE_NOTICE.body}{' '}
            <Link href="/privacy" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
              {COOKIE_NOTICE.privacyLabel}
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={accept}
          className="link-button-primary shrink-0 px-5 py-2.5 text-sm"
        >
          {COOKIE_NOTICE.acceptLabel}
        </button>
      </div>
    </div>
  );
}
