'use client';

import type { AlphabetActivityType } from '../lib/alphabetProgressDb';

export async function logAlphabetActivity(payload: {
  activityType: AlphabetActivityType;
  formKey?: string;
  familyId?: string;
  correct?: boolean;
  metadata?: Record<string, unknown>;
}) {
  try {
    await fetch('/api/alphabet/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    // Activity logging should not block learning.
  }
}
