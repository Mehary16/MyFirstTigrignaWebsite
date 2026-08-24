'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export function useAlphabetRecordingIndex() {
  const [files, setFiles] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/alphabet/audio', { cache: 'no-store' });
      const payload = (await response.json()) as { files?: string[] };
      setFiles((payload.files ?? []).map((filename) => filename.toLowerCase()));
    } catch {
      setFiles([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const fileSet = useMemo(() => new Set(files), [files]);

  return { files, fileSet, ready, refresh };
}
