'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FIDEL_BOOK_SOURCE_LABEL } from '../../lib/kahoot/fidelBookQuestions';
import { TIGRINYA_ALPHABET_FAMILIES } from '../../lib/tigrinyaAlphabetFamilies';
import Alert from '../ui/Alert';
import Button from '../ui/Button';

export default function KahootTeacherCreate() {
  const router = useRouter();
  const [title, setTitle] = useState('Tigrigna Fidel Live Quiz');
  const [questionCount, setQuestionCount] = useState(10);
  const [familyId, setFamilyId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/kahoot/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          questionCount,
          familyId: familyId || undefined
        })
      });
      const payload = (await response.json()) as { error?: string; session?: { id: string } };
      if (!response.ok || !payload.session) {
        setError(payload.error ?? 'Could not create game.');
        return;
      }
      router.push(`/teacher/kahoot/${payload.session.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface-panel mx-auto max-w-xl space-y-5 p-6">
      <div>
        <p className="section-eyebrow">{FIDEL_BOOK_SOURCE_LABEL}</p>
        <h1 className="text-2xl font-semibold text-slate-950">Host live quiz</h1>
        <p className="mt-2 text-sm text-slate-600">
          Students join with a 6-digit PIN. Each round is timed; faster correct answers earn more points.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <label className="block text-sm font-medium text-slate-700">
        Game title
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Number of questions (5–20)
        <input
          type="number"
          min={5}
          max={20}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={questionCount}
          onChange={(event) => setQuestionCount(Number(event.target.value))}
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Focus (optional)
        <select
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={familyId}
          onChange={(event) => setFamilyId(event.target.value)}
        >
          <option value="">All letter families (full book)</option>
          {TIGRINYA_ALPHABET_FAMILIES.map((family) => (
            <option key={family.id} value={family.id}>
              {family.forms[0]?.char ?? family.name} · {family.name} ({family.exampleWord})
            </option>
          ))}
        </select>
      </label>

      <Button onClick={() => void createGame()} disabled={loading}>
        {loading ? 'Creating…' : 'Create game & get PIN'}
      </Button>
    </div>
  );
}
