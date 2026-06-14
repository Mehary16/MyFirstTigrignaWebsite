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

  return message;
}
