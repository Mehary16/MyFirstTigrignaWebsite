import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { dashboardPathForRole } from './lib/routes';
import { fetchProfileRole, resolveRoleFromAuth } from './lib/roleAuth';

const PROTECTED_PREFIXES = ['/teacher', '/parent', '/student'] as const;

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function dashboardForRole(role: string) {
  return dashboardPathForRole(role);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const code = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const error = request.nextUrl.searchParams.get('error');
  const errorCode = request.nextUrl.searchParams.get('error_code');

  if (
    (pathname === '/' || pathname === '/login') &&
    (error === 'access_denied' || errorCode === 'otp_expired')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = 'error=email-confirmation-failed';
    url.hash = '';
    return NextResponse.redirect(url);
  }

  if (pathname !== '/auth/callback' && pathname !== '/reset-password' && (code || tokenHash)) {
    const url = request.nextUrl.clone();
    const type = url.searchParams.get('type');

    if (type === 'recovery') {
      url.pathname = '/reset-password';
    } else {
      url.pathname = '/auth/callback';
      if (!url.searchParams.get('next')) {
        url.searchParams.set('next', '/auth/confirmed');
      }
    }

    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.hash = '';
    return NextResponse.redirect(url);
  }

  if (user?.user_metadata?.force_password_change && pathname !== '/change-password') {
    const url = request.nextUrl.clone();
    url.pathname = '/change-password';
    url.search = '';
    url.hash = '';
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/change-password' && !user.user_metadata?.force_password_change) {
    const profileRole = await fetchProfileRole(supabase, user.id);
    const role = resolveRoleFromAuth(user, profileRole);
    const url = request.nextUrl.clone();
    url.pathname = dashboardForRole(role);
    return NextResponse.redirect(url);
  }

  if (user && isProtectedPath(pathname)) {
    const profileRole = await fetchProfileRole(supabase, user.id);
    const role = resolveRoleFromAuth(user, profileRole);

    if (pathname.startsWith('/teacher') && role !== 'Teacher') {
      const url = request.nextUrl.clone();
      url.pathname = dashboardForRole(role);
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/parent') && role !== 'Parent') {
      const url = request.nextUrl.clone();
      url.pathname = dashboardForRole(role);
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/student') && role !== 'Student') {
      const url = request.nextUrl.clone();
      url.pathname = dashboardForRole(role);
      return NextResponse.redirect(url);
    }
  }

  if (user && pathname.startsWith('/student')) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'Student' && profile.is_active === false && pathname !== '/suspended') {
        const url = request.nextUrl.clone();
        url.pathname = '/suspended';
        return NextResponse.redirect(url);
      }
    } catch {
      return supabaseResponse;
    }
  }

  if (user && pathname === '/suspended') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile || profile.role !== 'Student' || profile.is_active !== false) {
        const url = request.nextUrl.clone();
        url.pathname = dashboardForRole(resolveRoleFromAuth(user, profile?.role));
        return NextResponse.redirect(url);
      }
    } catch {
      return supabaseResponse;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/', '/login', '/reset-password', '/change-password', '/student/:path*', '/parent/:path*', '/teacher/:path*', '/suspended']
};
