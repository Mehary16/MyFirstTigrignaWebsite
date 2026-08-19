'use client';

import Link from 'next/link';
import AlphabetLearningStudio from '../../../components/alphabet/AlphabetLearningStudio';

export default function AlphabetPageClient() {
  return (
    <section className="space-y-8">
      <div className="surface-panel p-8">
        <p className="section-eyebrow">Resources</p>
        <h1 className="font-ethiopic-display mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
          ፊደላት ትግርኛ · Tigrinya Alphabet
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Learn each Fidel family interactively — click to hear, trace to write, then test yourself in quiz mode.
          Progress is saved as you practice.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/student/dashboard" className="font-semibold text-amber-800 hover:underline">
            ← Back to dashboard
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/about" className="font-semibold text-slate-600 hover:text-brand-800 hover:underline">
            About our course modules
          </Link>
        </div>
      </div>

      <AlphabetLearningStudio />
    </section>
  );
}
