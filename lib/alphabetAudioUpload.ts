import { TIGRINYA_ALPHABET_FAMILIES } from './tigrinyaAlphabetFamilies';

const SLUGS = new Set(
  TIGRINYA_ALPHABET_FAMILIES.map((family) => family.audioSlug).filter((slug): slug is string => Boolean(slug))
);

/** Validates filenames like ba.mp3, ba-0.webm */
export function isAllowedAlphabetAudioFilename(filename: string) {
  const match = /^([a-z0-9]+)(?:-([0-6]))?\.(mp3|webm|wav|ogg)$/.exec(filename.toLowerCase());
  if (!match) return false;
  const [, slug] = match;
  return SLUGS.has(slug!);
}

export function alphabetAudioPathsForSlug(slug: string, formIndex?: number) {
  const extensions = ['mp3', 'webm', 'wav', 'ogg'] as const;
  const paths: string[] = [];

  if (formIndex !== undefined) {
    for (const ext of extensions) {
      paths.push(`/alphabet/${slug}-${formIndex}.${ext}`);
    }
  }

  for (const ext of extensions) {
    paths.push(`/alphabet/${slug}.${ext}`);
  }

  return paths;
}
