import Link from 'next/link';
import { Languages } from 'lucide-react';

type DashboardAlphabetCardProps = {
  href: string;
  roleLabel: 'Student' | 'Teacher';
};

export default function DashboardAlphabetCard({ href, roleLabel }: DashboardAlphabetCardProps) {
  return (
    <div className="surface-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
          <Languages className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="section-eyebrow">ፊደል · Alphabet</p>
          <h2 className="text-xl font-semibold text-slate-950">Practice Tigrinya letters</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Hear each letter, trace it, and take the quiz. Your {roleLabel.toLowerCase()} progress is saved to your
            account.
          </p>
        </div>
      </div>
      <Link href={href} className="link-button-primary shrink-0 px-6 py-3 text-sm">
        Open alphabet / ፊደል
      </Link>
    </div>
  );
}
