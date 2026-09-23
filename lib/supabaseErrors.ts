export function formatDatabaseError(message: string | null | undefined) {
  if (!message) {
    return 'An unexpected database error occurred. Check your Supabase connection and try again.';
  }

  if (message.includes('alphabet_vocabulary')) {
    return 'Run supabase/FIX_ALPHABET_VOCABULARY.sql in the Supabase SQL Editor, then refresh and try again.';
  }

  if (message.includes('kahoot_session_questions') || message.includes('FIX_KAHOOT_QUESTIONS_PRIVATE')) {
    return 'Run supabase/FIX_KAHOOT_QUESTIONS_PRIVATE.sql in the Supabase SQL Editor, then refresh and try again.';
  }

  if (message.includes('kahoot_live')) {
    return 'Run supabase/FIX_KAHOOT_LIVE.sql in the Supabase SQL Editor, then refresh and try again.';
  }

  if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    return 'Live quiz requires SUPABASE_SERVICE_ROLE_KEY in your server environment (e.g. .env.local). Add it from Supabase → Settings → API.';
  }

  if (message.includes('supabase_realtime') && message.includes('kahoot')) {
    return 'Run supabase/FIX_KAHOOT_REALTIME.sql in the Supabase SQL Editor for instant live updates.';
  }

  if (
    message.includes('Could not find the table') ||
    (message.includes('relation') && message.includes('does not exist')) ||
    message.includes('material_category') ||
    message.includes("'file_name' column") ||
    (message.includes('Could not find the') && message.includes('documents'))
  ) {
    return 'Database needs an update. Run supabase/FIX_MATERIAL_TYPES.sql in the Supabase SQL Editor, then refresh and try again.';
  }

  if (message.includes('infinite recursion') || (message.includes('profiles') && message.includes('policy'))) {
    return 'Database security policies need a fix. Run supabase/FIX_RLS_RECURSION.sql in the Supabase SQL Editor, then refresh this page.';
  }

  if (message.includes('Bucket not found')) {
    return 'Storage bucket is missing. Run supabase/RUN_THIS_FIRST.sql in the Supabase SQL Editor, then try again.';
  }

  if (message.includes('infinite recursion detected')) {
    return 'Database security policies need a fix. Run supabase/FIX_RLS_RECURSION.sql in the Supabase SQL Editor, then refresh this page.';
  }

  if (
    message.includes('row-level security') ||
    message.includes('violates row-level security') ||
    message.toLowerCase().includes('permission denied')
  ) {
    return 'Permission denied. Your account needs the Teacher role in Supabase. Run: update public.profiles set role = \'Teacher\' where email = your login email; then log out and back in.';
  }

  if (message.includes('The resource was not found') || message.includes('Object not found')) {
    return 'Storage bucket is missing. Run supabase/RUN_THIS_FIRST.sql in the Supabase SQL Editor.';
  }

  return message;
}
