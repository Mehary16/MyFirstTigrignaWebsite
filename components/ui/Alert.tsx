import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '../../lib/cn';

const variants = {
  info: {
    container: 'border-sky-200 bg-sky-50 text-sky-950',
    icon: 'text-sky-700',
    Icon: Info
  },
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    icon: 'text-emerald-700',
    Icon: CheckCircle2
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-950',
    icon: 'text-amber-700',
    Icon: TriangleAlert
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-950',
    icon: 'text-red-700',
    Icon: AlertCircle
  }
} as const;

export type AlertVariant = keyof typeof variants;

export type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
};

export default function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const config = variants[variant];
  const Icon = config.Icon;

  return (
    <div
      role="alert"
      className={cn('flex gap-3 rounded-2xl border px-4 py-4 text-sm leading-relaxed', config.container, className)}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.icon)} aria-hidden />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? 'mt-1' : undefined}>{children}</div>
      </div>
    </div>
  );
}
