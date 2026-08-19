'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  EMPTY_ALPHABET_PROGRESS,
  readAlphabetProgress,
  writeAlphabetProgress,
  type AlphabetProgress
} from './alphabetProgress';
import { createBrowserSupabaseClient } from './supabaseClient';

export function useAlphabetProgress() {
  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState<AlphabetProgress>(EMPTY_ALPHABET_PROGRESS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (!active) return;
        const id = user?.id ?? null;
        setUserId(id);
        setProgress(readAlphabetProgress(id));
      } catch {
        if (!active) return;
        setProgress(readAlphabetProgress(null));
      } finally {
        if (active) setReady(true);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const saveProgress = useCallback(
    (updater: (current: AlphabetProgress) => AlphabetProgress) => {
      setProgress((current) => {
        const next = updater(current);
        writeAlphabetProgress(userId, next);
        return next;
      });
    },
    [userId]
  );

  return { progress, saveProgress, ready, userId };
}
