import { alphabetAudioPathsForExampleWord, alphabetAudioPathsForSlug } from './alphabetAudioUpload';

export type AlphabetForm = {
  char: string;
  transliteration: string;
};

export type AlphabetFamily = {
  id: string;
  name: string;
  accent: string;
  exampleWord: string;
  exampleTransliteration: string;
  exampleMeaning: string;
  forms: AlphabetForm[];
  audioSlug?: string;
};

/** Seven vowel forms per Fidel family — matches standard Tigrinya alphabet charts. */
export const TIGRINYA_ALPHABET_FAMILIES: AlphabetFamily[] = [
  {
    id: 'be',
    name: 'Be',
    accent: '#059669',
    exampleWord: 'በለስ',
    exampleTransliteration: 'Beles',
    exampleMeaning: 'Prickly pear',
    audioSlug: 'ba',
    forms: [
      { char: 'በ', transliteration: 'be' },
      { char: 'ቡ', transliteration: 'bu' },
      { char: 'ቢ', transliteration: 'bi' },
      { char: 'ባ', transliteration: 'ba' },
      { char: 'ቤ', transliteration: 'bie' },
      { char: 'ብ', transliteration: 'b' },
      { char: 'ቦ', transliteration: 'bo' }
    ]
  },
  {
    id: 'se',
    name: 'Se',
    accent: '#2563eb',
    exampleWord: 'ሰዓት',
    exampleTransliteration: "Se'at",
    exampleMeaning: 'Clock / time',
    audioSlug: 'sa',
    forms: [
      { char: 'ሰ', transliteration: 'se' },
      { char: 'ሱ', transliteration: 'su' },
      { char: 'ሲ', transliteration: 'si' },
      { char: 'ሳ', transliteration: 'sa' },
      { char: 'ሴ', transliteration: 'sie' },
      { char: 'ስ', transliteration: 's' },
      { char: 'ሶ', transliteration: 'so' }
    ]
  },
  {
    id: 'she',
    name: 'She',
    accent: '#7c3aed',
    exampleWord: 'ሽበት',
    exampleTransliteration: 'Shebet',
    exampleMeaning: 'Meat',
    audioSlug: 'sha',
    forms: [
      { char: 'ሸ', transliteration: 'she' },
      { char: 'ሹ', transliteration: 'shu' },
      { char: 'ሺ', transliteration: 'shi' },
      { char: 'ሻ', transliteration: 'sha' },
      { char: 'ሼ', transliteration: 'shie' },
      { char: 'ሽ', transliteration: 'sh' },
      { char: 'ሾ', transliteration: 'sho' }
    ]
  },
  {
    id: 'ke',
    name: 'Ke',
    accent: '#dc2626',
    exampleWord: 'ከልቢ',
    exampleTransliteration: 'Kelbi',
    exampleMeaning: 'Dog',
    audioSlug: 'ka',
    forms: [
      { char: 'ከ', transliteration: 'ke' },
      { char: 'ኩ', transliteration: 'ku' },
      { char: 'ኪ', transliteration: 'ki' },
      { char: 'ካ', transliteration: 'ka' },
      { char: 'ኬ', transliteration: 'kie' },
      { char: 'ክ', transliteration: 'k' },
      { char: 'ኮ', transliteration: 'ko' }
    ]
  },
  {
    id: 'khe',
    name: 'Khe',
    accent: '#ea580c',
    exampleWord: 'ሓኸኸ',
    exampleTransliteration: 'Hakheke',
    exampleMeaning: 'Laughter',
    audioSlug: 'khe',
    forms: [
      { char: 'ኸ', transliteration: 'khe' },
      { char: 'ኹ', transliteration: 'khu' },
      { char: 'ኺ', transliteration: 'khi' },
      { char: 'ኻ', transliteration: 'kha' },
      { char: 'ኼ', transliteration: 'khie' },
      { char: 'ኽ', transliteration: 'kh' },
      { char: 'ኾ', transliteration: 'kho' }
    ]
  },
  {
    id: 'le',
    name: 'Le',
    accent: '#ca8a04',
    exampleWord: 'ለሚን',
    exampleTransliteration: 'Lemin',
    exampleMeaning: 'Lemon',
    audioSlug: 'la',
    forms: [
      { char: 'ለ', transliteration: 'le' },
      { char: 'ሉ', transliteration: 'lu' },
      { char: 'ሊ', transliteration: 'li' },
      { char: 'ላ', transliteration: 'la' },
      { char: 'ሌ', transliteration: 'lie' },
      { char: 'ል', transliteration: 'l' },
      { char: 'ሎ', transliteration: 'lo' }
    ]
  },
  {
    id: 'ae',
    name: 'Ae',
    accent: '#0891b2',
    exampleWord: 'አንበሳ',
    exampleTransliteration: 'Anbesa',
    exampleMeaning: 'Lion',
    audioSlug: 'a',
    forms: [
      { char: 'አ', transliteration: 'ae' },
      { char: 'ኡ', transliteration: 'u' },
      { char: 'ኢ', transliteration: 'i' },
      { char: 'ኣ', transliteration: 'a' },
      { char: 'ኤ', transliteration: 'ie' },
      { char: 'እ', transliteration: 'e' },
      { char: 'ኦ', transliteration: 'o' }
    ]
  },
  {
    id: 'ze',
    name: 'Ze',
    accent: '#4f46e5',
    exampleWord: 'ዘይቲ',
    exampleTransliteration: 'Zeyti',
    exampleMeaning: 'Cooking oil',
    audioSlug: 'za',
    forms: [
      { char: 'ዘ', transliteration: 'ze' },
      { char: 'ዙ', transliteration: 'zu' },
      { char: 'ዚ', transliteration: 'zi' },
      { char: 'ዛ', transliteration: 'za' },
      { char: 'ዜ', transliteration: 'zie' },
      { char: 'ዝ', transliteration: 'z' },
      { char: 'ዞ', transliteration: 'zo' }
    ]
  },
  {
    id: 'tse',
    name: 'Tse',
    accent: '#0d9488',
    exampleWord: 'ጸባ',
    exampleTransliteration: 'Tseba',
    exampleMeaning: 'Milk',
    audioSlug: 'tsa2',
    forms: [
      { char: 'ጸ', transliteration: 'tse' },
      { char: 'ጹ', transliteration: 'tsu' },
      { char: 'ጺ', transliteration: 'tsi' },
      { char: 'ጻ', transliteration: 'tsa' },
      { char: 'ጼ', transliteration: 'tsie' },
      { char: 'ጽ', transliteration: 'ts' },
      { char: 'ጾ', transliteration: 'tso' }
    ]
  },
  {
    id: 'de',
    name: 'De',
    accent: '#db2777',
    exampleWord: 'ደማሙ',
    exampleTransliteration: 'Demamu',
    exampleMeaning: 'Cat',
    audioSlug: 'da',
    forms: [
      { char: 'ደ', transliteration: 'de' },
      { char: 'ዱ', transliteration: 'du' },
      { char: 'ዲ', transliteration: 'di' },
      { char: 'ዳ', transliteration: 'da' },
      { char: 'ዴ', transliteration: 'die' },
      { char: 'ድ', transliteration: 'd' },
      { char: 'ዶ', transliteration: 'do' }
    ]
  },
  {
    id: 'je',
    name: 'Je',
    accent: '#0284c7',
    exampleWord: 'ጀሪካን',
    exampleTransliteration: 'Jerikan',
    exampleMeaning: 'Jerrycan',
    audioSlug: 'ja',
    forms: [
      { char: 'ጀ', transliteration: 'je' },
      { char: 'ጁ', transliteration: 'ju' },
      { char: 'ጂ', transliteration: 'ji' },
      { char: 'ጃ', transliteration: 'ja' },
      { char: 'ጄ', transliteration: 'jie' },
      { char: 'ጅ', transliteration: 'j' },
      { char: 'ጆ', transliteration: 'jo' }
    ]
  },
  {
    id: 'hhe',
    name: "H'e",
    accent: '#b45309',
    exampleWord: 'ሓዊ',
    exampleTransliteration: 'Hawi',
    exampleMeaning: 'Fire',
    audioSlug: 'hha',
    forms: [
      { char: 'ሐ', transliteration: "h'e" },
      { char: 'ሑ', transliteration: "h'u" },
      { char: 'ሒ', transliteration: "h'i" },
      { char: 'ሓ', transliteration: "h'a" },
      { char: 'ሔ', transliteration: "h'ie" },
      { char: 'ሕ', transliteration: "h'" },
      { char: 'ሖ', transliteration: "h'o" }
    ]
  },
  {
    id: 'te-emphatic',
    name: "T'e",
    accent: '#9333ea',
    exampleWord: 'ጠራሙዝ',
    exampleTransliteration: 'Teramuz',
    exampleMeaning: 'Bottle',
    audioSlug: 'tsa',
    forms: [
      { char: 'ጠ', transliteration: "t'e" },
      { char: 'ጡ', transliteration: "t'u" },
      { char: 'ጢ', transliteration: "t'i" },
      { char: 'ጣ', transliteration: "t'a" },
      { char: 'ጤ', transliteration: "t'ie" },
      { char: 'ጥ', transliteration: "t'" },
      { char: 'ጦ', transliteration: "t'o" }
    ]
  },
  {
    id: 'che-emphatic',
    name: 'Che',
    accent: '#16a34a',
    exampleWord: 'ጨቓዊት',
    exampleTransliteration: 'Cheqhawit',
    exampleMeaning: 'Chick',
    audioSlug: 'ca',
    forms: [
      { char: 'ጨ', transliteration: 'che' },
      { char: 'ጩ', transliteration: 'chu' },
      { char: 'ጪ', transliteration: 'chi' },
      { char: 'ጫ', transliteration: 'cha' },
      { char: 'ጬ', transliteration: 'chie' },
      { char: 'ጭ', transliteration: 'ch' },
      { char: 'ጮ', transliteration: 'cho' }
    ]
  },
  {
    id: 'te',
    name: 'Te',
    accent: '#15803d',
    exampleWord: 'ተመን',
    exampleTransliteration: 'Temen',
    exampleMeaning: 'Snake',
    audioSlug: 'ta',
    forms: [
      { char: 'ተ', transliteration: 'te' },
      { char: 'ቱ', transliteration: 'tu' },
      { char: 'ቲ', transliteration: 'ti' },
      { char: 'ታ', transliteration: 'ta' },
      { char: 'ቴ', transliteration: 'tie' },
      { char: 'ት', transliteration: 't' },
      { char: 'ቶ', transliteration: 'to' }
    ]
  },
  {
    id: 'che',
    name: 'Che',
    accent: '#059669',
    exampleWord: 'ቻው',
    exampleTransliteration: 'Chaw',
    exampleMeaning: 'Children',
    audioSlug: 'cha',
    forms: [
      { char: 'ቸ', transliteration: 'che' },
      { char: 'ቹ', transliteration: 'chu' },
      { char: 'ቺ', transliteration: 'chi' },
      { char: 'ቻ', transliteration: 'cha' },
      { char: 'ቼ', transliteration: 'chie' },
      { char: 'ች', transliteration: 'ch' },
      { char: 'ቾ', transliteration: 'cho' }
    ]
  },
  {
    id: 'qe',
    name: 'Qe',
    accent: '#c2410c',
    exampleWord: 'ቀሺ',
    exampleTransliteration: 'Qeshi',
    exampleMeaning: 'Priest',
    audioSlug: 'qa',
    forms: [
      { char: 'ቀ', transliteration: 'qe' },
      { char: 'ቁ', transliteration: 'qu' },
      { char: 'ቂ', transliteration: 'qi' },
      { char: 'ቃ', transliteration: 'qa' },
      { char: 'ቄ', transliteration: 'qie' },
      { char: 'ቅ', transliteration: 'q' },
      { char: 'ቆ', transliteration: 'qo' }
    ]
  },
  {
    id: 'qhe',
    name: 'Qhe',
    accent: '#be123c',
    exampleWord: 'መቐስ',
    exampleTransliteration: 'Meqhes',
    exampleMeaning: 'Scissors',
    audioSlug: 'qhe',
    forms: [
      { char: 'ቐ', transliteration: 'qhe' },
      { char: 'ቑ', transliteration: 'qhu' },
      { char: 'ቒ', transliteration: 'qhi' },
      { char: 'ቓ', transliteration: 'qha' },
      { char: 'ቔ', transliteration: 'qhie' },
      { char: 'ቕ', transliteration: 'qh' },
      { char: 'ቖ', transliteration: 'qho' }
    ]
  },
  {
    id: 'ge',
    name: 'Ge',
    accent: '#0369a1',
    exampleWord: 'ገዛ',
    exampleTransliteration: 'Geza',
    exampleMeaning: 'House',
    audioSlug: 'ga',
    forms: [
      { char: 'ገ', transliteration: 'ge' },
      { char: 'ጉ', transliteration: 'gu' },
      { char: 'ጊ', transliteration: 'gi' },
      { char: 'ጋ', transliteration: 'ga' },
      { char: 'ጌ', transliteration: 'gie' },
      { char: 'ግ', transliteration: 'g' },
      { char: 'ጎ', transliteration: 'go' }
    ]
  },
  {
    id: 'ne',
    name: 'Ne',
    accent: '#a16207',
    exampleWord: 'ነብሪ',
    exampleTransliteration: 'Nebri',
    exampleMeaning: 'Leopard',
    audioSlug: 'na',
    forms: [
      { char: 'ነ', transliteration: 'ne' },
      { char: 'ኑ', transliteration: 'nu' },
      { char: 'ኒ', transliteration: 'ni' },
      { char: 'ና', transliteration: 'na' },
      { char: 'ኔ', transliteration: 'nie' },
      { char: 'ን', transliteration: 'n' },
      { char: 'ኖ', transliteration: 'no' }
    ]
  },
  {
    id: 'ye',
    name: 'Ye',
    accent: '#1d4ed8',
    exampleWord: 'የማን',
    exampleTransliteration: 'Yeman',
    exampleMeaning: 'Police',
    audioSlug: 'ya',
    forms: [
      { char: 'የ', transliteration: 'ye' },
      { char: 'ዩ', transliteration: 'yu' },
      { char: 'ዪ', transliteration: 'yi' },
      { char: 'ያ', transliteration: 'ya' },
      { char: 'ዬ', transliteration: 'yie' },
      { char: 'ይ', transliteration: 'y' },
      { char: 'ዮ', transliteration: 'yo' }
    ]
  },
  {
    id: 're',
    name: 'Re',
    accent: '#64748b',
    exampleWord: 'ረጋቢት',
    exampleTransliteration: 'Regabit',
    exampleMeaning: 'Pigeon',
    audioSlug: 'ra',
    forms: [
      { char: 'ረ', transliteration: 're' },
      { char: 'ሩ', transliteration: 'ru' },
      { char: 'ሪ', transliteration: 'ri' },
      { char: 'ራ', transliteration: 'ra' },
      { char: 'ሬ', transliteration: 'rie' },
      { char: 'ር', transliteration: 'r' },
      { char: 'ሮ', transliteration: 'ro' }
    ]
  },
  {
    id: 'fe',
    name: 'Fe',
    accent: '#78350f',
    exampleWord: 'ፈረስ',
    exampleTransliteration: 'Feres',
    exampleMeaning: 'Horse',
    audioSlug: 'fa',
    forms: [
      { char: 'ፈ', transliteration: 'fe' },
      { char: 'ፉ', transliteration: 'fu' },
      { char: 'ፊ', transliteration: 'fi' },
      { char: 'ፋ', transliteration: 'fa' },
      { char: 'ፌ', transliteration: 'fie' },
      { char: 'ፍ', transliteration: 'f' },
      { char: 'ፎ', transliteration: 'fo' }
    ]
  },
  {
    id: 'he',
    name: 'He',
    accent: '#0f766e',
    exampleWord: 'ህበይ',
    exampleTransliteration: 'Hbey',
    exampleMeaning: 'Friend',
    audioSlug: 'ha',
    forms: [
      { char: 'ሀ', transliteration: 'he' },
      { char: 'ሁ', transliteration: 'hu' },
      { char: 'ሂ', transliteration: 'hi' },
      { char: 'ሃ', transliteration: 'ha' },
      { char: 'ሄ', transliteration: 'hie' },
      { char: 'ህ', transliteration: 'h' },
      { char: 'ሆ', transliteration: 'ho' }
    ]
  },
  {
    id: 'aem',
    name: 'Aem',
    accent: '#701a75',
    exampleWord: 'ዓይነት',
    exampleTransliteration: 'Aynet',
    exampleMeaning: 'Eye',
    audioSlug: 'aem',
    forms: [
      { char: 'ዐ', transliteration: 'aem' },
      { char: 'ዑ', transliteration: 'u' },
      { char: 'ዒ', transliteration: 'i' },
      { char: 'ዓ', transliteration: 'a' },
      { char: 'ዔ', transliteration: 'ie' },
      { char: 'ዕ', transliteration: 'e' },
      { char: 'ዖ', transliteration: 'o' }
    ]
  },
  {
    id: 'we',
    name: 'We',
    accent: '#4338ca',
    exampleWord: 'ወርሒ',
    exampleTransliteration: 'Werhi',
    exampleMeaning: 'Moon',
    audioSlug: 'wa',
    forms: [
      { char: 'ወ', transliteration: 'we' },
      { char: 'ዉ', transliteration: 'wu' },
      { char: 'ዊ', transliteration: 'wi' },
      { char: 'ዋ', transliteration: 'wa' },
      { char: 'ዌ', transliteration: 'wie' },
      { char: 'ው', transliteration: 'w' },
      { char: 'ዎ', transliteration: 'wo' }
    ]
  },
  {
    id: 'me',
    name: 'Me',
    accent: '#b91c1c',
    exampleWord: 'መኪና',
    exampleTransliteration: 'Mekina',
    exampleMeaning: 'Car',
    audioSlug: 'ma',
    forms: [
      { char: 'መ', transliteration: 'me' },
      { char: 'ሙ', transliteration: 'mu' },
      { char: 'ሚ', transliteration: 'mi' },
      { char: 'ማ', transliteration: 'ma' },
      { char: 'ሜ', transliteration: 'mie' },
      { char: 'ም', transliteration: 'm' },
      { char: 'ሞ', transliteration: 'mo' }
    ]
  },
  {
    id: 'pe',
    name: 'Pe',
    accent: '#e11d48',
    exampleWord: 'ፓፓዮ',
    exampleTransliteration: 'Papayo',
    exampleMeaning: 'Papaya',
    audioSlug: 'pha',
    forms: [
      { char: 'ፐ', transliteration: 'pe' },
      { char: 'ፑ', transliteration: 'pu' },
      { char: 'ፒ', transliteration: 'pi' },
      { char: 'ፓ', transliteration: 'pa' },
      { char: 'ፔ', transliteration: 'pie' },
      { char: 'ፕ', transliteration: 'p' },
      { char: 'ፖ', transliteration: 'po' }
    ]
  },
  {
    id: 'nye',
    name: 'Nye',
    accent: '#d97706',
    exampleWord: 'ኛው',
    exampleTransliteration: 'Nyaw',
    exampleMeaning: 'Kitten',
    audioSlug: 'nye',
    forms: [
      { char: 'ኘ', transliteration: 'nye' },
      { char: 'ኙ', transliteration: 'nyu' },
      { char: 'ኚ', transliteration: 'nyi' },
      { char: 'ኛ', transliteration: 'nya' },
      { char: 'ኜ', transliteration: 'nyie' },
      { char: 'ኝ', transliteration: 'ny' },
      { char: 'ኞ', transliteration: 'nyo' }
    ]
  },
  {
    id: 've',
    name: 'Ve',
    accent: '#2563eb',
    exampleWord: 'ቪድዮ',
    exampleTransliteration: 'Vidyo',
    exampleMeaning: 'Video',
    audioSlug: 've',
    forms: [
      { char: 'ቨ', transliteration: 've' },
      { char: 'ቩ', transliteration: 'vu' },
      { char: 'ቪ', transliteration: 'vi' },
      { char: 'ቫ', transliteration: 'va' },
      { char: 'ቬ', transliteration: 'vie' },
      { char: 'ቭ', transliteration: 'v' },
      { char: 'ቮ', transliteration: 'vo' }
    ]
  },
  {
    id: 'pe-emphatic',
    name: "P'e",
    accent: '#7e22ce',
    exampleWord: 'ጳጳስ',
    exampleTransliteration: "P'ap'as",
    exampleMeaning: 'Pope / bishop',
    audioSlug: 'pa',
    forms: [
      { char: 'ጰ', transliteration: "p'e" },
      { char: 'ጱ', transliteration: "p'u" },
      { char: 'ጲ', transliteration: "p'i" },
      { char: 'ጳ', transliteration: "p'a" },
      { char: 'ጴ', transliteration: "p'ie" },
      { char: 'ጵ', transliteration: "p'" },
      { char: 'ጶ', transliteration: "p'o" }
    ]
  },
  {
    id: 'zhe',
    name: 'Zhe',
    accent: '#475569',
    exampleWord: 'ቲሌቪዥን',
    exampleTransliteration: 'Televizhn',
    exampleMeaning: 'Television',
    audioSlug: 'zhe',
    forms: [
      { char: 'ዠ', transliteration: 'zhe' },
      { char: 'ዡ', transliteration: 'zhu' },
      { char: 'ዢ', transliteration: 'zhi' },
      { char: 'ዣ', transliteration: 'zha' },
      { char: 'ዤ', transliteration: 'zhie' },
      { char: 'ዥ', transliteration: 'zh' },
      { char: 'ዦ', transliteration: 'zho' }
    ]
  }
];

export function getFamilyAudioSlug(family: Pick<AlphabetFamily, 'id' | 'audioSlug'>) {
  return family.audioSlug ?? family.id;
}

export const LABIALIZED_FORMS: AlphabetForm[] = [
  { char: 'ቈ', transliteration: 'qwe' },
  { char: 'ቊ', transliteration: 'qwi' },
  { char: 'ቋ', transliteration: 'qwa' },
  { char: 'ቌ', transliteration: 'qwie' },
  { char: 'ቍ', transliteration: 'qw' }
];

/** Try form clip first, then the whole family clip (multiple formats). */
export function audioPathsForForm(family: AlphabetFamily, formIndex: number, knownFiles?: Set<string>) {
  return alphabetAudioPathsForSlug(getFamilyAudioSlug(family), formIndex, knownFiles);
}

export function audioPathsForFamily(family: AlphabetFamily, knownFiles?: Set<string>) {
  return audioPathsForForm(family, 0, knownFiles);
}

export function audioPathForFamily(family: AlphabetFamily, knownFiles?: Set<string>) {
  return audioPathsForFamily(family, knownFiles)[0];
}

export function audioPathForForm(family: AlphabetFamily, formIndex: number, knownFiles?: Set<string>) {
  return audioPathsForForm(family, formIndex, knownFiles)[0];
}

/** Example word clip, e.g. aem-word.mp3 for ዓይነት. */
export function audioPathsForExampleWord(family: AlphabetFamily, knownFiles?: Set<string>) {
  return alphabetAudioPathsForExampleWord(getFamilyAudioSlug(family), knownFiles);
}
