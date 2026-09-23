'use client';

import { cn } from '../../lib/cn';

const CHOICE_STYLES = [
  'bg-rose-500 hover:bg-rose-600',
  'bg-sky-500 hover:bg-sky-600',
  'bg-amber-400 hover:bg-amber-500 text-slate-900',
  'bg-emerald-500 hover:bg-emerald-600'
] as const;

type KahootChoiceButtonsProps = {
  choices: string[];
  disabled?: boolean;
  selectedIndex?: number | null;
  revealCorrectIndex?: number | null;
  onPick?: (index: number) => void;
  compact?: boolean;
};

export default function KahootChoiceButtons({
  choices,
  disabled,
  selectedIndex,
  revealCorrectIndex,
  onPick,
  compact
}: KahootChoiceButtonsProps) {
  return (
    <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'sm:grid-cols-2')}>
      {choices.map((label, index) => {
        const revealed = revealCorrectIndex != null;
        const isCorrect = revealCorrectIndex === index;
        const isWrongPick = revealed && selectedIndex === index && !isCorrect;

        return (
          <button
            key={`${index}-${label}`}
            type="button"
            disabled={disabled || !onPick}
            onClick={() => onPick?.(index)}
            className={cn(
              'rounded-2xl px-4 py-4 text-left font-semibold text-white shadow-md transition',
              CHOICE_STYLES[index % CHOICE_STYLES.length],
              compact && 'py-3 text-sm',
              disabled && 'opacity-70',
              isCorrect && revealed && 'ring-4 ring-white ring-offset-2 ring-offset-slate-900',
              isWrongPick && 'opacity-50 line-through'
            )}
          >
            <span className="mr-2 text-xs uppercase opacity-80">{index + 1}</span>
            <span className={cn(label.length <= 2 && 'font-ethiopic text-3xl')}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
