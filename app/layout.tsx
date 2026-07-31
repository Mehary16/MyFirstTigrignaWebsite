import './globals.css';
import type { Metadata } from 'next';
import AuthNav from '../components/AuthNav';
import AuthUrlErrorHandler from '../components/AuthUrlErrorHandler';
import CookieConsent from '../components/CookieConsent';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { notoEthiopic, notoSerifEthiopic, plusJakarta } from './fonts';

export const metadata: Metadata = {
  title: 'ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ',
  description: 'A Tigrigna language learning portal for students, teachers and parents to learn and teach Tigrigna language.',
  openGraph: {
    description: 'መማህራንን ወለድን ንተምሃሮ ቋንቋ ትግርኛ ንምምሃርን ንምስትምሃርን ዝሕግዝ ፖርታል'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ti" className={`${plusJakarta.variable} ${notoEthiopic.variable} ${notoSerifEthiopic.variable}`}>
      <body className="min-h-screen font-sans text-slate-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand-900 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <AuthUrlErrorHandler />
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <SiteHeader nav={<AuthNav />} />

          <main id="main-content" className="flex-1 scroll-mt-24">
            {children}
          </main>

          <SiteFooter />
        </div>
        <CookieConsent />
      </body>
    </html>
  );
}
