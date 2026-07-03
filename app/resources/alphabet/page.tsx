'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { TIGRINYA_ALPHABET } from '../../../lib/tigrinyaAlphabet';

function AlphabetAudioButton({ audioPath, label }: { audioPath?: string; label: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    if (!audioPath) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioPath);
      audioRef.current.onerror = () => {
        audioRef.current = null;
      };
    }
    audioRef.current.play().catch(() => undefined);
  };

  return (
    <button
      type="button"
      onClick={play}
      disabled={!audioPath}
      title={audioPath ? `Play ${label}` : 'Audio file not uploaded yet'}
      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      ▶ Play
    </button>
  );
}

export default function AlphabetPageClient() {
  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-amber-100 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-700">Resources</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Tigrinya Alphabet (ፊደላት ትግርኛ)</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Practice Ge&apos;ez script characters with transliteration and native-speaker audio.
        </p>
        <Link href="/student/dashboard" className="mt-4 inline-flex text-sm font-semibold text-amber-800 hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Tigrinya</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Transliteration</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Audio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TIGRINYA_ALPHABET.map((entry) => (
              <tr key={`${entry.char}-${entry.transliteration}`}>
                <td className="px-4 py-3 text-2xl text-slate-950">{entry.char}</td>
                <td className="px-4 py-3 text-slate-700">{entry.transliteration}</td>
                <td className="px-4 py-3 text-slate-600">{entry.name}</td>
                <td className="px-4 py-3">
                  <AlphabetAudioButton audioPath={entry.audioPath} label={entry.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/*
        Tip for teachers: record short pronunciation clips and save them as MP3 files in
        public/alphabet/ using the filenames shown in lib/tigrinyaAlphabet.ts (e.g. selam.mp3).
      */}
    </section>
  );
}
