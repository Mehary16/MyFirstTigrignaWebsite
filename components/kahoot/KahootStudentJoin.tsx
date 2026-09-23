'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FIDEL_BOOK_SOURCE_LABEL } from '../../lib/kahoot/fidelBookQuestions';
import Alert from '../ui/Alert';
import Button from '../ui/Button';

export default function KahootStudentJoin() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const join = async () => {
    const trimmed = pin.replace(/\D/g, '').slice(0, 6);
    if (trimmed.length !== 6) {
      setError('Enter the 6-digit PIN from your teacher.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/kahoot/sessions?pin=${encodeURIComponent(trimmed)}`);
      const payload = (await response.json()) as { error?: string; session?: { id: string } };
      if (!response.ok || !payload.session) {
        setError(payload.error ?? 'Game not found.');
        return;
      }
      router.push(`/student/kahoot/${payload.session.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface-panel mx-auto max-w-md space-y-5 p-6">
      <div>
        <p className="section-eyebrow">{FIDEL_BOOK_SOURCE_LABEL}</p>
        <h1 className="text-2xl font-semibold text-slate-950">Join live quiz</h1>
        <p className="mt-2 text-sm text-slate-600">Enter the PIN shown on the teacher&apos;s screen.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <label className="block text-sm font-medium text-slate-700">
        Game PIN
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-2xl tracking-[0.3em]"
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
        />
      </label>

      <Button onClick={() => void join()} disabled={loading}>
        {loading ? 'Looking up…' : 'Continue'}
      </Button>
    </div>
  );
}
