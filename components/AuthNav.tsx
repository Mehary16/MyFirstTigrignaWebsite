import { createServerSupabaseClient } from '../lib/supabaseServer';
import AuthNavClient from './AuthNavClient';

export default async function AuthNav() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return <AuthNavClient isLoggedIn={Boolean(user)} />;
}
