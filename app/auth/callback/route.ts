import { createServerClient } from '@supabase/ssr';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { getSiteUrlFromRequest } from '../../../lib/siteUrl';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/auth/confirmed';
  const siteUrl = getSiteUrlFromRequest(request);
  const successUrl = `${siteUrl}${next.startsWith('/') ? next : `/${next}`}`;
  const failureUrl =
    next === '/reset-password'
      ? `${siteUrl}/login?error=password-reset-failed`
      : `${siteUrl}/login?error=email-confirmation-failed`;

  let response = NextResponse.redirect(successUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.redirect(successUrl);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType
    });

    if (!error) {
      return response;
    }
  }

  // Recovery links sometimes only include type=recovery without code (hash handled on client)
  if (type === 'recovery' && !code && !tokenHash) {
    return NextResponse.redirect(`${siteUrl}/reset-password${requestUrl.hash}`);
  }

  return NextResponse.redirect(failureUrl);
}
