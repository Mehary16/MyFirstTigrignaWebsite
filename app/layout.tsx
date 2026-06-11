import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ትምህሪት ቋንቋ ትግርኛ ፍረ ጥበብ',
  description: 'A Tigrigna language learning portal for students and teachers.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ti">
      <body className="min-h-screen bg-[linear-gradient(180deg,#f7f1e3_0%,#f8fafc_40%,#eef4ff_100%)] text-slate-900 antialiased">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-8 rounded-[2rem] border border-amber-100/80 bg-white/85 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-700">ትምህሪት ቋንቋ ትግርኛ ፍረ ጥበብ</p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-950">Tigrigna Learning Portal</h1>
                <p className="mt-1 max-w-xl text-sm text-slate-600">A bilingual space for lessons, reading materials, and homework submissions.</p>
              </div>
              <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
                <Link href="/" className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-slate-300 hover:bg-slate-50">Home</Link>
                <Link href="/login" className="rounded-full bg-slate-950 px-4 py-2 text-white transition hover:bg-slate-800">Login / ግባ</Link>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="mt-12 border-t border-slate-200/80 pt-4 text-sm text-slate-500">
            <p>Built with Next.js 14, Supabase Auth, PostgreSQL, and Tailwind CSS.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
