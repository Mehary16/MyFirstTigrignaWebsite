'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const syncTimerRef = useRef<number | null>(null);

  const syncToServer = useCallback((next: AlphabetProgress) => {
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      void fetch('/api/alphabet/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: next })
      });
    }, 400);
  }, []);

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

        if (!id) {
          setProgress(EMPTY_ALPHABET_PROGRESS);
          return;
        }

        const response = await fetch('/api/alphabet/progress');
        if (response.ok) {
          const payload = (await response.json()) as { progress?: AlphabetProgress };
          if (payload.progress) {
            setProgress(payload.progress);
            writeAlphabetProgress(id, payload.progress);
            return;
          }
        }

        const local = readAlphabetProgress(id);
        setProgress(local);
        syncToServer(local);
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
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [syncToServer]);

  const saveProgress = useCallback(
    (updater: (current: AlphabetProgress) => AlphabetProgress) => {
      setProgress((current) => {
        const next = updater(current);
        writeAlphabetProgress(userId, next);
        if (userId) syncToServer(next);
        return next;
      });
    },
    [syncToServer, userId]
  );

  return { progress, saveProgress, ready, userId };
}
