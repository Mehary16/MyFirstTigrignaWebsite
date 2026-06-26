import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center',
        className
      )}
    >
      {Icon ? (
        <div className="mb-4 rounded-2xl bg-white p-3 text-slate-500 shadow-sm ring-1 ring-slate-200/80">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      ) : null}
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description ? <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
