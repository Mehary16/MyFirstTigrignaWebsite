'use client';

import { createBrowserSupabaseClient } from './supabaseClient';
import type { ClassGrade } from './classGrades';

/** Sync server role (app_metadata + profiles) then return dashboard path. */
export async function syncRoleAndGetDashboardPath(options?: {
  accountType?: 'Student' | 'Parent';
  fullName?: string;
  classGrade?: ClassGrade | null;
}): Promise<string | null> {
  const response = await fetch('/api/auth/sync-role', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options ?? {})
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { dashboardPath?: string };
  const supabase = createBrowserSupabaseClient();
  await supabase.auth.refreshSession();

  return payload.dashboardPath ?? null;
}
