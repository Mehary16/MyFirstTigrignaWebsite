import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'muted' | 'elevated' | 'brand';
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
} as const;

const variantClasses = {
  default: 'border-slate-200/80 bg-white shadow-card',
  muted: 'border-slate-200/70 bg-slate-50/80 shadow-sm',
  elevated: 'border-slate-200/80 bg-white shadow-card-lg',
  brand: 'border-amber-100/90 bg-white shadow-card-lg'
} as const;

export function Card({ className, padding = 'md', variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-3xl border', variantClasses[variant], paddingClasses[padding], className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-6 space-y-2', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-2xl font-semibold tracking-tight text-slate-950', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm leading-relaxed text-slate-600', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props} />;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mt-6 flex flex-wrap gap-2', className)}>{children}</div>;
}
