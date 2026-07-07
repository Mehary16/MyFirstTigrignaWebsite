'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';

type SiteHeaderProps = {
  nav: ReactNode;
};

export default function SiteHeader({ nav }: SiteHeaderProps) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 56);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border border-amber-100/80 bg-white/90 backdrop-blur transition-all duration-300 ease-out',
        compact ? 'mb-5 rounded-full px-4 py-2.5 shadow-card' : 'mb-8 rounded-[2rem] px-5 py-4 shadow-card-lg'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="min-w-0 flex-1 transition-opacity hover:opacity-90">
          <p
            className={cn(
              'font-ethiopic font-medium uppercase tracking-[0.2em] text-amber-800 transition-all duration-300',
              compact ? 'text-xs tracking-[0.16em]' : 'text-lg'
            )}
          >
            ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ
          </p>
          <h1
            className={cn(
              'font-semibold tracking-tight text-slate-950 transition-all duration-300',
              compact ? 'text-sm' : 'mt-1 text-2xl'
            )}
          >
            Tigrigna Learning Portal
          </h1>
          <p
            className={cn(
              'max-w-xl text-sm text-slate-600 transition-all duration-300',
              compact ? 'max-h-0 overflow-hidden opacity-0' : 'mt-1 max-h-20 opacity-100'
            )}
          >
            A bilingual space for lessons, reading materials, and homework submissions.
          </p>
        </Link>
        <div className="shrink-0">{nav}</div>
      </div>
    </header>
  );
}
