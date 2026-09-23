'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Volume2 } from 'lucide-react';
import { useAlphabetAudio } from '../../lib/useAlphabetAudio';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import KahootChoiceButtons from './KahootChoiceButtons';
import { playerStorageKey, useKahootPoll } from './useKahootPoll';

type KahootPlayerClientProps = {
  sessionId: string;
};

export default function KahootPlayerClient({ sessionId }: KahootPlayerClientProps) {
  const { state, error, loading, refresh } = useKahootPoll(sessionId);
  const { play } = useAlphabetAudio();
  const [nickname, setNickname] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(playerStorageKey(sessionId));
    if (stored) setPlayerId(stored);
  }, [sessionId]);

  useEffect(() => {
    setSelectedIndex(null);
    setAnsweredIndex(null);
    setAnswerError(null);
  }, [state?.questionIndex]);

  useEffect(() => {
    if (state?.myChoiceIndex != null) {
      setAnsweredIndex(state.myChoiceIndex);
      setSelectedIndex(state.myChoiceIndex);
    }
  }, [state?.myChoiceIndex, state?.questionIndex]);

  const join = useCallback(async () => {
    setJoinError(null);
    const response = await fetch(`/api/kahoot/sessions/${sessionId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname })
    });
    const payload = (await response.json()) as { error?: string; player?: { id: string; nickname: string } };
    if (!response.ok || !payload.player) {
      setJoinError(payload.error ?? 'Could not join.');
      return;
    }
    sessionStorage.setItem(playerStorageKey(sessionId), payload.player.id);
    setPlayerId(payload.player.id);
    await refresh();
  }, [nickname, sessionId, refresh]);

  const submitAnswer = useCallback(
    async (choiceIndex: number) => {
      if (!playerId || !state || state.status !== 'question') return;
      setAnswerError(null);
      setSelectedIndex(choiceIndex);
      const response = await fetch(`/api/kahoot/sessions/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, choiceIndex })
      });
      const payload = (await response.json()) as { error?: string; accepted?: boolean };
      if (!response.ok) {
        setAnswerError(payload.error ?? 'Could not submit answer.');
        setSelectedIndex(null);
        return;
      }
      setAnsweredIndex(choiceIndex);
      await refresh();
    },
    [playerId, sessionId, state, refresh]
  );

  const replay = () => {
    const q = state?.currentQuestion;
    if (!q?.audioChar || !q.audioTransliteration) return;
    void play({ char: q.audioChar, transliteration: q.audioTransliteration });
  };

  useEffect(() => {
    const q = state?.currentQuestion;
    if (!q || state.status !== 'question') return;
    if (q.audioChar && q.audioTransliteration) {
      void play({ char: q.audioChar, transliteration: q.audioTransliteration });
    }
  }, [state?.currentQuestion, state?.status, state?.questionIndex, play]);

  if (loading && !state) {
    return <p className="text-sm text-slate-600">Connecting…</p>;
  }

  if (error && !state) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!state) return null;

  if (!playerId) {
    return (
      <div className="surface-panel mx-auto max-w-md space-y-4 p-6">
        <h1 className="text-xl font-semibold text-slate-950">Join {state.title}</h1>
        <p className="text-sm text-slate-600">PIN {state.pin}</p>
        {joinError && <Alert variant="error">{joinError}</Alert>}
        <label className="block text-sm font-medium text-slate-700">
          Nickname
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={24}
            placeholder="Your name"
          />
        </label>
        <Button onClick={() => void join()} disabled={nickname.trim().length < 2}>
          Join game
        </Button>
      </div>
    );
  }

  const me = state.players.find((player) => player.id === playerId);
  const question = state.currentQuestion;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {(error || joinError || answerError) && (
        <Alert variant="error">{answerError ?? joinError ?? error}</Alert>
      )}

      <div className="surface-panel p-4 text-center">
        <p className="text-xs uppercase text-slate-500">{me?.nickname ?? 'Player'}</p>
        <p className="text-2xl font-bold tabular-nums text-violet-700">{me?.score ?? 0} pts</p>
      </div>

      {state.status === 'lobby' && (
        <div className="surface-panel p-8 text-center">
          <p className="text-lg font-medium text-slate-800">You&apos;re in!</p>
          <p className="mt-2 text-sm text-slate-600">Wait for your teacher to start the game.</p>
        </div>
      )}

      {state.status === 'finished' && (
        <div className="surface-panel space-y-3 p-6">
          <h2 className="text-lg font-semibold">Final standings</h2>
          <ol className="space-y-2 text-sm">
            {state.players.map((player, index) => (
              <li key={player.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>
                  {index + 1}. {player.nickname}
                </span>
                <span className="font-semibold">{player.score}</span>
              </li>
            ))}
          </ol>
          <Link href="/student/kahoot" className="inline-block text-sm text-violet-700 hover:underline">
            Join another game
          </Link>
        </div>
      )}

      {(state.status === 'question' || state.status === 'reveal') && question && (
        <div className="space-y-4 rounded-2xl bg-slate-900 p-5 text-white">
          <div className="flex items-start justify-between gap-2">
            <p className="text-base font-medium">{question.prompt}</p>
            <Button type="button" variant="secondary" size="sm" onClick={replay} className="shrink-0 gap-1">
              <Volume2 className="h-4 w-4" aria-hidden />
              Hear
            </Button>
          </div>
          {question.promptEthiopic && (
            <p className="font-ethiopic text-4xl">{question.promptEthiopic}</p>
          )}
          <KahootChoiceButtons
            choices={question.choices}
            disabled={state.status !== 'question' || answeredIndex != null}
            selectedIndex={selectedIndex}
            revealCorrectIndex={
              state.status === 'reveal' && typeof question.correctIndex === 'number'
                ? question.correctIndex
                : null
            }
            onPick={(index) => void submitAnswer(index)}
            compact
          />
          {answeredIndex != null && state.status === 'question' && (
            <p className="text-center text-sm text-emerald-300">Answer locked — waiting for results…</p>
          )}
          {state.status === 'reveal' && answeredIndex != null && typeof question.correctIndex === 'number' && (
            <p className="text-center text-sm">
              {answeredIndex === question.correctIndex ? 'Correct!' : 'Not this time — keep going!'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
