'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Volume2, XCircle } from 'lucide-react';
import {
  markFormPracticed,
  pickQuizQuestion,
  recordQuizAnswer,
  resetQuizSession,
  getFamilyById,
  type AlphabetFormRef,
  type AlphabetProgress
} from '../../lib/alphabetProgress';
import { audioPathsForForm } from '../../lib/tigrinyaAlphabetFamilies';
import { useAlphabetAudio } from '../../lib/useAlphabetAudio';
import { logAlphabetActivity } from '../../lib/logAlphabetActivity';
import { cn } from '../../lib/cn';
import Alert from '../ui/Alert';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

type QuizFeedback = 'idle' | 'correct' | 'wrong';

type AlphabetQuizModeProps = {
  progress: AlphabetProgress;
  onProgressChange: (updater: (current: AlphabetProgress) => AlphabetProgress) => void;
  familyId?: string;
  recordingFiles?: Set<string>;
};

export default function AlphabetQuizMode({ progress, onProgressChange, familyId, recordingFiles }: AlphabetQuizModeProps) {
  const { play } = useAlphabetAudio();
  const [question, setQuestion] = useState<{ correct: AlphabetFormRef; choices: AlphabetFormRef[] } | null>(null);
  const [feedback, setFeedback] = useState<QuizFeedback>('idle');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const loadQuestion = useCallback(() => {
    const next = pickQuizQuestion({ familyId });
    setQuestion(next);
    setFeedback('idle');
    setSelectedKey(null);
    return next;
  }, [familyId]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  useEffect(() => {
    if (!question) return;
    const family = getFamilyById(question.correct.familyId);
    if (!family) return;
    const paths = audioPathsForForm(family, question.correct.formIndex, recordingFiles);
    void play({
      char: question.correct.char,
      transliteration: question.correct.transliteration,
      audioPath: paths[0],
      audioFallbackPaths: paths.slice(1)
    });
  }, [question, play, recordingFiles]);

  const replaySound = () => {
    if (!question) return;
    const family = getFamilyById(question.correct.familyId);
    if (!family) return;
    const paths = audioPathsForForm(family, question.correct.formIndex, recordingFiles);
    void play({
      char: question.correct.char,
      transliteration: question.correct.transliteration,
      audioPath: paths[0],
      audioFallbackPaths: paths.slice(1)
    });
  };

  const handleAnswer = (choice: AlphabetFormRef) => {
    if (!question || feedback !== 'idle') return;

    const isCorrect = choice.key === question.correct.key;
    setSelectedKey(choice.key);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setStreak((current) => (isCorrect ? current + 1 : 0));

    onProgressChange((current) => {
      let next = recordQuizAnswer(current, question.correct.key, isCorrect);
      if (isCorrect) next = markFormPracticed(next, question.correct.key);
      return next;
    });

    void logAlphabetActivity({
      activityType: 'quiz_answer',
      formKey: question.correct.key,
      familyId: question.correct.familyId,
      correct: isCorrect,
      metadata: { chosen: choice.char, answer: question.correct.char }
    });
  };

  const handleNext = () => {
    loadQuestion();
  };

  const handleResetSession = () => {
    onProgressChange((current) => resetQuizSession(current));
    setStreak(0);
    loadQuestion();
  };

  const sessionScore = useMemo(() => {
    if (!progress.quizSessionTotal) return '0%';
    return `${Math.round((progress.quizSessionCorrect / progress.quizSessionTotal) * 100)}%`;
  }, [progress.quizSessionCorrect, progress.quizSessionTotal]);

  if (!question) {
    return (
      <div className="surface-panel p-8 text-center text-slate-600">
        Not enough letters loaded for a quiz yet.
      </div>
    );
  }

  return (
    <div className="surface-panel space-y-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow">Quiz mode</p>
          <h2 className="text-2xl font-semibold text-slate-950">Which letter did you hear?</h2>
          <p className="mt-2 text-sm text-slate-600">
            Listen to the sound, then pick the matching Tigrinya letter.
            {familyId ? ' Questions are limited to the selected family.' : ' Questions use the full alphabet.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="brand">Session {sessionScore}</Badge>
          <Badge variant="success">Streak {streak}</Badge>
          <Badge variant="info">
            {progress.quizSessionCorrect}/{progress.quizSessionTotal} this round
          </Badge>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-[1.75rem] border border-amber-100 bg-amber-50/70 px-6 py-8">
        <button
          type="button"
          onClick={replaySound}
          className="flex h-20 w-20 items-center justify-center rounded-full border border-amber-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-100"
          aria-label="Replay sound"
        >
          <Volume2 className="h-8 w-8 text-brand-900" />
        </button>
        <p className="text-sm font-semibold text-amber-900">Tap to hear the letter again</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.choices.map((choice) => {
          const isSelected = selectedKey === choice.key;
          const isCorrectChoice = choice.key === question.correct.key;
          const showResult = feedback !== 'idle';

          return (
            <button
              key={choice.key}
              type="button"
              disabled={feedback !== 'idle'}
              onClick={() => handleAnswer(choice)}
              className={cn(
                'flex items-center justify-between rounded-2xl border px-4 py-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                !showResult && 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm',
                showResult && isCorrectChoice && 'border-emerald-300 bg-emerald-50',
                showResult && isSelected && !isCorrectChoice && 'border-red-300 bg-red-50',
                showResult && !isSelected && !isCorrectChoice && 'border-slate-200 bg-slate-50 opacity-70'
              )}
            >
              <div className="text-left">
                <span className="font-ethiopic-display block text-4xl leading-none text-slate-950">{choice.char}</span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {choice.transliteration}
                </span>
              </div>
              {showResult && isCorrectChoice ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : null}
              {showResult && isSelected && !isCorrectChoice ? <XCircle className="h-6 w-6 text-red-500" /> : null}
            </button>
          );
        })}
      </div>

      {feedback === 'correct' ? (
        <Alert variant="success" title="Correct!">
          {question.correct.char} ({question.correct.transliteration}) — nice listening!
        </Alert>
      ) : null}

      {feedback === 'wrong' ? (
        <Alert variant="error" title="Not quite">
          The correct letter was {question.correct.char} ({question.correct.transliteration}). Listen again and try the
          next one.
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={handleNext} disabled={feedback === 'idle'}>
          Next question
        </Button>
        <Button type="button" variant="secondary" onClick={replaySound}>
          <Volume2 className="h-4 w-4" />
          Replay sound
        </Button>
        <Button type="button" variant="ghost" onClick={handleResetSession}>
          <RotateCcw className="h-4 w-4" />
          Reset session score
        </Button>
      </div>
    </div>
  );
}
