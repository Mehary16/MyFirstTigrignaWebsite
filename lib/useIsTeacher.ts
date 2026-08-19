'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import { isTeacherUser } from '../lib/roleAuth';

export function useIsTeacher() {
  const [isTeacher, setIsTeacher] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (!active || !user) return;

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (!active) return;
        setIsTeacher(isTeacherUser(profile, user));
      } catch {
        if (active) setIsTeacher(false);
      } finally {
        if (active) setReady(true);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  return { isTeacher, ready };
}
