import type { NextRequest } from 'next/server';

function normalizeSiteUrl(url: string) {
  return url.replace(/\/$/, '');
}

/** Browser: always use the current site. Server: env, request host, or localhost fallback. */
export function getSiteUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}

/** Prefer the live request host on the server (production deploys). */
export function getSiteUrlFromRequest(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') ?? (host?.includes('localhost') ? 'http' : 'https');

  if (host) {
    return `${proto}://${host}`;
  }

  return getSiteUrl();
}

export function getEmailConfirmRedirectUrl() {
  const next = encodeURIComponent('/auth/confirmed');
  return `${getSiteUrl()}/auth/callback?next=${next}`;
}
