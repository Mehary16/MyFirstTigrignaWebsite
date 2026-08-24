import type { SupabaseClient } from '@supabase/supabase-js';
import { formatDatabaseError } from './supabaseErrors';

const DELETE_BATCH_SIZE = 100;

export async function deleteAlphabetActivities(db: SupabaseClient, ids: string[]) {
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

  if (!uniqueIds.length) {
    return { ok: false as const, status: 400, error: 'At least one activity id is required.' };
  }

  const deletedIds: string[] = [];

  for (let index = 0; index < uniqueIds.length; index += DELETE_BATCH_SIZE) {
    const batch = uniqueIds.slice(index, index + DELETE_BATCH_SIZE);
    const { data, error } = await db.from('alphabet_activity').delete().in('id', batch).select('id');

    if (error) {
      return { ok: false as const, status: 500, error: formatDatabaseError(error.message) };
    }

    deletedIds.push(...(data ?? []).map((row) => row.id));
  }

  if (!deletedIds.length) {
    return {
      ok: false as const,
      status: 404,
      error:
        'No activity entries were removed. Run supabase/FIX_ALPHABET_ACTIVITY_MANAGE.sql in Supabase, or add SUPABASE_SERVICE_ROLE_KEY to .env.local.'
    };
  }

  return { ok: true as const, deletedIds, deletedCount: deletedIds.length };
}
