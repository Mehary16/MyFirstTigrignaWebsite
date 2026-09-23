'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Copy, Play, SkipForward, Eye } from 'lucide-react';
import { FIDEL_BOOK_SOURCE_LABEL } from '../../lib/kahoot/fidelBookQuestions';
import { QUESTION_SECONDS } from '../../lib/kahoot/liveSession';
import { useAlphabetAudio } from '../../lib/useAlphabetAudio';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import KahootChoiceButtons from './KahootChoiceButtons';
import { useKahootPoll } from './useKahootPoll';

type KahootHostClientProps = {
  sessionId: string;
};

export default function KahootHostClient({ sessionId }: KahootHostClientProps) {
  const { state, error, loading, refresh } = useKahootPoll(sessionId);
  const { play } = useAlphabetAudio();
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const runAction = useCallback(
    async (action: 'start' | 'next' | 'reveal' | 'finish') => {
      setActionError(null);
      const response = await fetch(`/api/kahoot/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setActionError(payload.error ?? 'Action failed.');
        return;
      }
      await refresh();
    },
    [sessionId, refresh]
  );

  useEffect(() => {
    if (!state?.questionEndsAt || state.status !== 'question') {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      const left = Math.max(0, Math.ceil((new Date(state.questionEndsAt!).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0 && state.isHost) {
        void runAction('reveal');
      }
    };

    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [state?.questionEndsAt, state?.status, state?.isHost, runAction]);

  useEffect(() => {
    const question = state?.currentQuestion;
    if (!question || state.status !== 'question') return;
    if (question.audioChar && question.audioTransliteration) {
      void play({ char: question.audioChar, transliteration: question.audioTransliteration });
    }
  }, [state?.currentQuestion, state?.status, state?.questionIndex, play]);

  const leaderboard = useMemo(() => state?.players ?? [], [state?.players]);

  const copyPin = async () => {
    if (!state?.pin) return;
    await navigator.clipboard.writeText(state.pin);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !state) {
    return <p className="text-sm text-slate-600">Loading host view…</p>;
  }

  if (error && !state) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!state) return null;

  const question = state.currentQuestion;
  const progressLabel =
    state.questionIndex >= 0 ? `Question ${state.questionIndex + 1} / ${state.questionCount}` : 'Lobby';

  return (
    <div className="space-y-6">
      {(error || actionError) && <Alert variant="error">{actionError ?? error}</Alert>}

      <div className="surface-panel space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">{FIDEL_BOOK_SOURCE_LABEL}</p>
            <h1 className="text-2xl font-semibold text-slate-950">{state.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{progressLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Game PIN</p>
            <button
              type="button"
              onClick={() => void copyPin()}
              className="mt-1 flex items-center gap-2 font-mono text-4xl font-bold tracking-widest text-violet-700"
            >
              {state.pin}
              <Copy className="h-5 w-5" aria-hidden />
            </button>
            {copied && <p className="text-xs text-emerald-600">Copied</p>}
          </div>
        </div>

        {state.status === 'lobby' && (
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void runAction('start')} className="gap-2">
              <Play className="h-4 w-4" aria-hidden />
              Start game
            </Button>
            <p className="text-sm text-slate-600 self-center">
              {leaderboard.length} player{leaderboard.length === 1 ? '' : 's'} in lobby
            </p>
          </div>
        )}

        {(state.status === 'question' || state.status === 'reveal') && question && (
          <div className="space-y-4 rounded-2xl bg-slate-900 p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-lg font-medium">{question.prompt}</p>
              {state.status === 'question' && secondsLeft != null && (
                <span className="rounded-full bg-white/15 px-4 py-1 font-mono text-xl">{secondsLeft}s</span>
              )}
            </div>
            {question.promptEthiopic && (
              <p className="font-ethiopic text-5xl leading-tight">{question.promptEthiopic}</p>
            )}
            <KahootChoiceButtons
              choices={question.choices}
              disabled
              revealCorrectIndex={
                state.status === 'reveal' && typeof question.correctIndex === 'number'
                  ? question.correctIndex
                  : null
              }
            />
            {state.status === 'reveal' && (
              <div className="grid gap-2 sm:grid-cols-4">
                {question.choices.map((label, index) => (
                  <p key={label} className="text-center text-sm text-white/80">
                    {label}: {state.answerCounts[index] ?? 0}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {state.status === 'question' && (
          <Button variant="secondary" onClick={() => void runAction('reveal')} className="gap-2">
            <Eye className="h-4 w-4" aria-hidden />
            Reveal early ({QUESTION_SECONDS}s timer)
          </Button>
        )}

        {state.status === 'reveal' && (
          <Button onClick={() => void runAction('next')} className="gap-2">
            <SkipForward className="h-4 w-4" aria-hidden />
            Next question
          </Button>
        )}

        {state.status === 'finished' && (
          <Alert variant="success">Game finished. Share the final scores below.</Alert>
        )}
      </div>

      <div className="surface-panel p-6">
        <h2 className="text-lg font-semibold text-slate-950">Leaderboard</h2>
        <ol className="mt-4 space-y-2">
          {leaderboard.length === 0 && <li className="text-sm text-slate-600">Waiting for players…</li>}
          {leaderboard.map((player, index) => (
            <li key={player.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm">
              <span>
                <span className="mr-2 font-mono text-slate-400">{index + 1}.</span>
                {player.nickname}
              </span>
              <span className="font-semibold tabular-nums">{player.score}</span>
            </li>
          ))}
        </ol>
      </div>

      <Link href="/teacher/kahoot" className="text-sm text-violet-700 hover:underline">
        ← Host another game
      </Link>
    </div>
  );
}
