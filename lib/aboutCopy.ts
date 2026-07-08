export type AboutLocale = 'en' | 'ti';

export type AboutCopy = {
  languageEn: string;
  languageTi: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageAlt: string;
  visionTitle: string;
  visionBody: string;
  whoWeAreTitle: string;
  whoWeAreBody: string;
  missionTitle: string;
  missionBody: string;
  ctaSectionTitle: string;
  ctaSectionDescription: string;
  modulesTitle: string;
  modulesDescription: string;
  learnLabel: string;
  milestonesLabel: string;
  footerReady: string;
  signUpFree: string;
  exploreAlphabet: string;
  ctaButtons: Array<{
    href: string;
    primary: string;
    secondary: string | null;
    variant: 'primary' | 'secondary';
  }>;
  modules: Array<{
    number: number;
    title: string;
    titleTi: string;
    summary: string;
    learn: string[];
    milestones: string[];
  }>;
};

export const ABOUT_COPY: Record<AboutLocale, AboutCopy> = {
  en: {
    languageEn: 'EN',
    languageTi: 'ትግ',
    heroEyebrow: 'About Us',
    heroTitle: 'Mission Statement',
    heroSubtitle: 'ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ',
    heroImageAlt: 'Students learning Tigrinya together',
    visionTitle: 'Our Vision',
    visionBody:
      'To ensure that no matter where you live in the world, you are never more than a click away from your heritage, your history, and your people.',
    whoWeAreTitle: 'Who We Are',
    whoWeAreBody:
      'We are a global community of educators, tech creators, and culture keepers dedicated to preserving the Tigrinya language for generations to come. We built this platform because we know the struggle of wanting to connect deeply with family, history, and community, but lacking the structured, engaging resources to do so.',
    missionTitle: 'Our Mission',
    missionBody:
      'Our mission is to turn language barriers into bridges. We empower first-generation, second-generation, and language enthusiasts worldwide to confidently speak, read, and write Tigrinya. By pairing ancient history with modern, interactive learning tools, we make mastering the Fidäl accessible to everyone, everywhere.',
    ctaSectionTitle: 'Start learning today',
    ctaSectionDescription: 'Choose a path that fits you — every button opens the next step in your journey.',
    modulesTitle: 'Beginner Course Modules',
    modulesDescription: 'A structured path from your first letter to your first real conversation.',
    learnLabel: 'What you will learn',
    milestonesLabel: 'The milestones',
    footerReady: 'Ready to begin? Create a student account and start Module 1 today.',
    signUpFree: 'Sign up free',
    exploreAlphabet: 'Explore the alphabet',
    ctaButtons: [
      {
        href: '/login?mode=signup&accountType=Student',
        primary: 'Start Your First Lesson Free',
        secondary: 'ካብ ተዓዛቢ ናብ ተሳታፊ ተቐይር',
        variant: 'primary'
      },
      {
        href: '/login?mode=signup&accountType=Student',
        primary: 'Claim Your Identity Today',
        secondary: 'ቋንቋኽ ፡ መንነትካ ኢዩ።',
        variant: 'secondary'
      },
      {
        href: '/resources/alphabet',
        primary: 'Unlock the Script Now',
        secondary: 'ታሪኽካ ባዕልኻ ኣንብቦ',
        variant: 'secondary'
      },
      {
        href: '/login?mode=signup&accountType=Student',
        primary: 'Join the Global Community — Sign Up In 60 Seconds',
        secondary: null,
        variant: 'primary'
      }
    ],
    modules: [
      {
        number: 1,
        title: 'The Foundations of Sound & Script',
        titleTi: 'ፊደል',
        summary:
          'Master the core building blocks of the language. This module removes the intimidation of learning a new alphabet and gets you reading immediately.',
        learn: [
          'The basic Tigrinya alphabet (Fidäl)',
          'Standard vowel forms',
          'Flawless pronunciation of unique explosive consonants'
        ],
        milestones: ['Read your first written Tigrinya words', 'Write your own name in script']
      },
      {
        number: 2,
        title: 'The Art of the Coffee Ceremony',
        titleTi: 'ባህሊ & ሰላምታ',
        summary:
          'Step out of the classroom and into social confidence. Learn the foundational grammar and vocabulary needed to navigate any traditional family gathering.',
        learn: [
          'Polite greetings and introducing yourself',
          'Respecting elders',
          'Cultural vocabulary surrounding the traditional Bun (coffee) ceremony'
        ],
        milestones: [
          'Introduce yourself confidently to an elder',
          'Hold a 3-minute introductory conversation'
        ]
      },
      {
        number: 3,
        title: 'Everyday Connections',
        titleTi: 'ድሕረ-ባይታ & ስድራቤት',
        summary:
          'Connect deeply with the people who matter most. This module shifts focus onto family structures, daily life, and the home.',
        learn: [
          'Terms for family members',
          'Expressing immediate needs',
          'Describing your daily routine and sharing your background'
        ],
        milestones: [
          'Speak with your parents or grandparents about family history without relying on English'
        ]
      }
    ]
  },
  ti: {
    languageEn: 'EN',
    languageTi: 'ትግ',
    heroEyebrow: 'ብዛዕባና',
    heroTitle: 'መደብና',
    heroSubtitle: 'ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ',
    heroImageAlt: 'ተማሃሮ ትግርኛ ዝምሃሩ',
    visionTitle: 'ራኢና',
    visionBody:
      'ኣብ ዓለም ኣበል ከተማ ክትነብር ከም ዘሎኻ፣ ካብ ባህልካ፣ ታሪኽካን ህዝብካን ብሓንሳብ ሓደ ጠውቒ ከም ዘይትርሕቕ ንምርግጋጽ።',
    whoWeAreTitle: 'መን እኹና?',
    whoWeAreBody:
      'ንቋንቋ ትግርኛ ንዝመጽእ ዘለዎም ትውልድ ንምድሓን ብምኽንያት ተዳላይ መምህራን፣ ኣፈ-ጥበባት ቴክኖሎጂ፣ ከምኡ’ውን ጠባቂ ባህሊ ዝኾና ናይ ዓለም ማሕበር ኢና። ምስ ስድራቤት፣ ታሪኽን ማሕበረሰብን ብዘይካ ጥልቀት ክትተሓሓዝ ዝደሊ ፣ ግን ከምዚ ዝኣመሰለ ተዳላይን ስሉጥን መርበብ ግን ዘይብልካ ዘለካ ተጋደልቲ ፈልጥና ኣሎና። ነዚ መድረኽ ስለ ዝሰርሕናዮ እዩ።',
    missionTitle: 'ተልእኮና',
    missionBody:
      'ተልእኮና ግድላዊ መጋድል ቋንቋ ናብ ድልድይ ምቕያር እዩ። ኣብ መላእ ዓለም ን1ይ ወለድ፣ 2ይ ወለድን ንዘፍቅር ቋንቋን ትግርኛ ብኽብሪ ንምዝራብ፣ ንምንባብን ንምጽሓፍን ንምኽንያት ንኽእል ንሕግዝ። ጥንታዊ ታሪኽ ምስ ዘመናዊ ተሳትፎ ዝገብር መሳርሒ ትምህርቲ ብምሕላፍ፣ ፊደል ንኹሉ ኣብ ኩሉ ቦታ ንምምሃር ኣበለጸትናዮ ኣሎና።',
    ctaSectionTitle: 'ሎምሲ ክትምሃር ጀምር',
    ctaSectionDescription: 'ንኻ ዝግብኦ መንገዲ ምረጽ — ነቲ ዝቕጽል ስጉምትኻ ንኹሉ ቁልፊ ይኸፍት።',
    modulesTitle: 'መደብ ኮርስ ንዝጀምሩ',
    modulesDescription: 'ካብ መጀመርታ ፊደል ክሳብ ቀዳማይ ሓቀኛ ዘረባኻ ዝኣንድ ተዳላይ መንገዲ።',
    learnLabel: 'እንታይ ክትምሃር እኹም',
    milestonesLabel: 'መደረኻት',
    footerReady: 'ክትጅምር ድሉው ዲኻ? ናይ ተማሃራይ ኣካውንት ፈጠር ኣብ መጀመርታ መደብ 1 ሎምሲ ጀምር።',
    signUpFree: 'በቑሊ ተመዝገብ',
    exploreAlphabet: 'ፊደላት ርአ',
    ctaButtons: [
      {
        href: '/login?mode=signup&accountType=Student',
        primary: 'ካብ ተዓዛቢ ናብ ተሳታፊ ተቐይር',
        secondary: 'Start Your First Lesson Free',
        variant: 'primary'
      },
      {
        href: '/login?mode=signup&accountType=Student',
        primary: 'ቋንቋኽ ፡ መንነትካ ኢዩ።',
        secondary: 'Claim Your Identity Today',
        variant: 'secondary'
      },
      {
        href: '/resources/alphabet',
        primary: 'ታሪኽካ ባዕልኻ ኣንብቦ',
        secondary: 'Unlock the Script Now',
        variant: 'secondary'
      },
      {
        href: '/login?mode=signup&accountType=Student',
        primary: 'ኣብ ናይ ዓለም ማሕበር ተሳተፍ — ብ 60 ሰከንድ ኣካውንት ፈጠር',
        secondary: null,
        variant: 'primary'
      }
    ],
    modules: [
      {
        number: 1,
        title: 'መሰረት ድምጺን ፊደልን',
        titleTi: 'ፊደል',
        summary:
          'መሰረታዊ ክፋላት ቋንቋ ተማሃር። እዚ መደብ ሓድሽ ፊደል ንምምሃር ዘለዎ ስግኣት ይኸድዎ፣ ብቕልጡፍ ከኣ ንምንባብ ይሕግዘካ።',
        learn: [
          'መሰረታዊ ፊደላት ትግርኛ (ፊደል)',
          'መደበኛ ቅርፂ ድምጺ ፊደላት',
          'ብጽኑዕ መጠን ኣውታር ድምጺ ፊደላት ምውጻእ'
        ],
        milestones: ['ቀዳማይ ቃላት ትግርኛ ብጽሑፍ ምንባብ', 'ስምካ ብፊደል ምጽሓፍ']
      },
      {
        number: 2,
        title: 'ስነ-ጥበብ ስነ-ባህሊ ቡን',
        titleTi: 'ባህሊ & ሰላምታ',
        summary:
          'ካብ ክፍሊ ወጻእ ብማሕበራዊ ሓይሊ ተማሃር። ኣብ ኣብያተ ስድራቤት ንምእታው ዘድሊ መሰረታዊ ፍልጠትን ቃላትን ተማሃር።',
        learn: [
          'ክብረት ዘለዎ ሰላምታን ርእስኻ ምቕራብን',
          'ኣቦታትን ኣደውትን ምኽብራር',
          'ብዛዕባ ባህሊ ቡን (ቡን) ዝምልከት ቃላት'
        ],
        milestones: [
          'ብኽብሪ ኣብ ፊት ኣቦ/ኣደ ርእስኻ ምቕራብ',
          '3 ደቒቓታት መጀመርታ ዘረባ ምዕራብ'
        ]
      },
      {
        number: 3,
        title: 'መዓልታዊ ርክብ',
        titleTi: 'ድሕረ-ባይታ & ስድራቤት',
        summary:
          'ምስቲ ዝጠቅም ህዝቢ ብዘይካ ጥልቀት ተራኸብ። እዚ መደብ ኣብ ስድራቤት፣ መዓልታዊ ህይወትን ገዛን ይትከል።',
        learn: [
          'ስሞም ኣባላት ስድራቤት',
          'ኣብ ሓደጋ ዘድልዮ ፍላጎት ምግላጽ',
          'መዓልታዊ ስራሕካ ምግለጽን ኣንፈትካ ምክፋልን'
        ],
        milestones: ['ምስ ወለድካ ወይ ኣቦ/ኣደ ስድራቤት ብዘይ እንግሊዝኛ ብዛዕባ ታሪኽ ስድራቤት ምዕራብ']
      }
    ]
  }
};

export const LOCALE_STORAGE_KEY = 'login-locale';
