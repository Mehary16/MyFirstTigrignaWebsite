'use client';

import { useMemo, useState } from 'react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import { getEmailConfirmRedirectUrl } from '../lib/siteUrl';
import Button from './ui/Button';

type SocialLoginButtonsProps = {
  disabled?: boolean;
};

export default function SocialLoginButtons({ disabled = false }: SocialLoginButtonsProps) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [busyProvider, setBusyProvider] = useState<'google' | 'azure' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (provider: 'google' | 'azure') => {
    setError(null);
    setBusyProvider(provider);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getEmailConfirmRedirectUrl()
        }
      });

      if (oauthError) {
        setError(oauthError.message);
      }
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative py-1 text-center">
        <span className="bg-white px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Or continue with
        </span>
        <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-slate-200" aria-hidden />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="secondary"
          fullWidth
          disabled={disabled || busyProvider !== null}
          onClick={() => void signIn('google')}
        >
          {busyProvider === 'google' ? 'Redirecting...' : 'Google'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          disabled={disabled || busyProvider !== null}
          onClick={() => void signIn('azure')}
        >
          {busyProvider === 'azure' ? 'Redirecting...' : 'Microsoft'}
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        SSO requires Google or Microsoft providers to be enabled in your Supabase project settings.
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
