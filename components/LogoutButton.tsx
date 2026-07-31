'use client';

import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import Button from './ui/Button';

type LogoutButtonProps = {
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
};

export default function LogoutButton({ className, variant = 'secondary', fullWidth = false }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Button type="button" variant={variant} onClick={handleLogout} className={className} fullWidth={fullWidth}>
      Logout / ውጻእ
    </Button>
  );
}
