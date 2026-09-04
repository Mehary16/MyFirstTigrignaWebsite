import { alphabetAudioCandidatePaths } from './alphabetAudioUpload';
import { getFamilyAudioSlug, type AlphabetFamily } from './tigrinyaAlphabetFamilies';

export type AlphabetVocabularyWord = {
  id: string;
  family_id: string;
  word: string;
  transliteration: string;
  meaning: string;
  audio_filename: string | null;
  sort_order: number;
  created_at: string;
};

export function vocabularyAudioFilename(family: AlphabetFamily, wordId: string, extension: string) {
  const slug = getFamilyAudioSlug(family);
  const shortId = wordId.replace(/-/g, '').slice(0, 12);
  return `${slug}-v-${shortId}.${extension}`;
}

export function isAllowedVocabularyAudioFilename(filename: string) {
  return /^[a-z0-9]+-v-[a-z0-9]{8,32}\.(mp3|webm|wav|ogg)$/.test(filename.toLowerCase());
}

export function audioPathsForVocabularyWord(audioFilename: string | null | undefined) {
  if (!audioFilename) return [];
  return alphabetAudioCandidatePaths(audioFilename);
}

export function builtinExampleWordEntry(family: AlphabetFamily) {
  return {
    id: `builtin-${family.id}`,
    family_id: family.id,
    word: family.exampleWord,
    transliteration: family.exampleTransliteration,
    meaning: family.exampleMeaning,
    audio_filename: null as string | null,
    sort_order: -1,
    created_at: '',
    isBuiltin: true as const
  };
}

export type DisplayVocabularyWord = ReturnType<typeof builtinExampleWordEntry> | (AlphabetVocabularyWord & { isBuiltin?: false });
