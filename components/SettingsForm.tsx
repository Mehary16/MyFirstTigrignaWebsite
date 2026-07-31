'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import { dashboardPathForRole, type UserRole } from '../lib/routes';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  preferenceLabel,
  preferencesForRole,
  readPreferencesFromUserMetadata,
  type NotificationPreferenceKey,
  type NotificationPreferences
} from '../lib/notificationPreferences';
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from './ui';

type SettingsFormProps = {
  email: string;
  fullName: string;
  role: UserRole;
  initialPreferences: NotificationPreferences;
};

export default function SettingsForm({ email, fullName: initialFullName, role, initialPreferences }: SettingsFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [fullName, setFullName] = useState(initialFullName);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [preferences, setPreferences] = useState(initialPreferences);
  const [preferencesBusy, setPreferencesBusy] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const preferenceKeys = useMemo(() => preferencesForRole(role), [role]);

  useEffect(() => {
    if (window.location.hash !== '#password') return;
    const section = document.getElementById('password');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileBusy(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName })
      });
      const payload = (await response.json()) as { error?: string; fullName?: string };

      if (!response.ok) {
        setProfileError(payload.error ?? 'Could not update profile.');
        return;
      }

      setProfileMessage('Profile updated.');
      if (payload.fullName) setFullName(payload.fullName);
      router.refresh();
    } finally {
      setProfileBusy(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { force_password_change: false }
      });

      if (error) {
        setPasswordError(error.message);
        return;
      }

      setPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password updated.');
    } finally {
      setPasswordBusy(false);
    }
  };

  const togglePreference = (key: NotificationPreferenceKey) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const savePreferences = async (event: React.FormEvent) => {
    event.preventDefault();
    setPreferencesBusy(true);
    setPreferencesError(null);
    setPreferencesMessage(null);

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });
      const payload = (await response.json()) as { error?: string; preferences?: NotificationPreferences };

      if (!response.ok) {
        setPreferencesError(payload.error ?? 'Could not save notification preferences.');
        return;
      }

      if (payload.preferences) {
        setPreferences(payload.preferences);
      }

      setPreferencesMessage('Notification preferences saved.');
    } finally {
      setPreferencesBusy(false);
    }
  };

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setDeleteError(null);

    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('Type DELETE to confirm.');
      return;
    }

    setDeleteBusy(true);

    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deleteConfirmation })
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setDeleteError(payload.error ?? 'Could not delete account.');
        return;
      }

      router.replace('/');
      router.refresh();
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update how your name appears across the portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={saveProfile}>
            <Input label="Email" type="email" value={email} disabled hint="Your login email cannot be changed here." />
            <Input
              label="Full name"
              value={fullName}
              onChange={(event) => setFullName(event.currentTarget.value)}
              required
              minLength={2}
              maxLength={120}
            />
            {profileError ? <Alert variant="error">{profileError}</Alert> : null}
            {profileMessage ? <Alert variant="success">{profileMessage}</Alert> : null}
            <Button type="submit" disabled={profileBusy}>
              {profileBusy ? 'Saving...' : 'Save profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card id="password" variant="elevated" className="scroll-mt-28">
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Set a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={savePassword}>
            <Input
              label="New password"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.currentTarget.value)}
              required
            />
            {passwordError ? <Alert variant="error">{passwordError}</Alert> : null}
            {passwordMessage ? <Alert variant="success">{passwordMessage}</Alert> : null}
            <Button type="submit" disabled={passwordBusy}>
              {passwordBusy ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>Choose which in-app notifications you want to receive.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={savePreferences}>
            <div className="space-y-3">
              {preferenceKeys.map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={preferences[key] ?? DEFAULT_NOTIFICATION_PREFERENCES[key]}
                    onChange={() => togglePreference(key)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-700/20"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{preferenceLabel(key)}</span>
                  </span>
                </label>
              ))}
            </div>
            {preferencesError ? <Alert variant="error">{preferencesError}</Alert> : null}
            {preferencesMessage ? <Alert variant="success">{preferencesMessage}</Alert> : null}
            <Button type="submit" disabled={preferencesBusy}>
              {preferencesBusy ? 'Saving...' : 'Save preferences'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card variant="elevated" className="border-red-100">
        <CardHeader>
          <CardTitle className="text-red-800">Delete account</CardTitle>
          <CardDescription>
            Permanently remove your account and sign out. This cannot be undone.
            {role === 'Teacher' ? ' As the teacher account, this will remove your admin access.' : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={deleteAccount}>
            <Input
              label='Type "DELETE" to confirm'
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.currentTarget.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
            {deleteError ? <Alert variant="error">{deleteError}</Alert> : null}
            <Button type="submit" variant="danger" disabled={deleteBusy}>
              {deleteBusy ? 'Deleting...' : 'Delete my account'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={() => router.push(dashboardPathForRole(role))}>
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
