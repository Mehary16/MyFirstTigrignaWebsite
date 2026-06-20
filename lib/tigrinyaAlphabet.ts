export type AlphabetEntry = {
  char: string;
  transliteration: string;
  name: string;
  audioPath?: string;
};

/** Core Fidel characters — add audio files under public/alphabet/ to enable playback. */
export const TIGRINYA_ALPHABET: AlphabetEntry[] = [
  { char: 'ሀ', transliteration: 'he', name: 'He', audioPath: '/alphabet/ha.mp3' },
  { char: 'ለ', transliteration: 'le', name: 'Le', audioPath: '/alphabet/la.mp3' },
  { char: 'ሐ', transliteration: 'hhe', name: 'Hhe', audioPath: '/alphabet/hha.mp3' },
  { char: 'መ', transliteration: 'me ', name: 'Me', audioPath: '/alphabet/ma.mp3' },
  { char: 'ረ', transliteration: 're', name: 'Re', audioPath: '/alphabet/ra.mp3' },
  { char: 'ሰ', transliteration: 'se', name: 'Se', audioPath: '/alphabet/sa.mp3' },
  { char: 'ሸ', transliteration: 'she', name: 'She', audioPath: '/alphabet/sha.mp3' },
  { char: 'ቀ', transliteration: 'qe', name: 'Qe', audioPath: '/alphabet/qa.mp3' },
  { char: 'በ', transliteration: 'be', name: 'Be', audioPath: '/alphabet/ba.mp3' },
  { char: 'ተ', transliteration: 'te', name: 'Te', audioPath: '/alphabet/ta.mp3' },
  { char: 'ቸ', transliteration: 'che', name: 'Che', audioPath: '/alphabet/cha.mp3' },
  { char: 'ነ', transliteration: 'ne', name: 'Ne', audioPath: '/alphabet/na.mp3' },
  { char: 'አ', transliteration: 'ae', name: 'Ae', audioPath: '/alphabet/a.mp3' },
  { char: 'ከ', transliteration: 'ke', name: 'Ke', audioPath: '/alphabet/ka.mp3' },
  { char: 'ወ', transliteration: 'we', name: 'We', audioPath: '/alphabet/wa.mp3' },
  { char: 'ዘ', transliteration: 'ze', name: 'Ze', audioPath: '/alphabet/za.mp3' },
  { char: 'የ', transliteration: 'ye', name: 'Ye', audioPath: '/alphabet/ya.mp3' },
  { char: 'ደ', transliteration: 'de', name: 'De', audioPath: '/alphabet/da.mp3' },
  { char: 'ጀ', transliteration: 'je', name: 'Je', audioPath: '/alphabet/ja.mp3' },
  { char: 'ገ', transliteration: 'ge', name: 'Ge', audioPath: '/alphabet/ga.mp3' },
  { char: 'ጠ', transliteration: 'te', name: 'Te', audioPath: '/alphabet/tsa.mp3' },
  { char: 'ጨ', transliteration: 'ce', name: 'Ce', audioPath: '/alphabet/ca.mp3' },
  { char: 'ጰ', transliteration: 'pe', name: 'Pe', audioPath: '/alphabet/pa.mp3' },
  { char: 'ጸ', transliteration: 'xe', name: 'xe', audioPath: '/alphabet/tsa2.mp3' },
  { char: 'ፀ', transliteration: 'xe', name: 'xa', audioPath: '/alphabet/tza.mp3' },
  { char: 'ፈ', transliteration: 'fe', name: 'Fe', audioPath: '/alphabet/fa.mp3' },
  { char: 'ፐ', transliteration: 'pe', name: 'Pe', audioPath: '/alphabet/pha.mp3' },
  { char: 'ሰላም', transliteration: 'Selam', name: 'Hello', audioPath: '/alphabet/selam.mp3' }
];
