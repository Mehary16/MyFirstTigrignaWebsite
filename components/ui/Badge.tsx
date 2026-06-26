import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const variants = {
  default: 'bg-slate-100 text-slate-700',
  brand: 'bg-amber-100 text-amber-900',
  success: 'bg-emerald-100 text-emerald-800',
  info: 'bg-sky-100 text-sky-800',
  danger: 'bg-red-100 text-red-800',
  role: 'bg-brand-900 text-white'
} as const;

export type BadgeVariant = keyof typeof variants;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export default function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
