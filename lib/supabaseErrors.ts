export function formatDatabaseError(message: string) {
  if (
    message.includes('Could not find the table') ||
    (message.includes('relation') && message.includes('does not exist')) ||
    message.includes('material_category')
  ) {
    return 'Database needs an update. Run supabase/FIX_MATERIAL_TYPES.sql in the Supabase SQL Editor, then try again.';
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
