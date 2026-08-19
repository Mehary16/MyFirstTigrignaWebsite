/** Validates filenames like ba.mp3, ba-0.webm — no import from alphabet data (avoids circular deps). */
export function isAllowedAlphabetAudioFilename(filename: string) {
  return /^[a-z0-9]+(?:-[0-6])?\.(mp3|webm|wav|ogg)$/.test(filename.toLowerCase());
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
