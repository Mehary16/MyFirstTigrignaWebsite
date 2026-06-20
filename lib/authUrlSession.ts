import type { EmailOtpType, SupabaseClient } from '@supabase/supabase-js';

type EstablishSessionResult = { ok: true } | { ok: false; error: string };

function cleanAuthParamsFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('token_hash');
  url.searchParams.delete('type');
  url.hash = '';
  window.history.replaceState({}, '', url.pathname + url.search);
}

/** Establish a Supabase session from auth link query params or URL hash (client only). */
export async function establishSessionFromAuthUrl(supabase: SupabaseClient): Promise<EstablishSessionResult> {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = (url.searchParams.get('type') ?? hashParams.get('type')) as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { ok: false, error: error.message };
    }
    cleanAuthParamsFromUrl();
    return { ok: true };
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      return { ok: false, error: error.message };
    }
    cleanAuthParamsFromUrl();
    return { ok: true };
  }

  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    cleanAuthParamsFromUrl();
    return { ok: true };
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    return { ok: true };
  }

  return { ok: false, error: 'No valid reset session found.' };
}
