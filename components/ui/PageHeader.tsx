import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Card } from './Card';

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  bilingual?: boolean;
};

export default function PageHeader({ eyebrow, title, description, actions, className, bilingual = true }: PageHeaderProps) {
  return (
    <Card variant="brand" padding="lg" className={cn('relative overflow-hidden', className)}>
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-sky-100/50 blur-3xl" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">{eyebrow}</p>
          ) : null}
          <h1
            className={cn(
              'text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl',
              bilingual && 'font-ethiopic'
            )}
          >
            {title}
          </h1>
          {description ? <p className="text-base leading-relaxed text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </Card>
  );
}
