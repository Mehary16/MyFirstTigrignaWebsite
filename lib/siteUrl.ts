export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3000';
}

export function getEmailConfirmRedirectUrl() {
  const next = encodeURIComponent('/auth/confirmed');
  return `${getSiteUrl()}/auth/callback?next=${next}`;
}
