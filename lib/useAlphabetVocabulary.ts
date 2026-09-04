'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AlphabetVocabularyWord } from './alphabetVocabulary';

export function useAlphabetVocabulary(familyId: string) {
  const [words, setWords] = useState<AlphabetVocabularyWord[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/alphabet/vocabulary?familyId=${encodeURIComponent(familyId)}`, {
        cache: 'no-store'
      });
      const payload = (await response.json()) as { words?: AlphabetVocabularyWord[]; error?: string };

      if (!response.ok) {
        setWords([]);
        setError(payload.error ?? 'Could not load practice words.');
        return;
      }

      setWords(payload.words ?? []);
      setError(null);
    } catch {
      setWords([]);
      setError('Could not load practice words.');
    } finally {
      setReady(true);
    }
  }, [familyId]);

  useEffect(() => {
    setReady(false);
    void refresh();
  }, [refresh]);

  return { words, ready, error, refresh };
}
