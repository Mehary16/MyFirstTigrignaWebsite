import { STORAGE_BUCKETS } from './storageBuckets';

/** Validates filenames like ba.mp3, ba-0.webm — no import from alphabet data (avoids circular deps). */
export function isAllowedAlphabetAudioFilename(filename: string) {
  return /^[a-z0-9]+(?:-[0-6])?\.(mp3|webm|wav|ogg)$/.test(filename.toLowerCase());
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

export function alphabetAudioPathsForSlug(slug: string, formIndex?: number) {
  const extensions = ['mp3', 'webm', 'wav', 'ogg'] as const;
  const paths: string[] = [];

  if (formIndex !== undefined) {
    for (const ext of extensions) {
      paths.push(...alphabetAudioCandidatePaths(`${slug}-${formIndex}.${ext}`));
    }
  }

  for (const ext of extensions) {
    paths.push(...alphabetAudioCandidatePaths(`${slug}.${ext}`));
  }

  return paths;
}
