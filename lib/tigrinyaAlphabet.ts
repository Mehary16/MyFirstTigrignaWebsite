import { TIGRINYA_ALPHABET_FAMILIES } from './tigrinyaAlphabetFamilies';

export type AlphabetEntry = {
  char: string;
  transliteration: string;
  name: string;
  audioPath?: string;
};

/** Flat list derived from alphabet families — used on login preview and legacy references. */
export const TIGRINYA_ALPHABET: AlphabetEntry[] = TIGRINYA_ALPHABET_FAMILIES.map((family) => ({
  char: family.forms[0]!.char,
  transliteration: family.forms[0]!.transliteration,
  name: family.name,
  audioPath: family.audioSlug ? `/alphabet/${family.audioSlug}.mp3` : undefined
}));
