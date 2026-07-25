import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { cn } from '../lib/cn';

export type DashboardTodayStripProps = {
  summary: string;
  action?: {
    label: string;
    href: string;
  };
  summaries?: string[];
  className?: string;
};

export default function DashboardTodayStrip({
  summary,
  action,
  summaries,
  className
}: DashboardTodayStripProps) {
  const lines = summaries?.length ? summaries : [summary];

  return (
    <section
      className={cn(
        'rounded-[2rem] border border-[#078930]/35 bg-gradient-to-r from-[#078930]/10 via-white to-[#4189DD]/5 p-5 shadow-sm sm:p-6',
        className
      )}
      aria-label="Today summary"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-3">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#078930]">
            <CalendarDays className="h-4 w-4" aria-hidden />
            Today
          </p>
          <div className="space-y-1.5">
            {lines.map((line) => (
              <p key={line} className="text-sm font-medium leading-relaxed text-slate-800 sm:text-base">
                {line}
              </p>
            ))}
          </div>
        </div>

        {action ? (
          <Link
            href={action.href}
            className="link-button-primary shrink-0 px-5 py-2.5 text-sm whitespace-nowrap"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
