import Link from 'next/link';
import { BookOpen, HelpCircle, Info, Languages } from 'lucide-react';

const LINKS = [
  { href: '/resources/alphabet', label: 'Alphabet', icon: Languages },
  { href: '/help', label: 'Help & FAQ', icon: HelpCircle },
  { href: '/about', label: 'About', icon: Info }
] as const;

export default function HomeExploreStrip() {
  return (
    <section
      aria-label="Quick links"
      className="flex flex-wrap items-center gap-3 rounded-[2rem] border border-slate-200/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur"
    >
      <p className="mr-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <BookOpen className="h-4 w-4 text-amber-700" aria-hidden />
        Explore
      </p>
      {LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="link-button-secondary inline-flex items-center gap-2 px-4 py-2 text-sm transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          <item.icon className="h-4 w-4 text-amber-700" aria-hidden />
          {item.label}
        </Link>
      ))}
    </section>
  );
}
