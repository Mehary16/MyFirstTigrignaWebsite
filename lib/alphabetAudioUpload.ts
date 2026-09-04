import { STORAGE_BUCKETS } from './storageBuckets';

/** Validates filenames like ba.mp3, ba-0.webm, aem-word.mp3, ka-v-a1b2c3d4.webm */
export function isAllowedAlphabetAudioFilename(filename: string) {
  const lower = filename.toLowerCase();
  return (
    /^[a-z0-9]+(?:-(?:[0-6]|word))?\.(mp3|webm|wav|ogg)$/.test(lower) ||
    /^[a-z0-9]+-v-[a-z0-9]{8,32}\.(mp3|webm|wav|ogg)$/.test(lower)
  );
}

export function alphabetAudioPublicUrl(filename: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!base) return undefined;
  return `${base}/storage/v1/object/public/${STORAGE_BUCKETS.alphabetAudio}/${filename}`;
}

/** Supabase clip first (teacher recordings), then local public/alphabet fallback. */
export function alphabetAudioCandidatePaths(filename: string) {
  const paths: string[] = [];
  const supabaseUrl = alphabetAudioPublicUrl(filename);
  if (supabaseUrl) paths.push(supabaseUrl);
  paths.push(`/alphabet/${filename}`);
  return paths;
}

export function alphabetAudioPathsForSlug(slug: string, formIndex?: number, knownFiles?: Set<string>) {
  const extensions = ['webm', 'mp3', 'wav', 'ogg'] as const;
  const paths: string[] = [];

  const addFilename = (filename: string) => {
    if (knownFiles && knownFiles.size > 0 && !knownFiles.has(filename.toLowerCase())) {
      return;
    }
    paths.push(...alphabetAudioCandidatePaths(filename));
  };

  if (formIndex !== undefined) {
    for (const ext of extensions) {
      addFilename(`${slug}-${formIndex}.${ext}`);
    }
  }

  for (const ext of extensions) {
    addFilename(`${slug}.${ext}`);
  }

  if (knownFiles && knownFiles.size > 0 && paths.length === 0) {
    return alphabetAudioPathsForSlug(slug, formIndex);
  }

  return paths;
}

export function familyHasAlphabetRecording(slug: string, knownFiles: Set<string>) {
  if (knownFiles.size === 0) return false;

  const prefix = `${slug.toLowerCase()}.`;
  const formPrefix = `${slug.toLowerCase()}-`;

  for (const filename of knownFiles) {
    if (filename.startsWith(prefix) || filename.startsWith(formPrefix)) {
      return true;
    }
  }

  return false;
}

export function alphabetAudioPathsForExampleWord(slug: string, knownFiles?: Set<string>) {
  const extensions = ['webm', 'mp3', 'wav', 'ogg'] as const;
  const paths: string[] = [];

  for (const ext of extensions) {
    const filename = `${slug}-word.${ext}`;
    if (knownFiles && knownFiles.size > 0 && !knownFiles.has(filename.toLowerCase())) {
      continue;
    }
    paths.push(...alphabetAudioCandidatePaths(filename));
  }

  if (knownFiles && knownFiles.size > 0 && paths.length === 0) {
    return alphabetAudioPathsForExampleWord(slug);
  }

  return paths;
}

export function alphabetAudioPathsForTarget(slug: string, scope: 'form' | 'family' | 'word', formIndex: number) {
  const extensions = ['webm', 'mp3', 'wav', 'ogg'] as const;
  const filenames =
    scope === 'form'
      ? extensions.map((ext) => `${slug}-${formIndex}.${ext}`)
      : scope === 'word'
        ? extensions.map((ext) => `${slug}-word.${ext}`)
        : extensions.map((ext) => `${slug}.${ext}`);

  return filenames.flatMap((filename) => alphabetAudioCandidatePaths(filename));
}

export async function findAlphabetRecordingUrl(paths: string[]) {
  for (const path of paths) {
    try {
      const response = await fetch(path, { method: 'HEAD' });
      if (response.ok) return path;
    } catch {
      // Try the next path.
    }
  }

  return null;
}
