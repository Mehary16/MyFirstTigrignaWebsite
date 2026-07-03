import { Noto_Sans_Ethiopic, Noto_Serif_Ethiopic, Plus_Jakarta_Sans } from 'next/font/google';

export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  adjustFontFallback: true
});

/** Body UI and mixed bilingual labels */
export const notoEthiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  variable: '--font-ethiopic',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true
});

/** Display headings — better glyph presence for Ge'ez script at large sizes */
export const notoSerifEthiopic = Noto_Serif_Ethiopic({
  subsets: ['ethiopic'],
  variable: '--font-ethiopic-display',
  weight: ['400', '600', '700'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true
});
