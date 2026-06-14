export function formatDatabaseError(message: string) {
  if (
    message.includes('Could not find the table') ||
    (message.includes('relation') && message.includes('does not exist'))
  ) {
    return 'Database tables are missing. Run supabase/RUN_THIS_FIRST.sql in the Supabase SQL Editor, then try again.';
  }

  if (message.includes('Bucket not found')) {
    return 'Storage bucket is missing. Run supabase/RUN_THIS_FIRST.sql in the Supabase SQL Editor, then try again.';
  }

  if (message.includes('infinite recursion detected')) {
    return 'Database security policies need a fix. Run supabase/FIX_RLS_RECURSION.sql in the Supabase SQL Editor, then refresh this page.';
  }

  return message;
}
