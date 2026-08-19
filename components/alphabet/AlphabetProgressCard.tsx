'use client';

import {
  countMasteredForms,
  countPracticedForms,
  countQuizKnownForms,
  familyProgressSummary,
  flattenAlphabetForms,
  MASTERED_QUIZ_THRESHOLD,
  type AlphabetProgress
} from '../../lib/alphabetProgress';
import { TIGRINYA_ALPHABET_FAMILIES } from '../../lib/tigrinyaAlphabetFamilies';
import Badge from '../ui/Badge';

type AlphabetProgressCardProps = {
  progress: AlphabetProgress;
  activeFamilyId?: string;
};

export default function AlphabetProgressCard({ progress, activeFamilyId }: AlphabetProgressCardProps) {
  const totalForms = flattenAlphabetForms().length;
  const practiced = countPracticedForms(progress);
  const quizKnown = countQuizKnownForms(progress);
  const mastered = countMasteredForms(progress);
  const practicedPct = totalForms ? Math.round((practiced / totalForms) * 100) : 0;
  const masteredPct = totalForms ? Math.round((mastered / totalForms) * 100) : 0;

  const activeFamily = activeFamilyId
    ? TIGRINYA_ALPHABET_FAMILIES.find((family) => family.id === activeFamilyId)
    : undefined;
  const activeSummary = activeFamilyId ? familyProgressSummary(progress, activeFamilyId) : null;

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Your alphabet progress</p>
          <p className="text-xs text-slate-500">Saved on this device{progress.updatedAt ? '' : ''} while you learn.</p>
        </div>
        <Badge variant="brand">{masteredPct}% mastered</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ProgressStat label="Traced" value={practiced} total={totalForms} hint="Letters you practiced writing" />
        <ProgressStat label="Quiz hits" value={quizKnown} total={totalForms} hint="Letters answered correctly at least once" />
        <ProgressStat
          label="Mastered"
          value={mastered}
          total={totalForms}
          hint={`${MASTERED_QUIZ_THRESHOLD}+ correct quiz answers`}
        />
      </div>

      <div className="mt-4 space-y-2">
        <ProgressBar label="Tracing progress" percent={practicedPct} tone="amber" />
        <ProgressBar label="Quiz mastery" percent={masteredPct} tone="emerald" />
      </div>

      {activeFamily && activeSummary ? (
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{activeFamily.name}</span> family: {activeSummary.practiced}/
          {activeSummary.total} traced · {activeSummary.mastered}/{activeSummary.total} mastered
        </p>
      ) : null}

      {progress.quizLifetimeTotal > 0 ? (
        <p className="mt-3 text-xs text-slate-500">
          Lifetime quiz score: {progress.quizLifetimeCorrect}/{progress.quizLifetimeTotal} (
          {Math.round((progress.quizLifetimeCorrect / progress.quizLifetimeTotal) * 100)}%)
        </p>
      ) : null}
    </div>
  );
}

function ProgressStat({
  label,
  value,
  total,
  hint
}: {
  label: string;
  value: number;
  total: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">
        {value}
        <span className="text-base font-medium text-slate-400">/{total}</span>
      </p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function ProgressBar({ label, percent, tone }: { label: string; percent: number; tone: 'amber' | 'emerald' }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={tone === 'amber' ? 'h-full rounded-full bg-amber-500' : 'h-full rounded-full bg-emerald-500'}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
