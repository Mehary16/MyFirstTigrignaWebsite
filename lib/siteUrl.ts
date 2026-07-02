import type { NextRequest } from 'next/server';

function normalizeSiteUrl(url: string) {
  return url.replace(/\/$/, '');
}

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/**
 * Base URL for email confirmation and password-reset links.
 * Never falls back to localhost — set NEXT_PUBLIC_SITE_URL to your live domain.
 */
export function getAuthRedirectBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  }

  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${normalizeSiteUrl(process.env.NEXT_PUBLIC_VERCEL_URL)}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${normalizeSiteUrl(process.env.VERCEL_URL)}`;
  }

  if (typeof window !== 'undefined') {
    const { origin, hostname } = window.location;
    if (!isLocalHost(hostname)) {
      return origin;
    }
  }

  throw new Error(
    'NEXT_PUBLIC_SITE_URL is not configured. Set it to your production URL (for example https://your-domain.com) in Vercel and in .env.local, then redeploy.'
  );
}

/** Browser: current site. Server: env, request host, or production URL helper. */
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

  return getAuthRedirectBaseUrl();
}

/** Prefer the live request host on the server (production deploys). */
export function getSiteUrlFromRequest(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') ?? (host?.includes('localhost') ? 'http' : 'https');

  if (host && !isLocalHost(host.split(':')[0])) {
    return `${proto}://${host}`;
  }

  return getAuthRedirectBaseUrl();
}

export function getEmailConfirmRedirectUrl() {
  const next = encodeURIComponent('/auth/confirmed');
  return `${getAuthRedirectBaseUrl()}/auth/callback?next=${next}`;
}

export function getPasswordResetRedirectUrl() {
  return `${getAuthRedirectBaseUrl()}/reset-password`;
}

/** Add these exact URLs in Supabase → Authentication → URL Configuration → Redirect URLs */
export function getSupabaseRedirectAllowList() {
  const base = getAuthRedirectBaseUrl();
  return [`${base}/auth/callback`, `${base}/reset-password`, `${base}/auth/confirmed`];
}
