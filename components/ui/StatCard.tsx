import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export type StatCardProps = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export default function StatCard({ label, value, helper, icon: Icon, active = false, onClick, className }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className={cn('text-xs font-semibold uppercase tracking-[0.18em]', active ? 'text-amber-100' : 'text-slate-500')}>
          {label}
        </p>
        <div
          className={cn(
            'rounded-2xl p-2',
            active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <p className={cn('mt-3 text-3xl font-semibold tracking-tight', active ? 'text-white' : 'text-slate-950')}>{value}</p>
      <p className={cn('mt-2 text-sm leading-relaxed', active ? 'text-slate-200' : 'text-slate-600')}>{helper}</p>
    </>
  );

  const classes = cn(
    'w-full rounded-3xl border p-4 text-left transition lg:p-5',
    active
      ? 'border-brand-900 bg-brand-900 text-white shadow-card-lg'
      : 'border-slate-200/80 bg-white shadow-card hover:border-slate-300 hover:shadow-card-lg',
    onClick && 'cursor-pointer',
    className
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
}
