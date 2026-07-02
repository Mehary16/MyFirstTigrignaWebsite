import './globals.css';
import type { Metadata } from 'next';
import AuthNav from '../components/AuthNav';
import AuthUrlErrorHandler from '../components/AuthUrlErrorHandler';
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
        <AuthUrlErrorHandler />
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-8 rounded-[2rem] border border-amber-100/80 bg-white/90 px-5 py-4 shadow-card-lg backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-ethiopic text-lg font-medium uppercase tracking-[0.2em] text-amber-800">
                  ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Tigrigna Learning Portal</h1>
                <p className="mt-1 max-w-xl text-sm text-slate-600">
                  A bilingual space for lessons, reading materials, and homework submissions.
                </p>
              </div>
              <AuthNav />
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="mt-12 border-t border-slate-200/80 pt-4 text-sm text-slate-500">
            <p className="font-ethiopic">ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ</p>
            <p className="font-ethiopic">መምህር መሓሪ ኣይንኣለም</p>
            <p className="mt-1">
              ኢሜል:{' '}
              <a
                href="mailto:mehary.aynealem1@gmail.com"
                className="text-slate-700 underline-offset-2 hover:text-brand-800 hover:underline"
              >
                mehary.aynealem1@gmail.com
              </a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
