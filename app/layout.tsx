import './globals.css';
import type { Metadata } from 'next';
import AuthNav from '../components/AuthNav';

export const metadata: Metadata = {
  title: 'ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ',
  description: 'A Tigrigna language learning portal for students, teachers and parents to learn and teach Tigrigna language.',
  openGraph: {
    description: 'ተምሃሮ፣ መምህራንን ወለድን ቋንቋ ትግርኛ ንምምሃርን ንምስትምሃርን ዝሕግዝ ፖርታል',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ti">
      <body className="min-h-screen bg-[linear-gradient(180deg,#f7f1e3_0%,#f8fafc_40%,#eef4ff_100%)] text-slate-900 antialiased">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-8 rounded-[2rem] border border-amber-100/80 bg-white/85 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-medium uppercase tracking-[0.25em] text-amber-800">ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ</p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-950">Tigrigna Learning Portal</h1>
                <p className="mt-1 max-w-xl text-sm text-slate-700">A bilingual space for lessons, reading materials, and homework submissions.</p>
              </div>
              <AuthNav />
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="mt-12 border-t border-slate-200/80 pt-4 text-sm text-slate-500">
            <p>ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ</p>
            <p>መምህር መሓሪ ኣይንኣለም</p>
            <p className="mt-1">
              ኢሜል:{' '}
              <a href="mailto:mehary.aynealem1@gmail.com" className="text-slate-700 underline-offset-2 hover:underline">
                mehary.aynealem1@gmail.com
              </a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
