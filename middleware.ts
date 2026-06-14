import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (user && pathname.startsWith('/student')) {
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
  }

  if (user && pathname === '/suspended') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'Student' || profile.is_active !== false) {
      const url = request.nextUrl.clone();
      if (profile?.role === 'Teacher') url.pathname = '/teacher/dashboard';
      else if (profile?.role === 'Parent') url.pathname = '/parent/dashboard';
      else url.pathname = '/student/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/student/:path*', '/suspended']
};
