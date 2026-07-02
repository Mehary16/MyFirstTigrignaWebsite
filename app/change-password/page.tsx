'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';
import { resolveDashboardPath } from '../../lib/resolveDashboard';
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '../../components/ui';

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      if (!user.user_metadata?.force_password_change) {
        const path = await resolveDashboardPath(
          supabase,
          user.id,
          user.email,
          (user.user_metadata?.role as string | undefined) ?? (user.app_metadata?.role as string | undefined)
        );
        router.replace(path);
        return;
      }

      setChecking(false);
    };

    load();
  }, [router, supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { force_password_change: false }
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const path = await resolveDashboardPath(
        supabase,
        user.id,
        user.email,
        (user.user_metadata?.role as string | undefined) ?? (user.app_metadata?.role as string | undefined)
      );
      router.replace(path);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="py-10 text-center text-slate-600">Checking your account...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md" variant="elevated">
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>
          This account was created by your teacher. Set your own password to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="New password"
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            required
          />
          {error ? <Alert variant="error">{error}</Alert> : null}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Saving...' : 'Update password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
