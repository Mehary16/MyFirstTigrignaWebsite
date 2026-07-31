'use client';

import Link from 'next/link';
import { cn } from '../lib/cn';

export type DashboardSectionLink = {
  id: string;
  label: string;
};

type DashboardSectionNavProps = {
  links: DashboardSectionLink[];
  className?: string;
};

export default function DashboardSectionNav({ links, className }: DashboardSectionNavProps) {
  if (!links.length) return null;

  return (
    <nav
      aria-label="Dashboard sections"
      className={cn(
        'sticky top-[4.5rem] z-40 -mx-1 overflow-x-auto rounded-full border border-slate-200/90 bg-white/95 px-2 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80',
        className
      )}
    >
      <ul className="flex min-w-max items-center gap-1.5 px-1">
        {links.map((link) => (
          <li key={link.id}>
            <Link
              href={`#${link.id}`}
              className="inline-flex rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900/20"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
