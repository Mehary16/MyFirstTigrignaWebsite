'use client';

import { Info } from 'lucide-react';
import Alert from '../ui/Alert';

export default function AlphabetAudioNotice() {
  return (
    <Alert variant="info" title="About alphabet pronunciation">
      <div className="space-y-2 text-sm">
        <p>
          Right now most browsers do <strong>not</strong> have a real Tigrinya voice. When no MP3 is found, the site
          tries an Ethiopian-language voice on the Ge&apos;ez letter (e.g. <span className="font-ethiopic">በ</span>).
          If that is missing too, it reads the English spelling — so &quot;be&quot; can sound like English instead of
          Tigrinya.
        </p>
        <p className="font-semibold text-slate-800">Best ways to get correct Tigrinya sounds:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            <strong>Record MP3 files</strong> — a native speaker says each letter; save as{' '}
            <code className="rounded bg-white/80 px-1">public/alphabet/ba.mp3</code>,{' '}
            <code className="rounded bg-white/80 px-1">sa.mp3</code>, etc. (best quality for students)
          </li>
          <li>
            <strong>Tigrinya text-to-speech</strong> — services like{' '}
            <a href="https://amisus.io/text-to-speech-tigrinya/" target="_blank" rel="noreferrer" className="underline">
              AmiSus
            </a>
            ,{' '}
            <a href="https://ethiopic.io/" target="_blank" rel="noreferrer" className="underline">
              EthiopicAI
            </a>
            , or open-source{' '}
            <a
              href="https://tigrinyanlp.github.io/docs/Tigrinya%20TTS/piper.html"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Piper Tigrinya TTS
            </a>{' '}
            can generate audio from Ge&apos;ez text
          </li>
          <li>
            <strong>Use your alphabet poster</strong> — record from your chart (e.g. ተድሮስ ሃጎን / Tedros Hagon style charts)
            or have your teacher record one clip per family
          </li>
        </ol>
        <p className="flex items-start gap-2 text-xs text-slate-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Letters like B in English are not the same as Tigrinya <span className="font-ethiopic">በ</span> (be) — students
          should hear a native speaker, not English letter names.
        </p>
      </div>
    </Alert>
  );
}
