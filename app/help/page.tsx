import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, CardContent } from '../../components/ui';
import { HELP_SECTIONS, HELP_SUPPORT } from '../../lib/helpCopy';

export const metadata: Metadata = {
  title: 'Help & Support | Tigrigna Learning Portal',
  description: 'FAQ and support for students, parents, and teachers using the Tigrigna Learning Portal.'
};

export default function HelpPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Support</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{HELP_SUPPORT.title}</h1>
        <p className="text-sm text-slate-600">{HELP_SUPPORT.subtitle}</p>
      </div>

      <div className="space-y-6">
        {HELP_SECTIONS.map((section) => (
          <Card key={section.title} variant="elevated">
            <CardContent className="space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
                {section.description ? <p className="mt-1 text-sm text-slate-600">{section.description}</p> : null}
              </div>
              <div className="space-y-3">
                {section.faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 open:bg-white"
                  >
                    <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center justify-between gap-3">
                        {faq.question}
                        <span className="text-slate-400 transition group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-lg font-semibold text-slate-950">Contact support</h2>
          <p className="text-sm text-slate-600">{HELP_SUPPORT.contactIntro}</p>
          <p className="font-ethiopic text-sm font-semibold text-slate-800">{HELP_SUPPORT.teacher}</p>
          <a
            href={`mailto:${HELP_SUPPORT.email}`}
            className="inline-flex text-sm font-semibold text-brand-800 underline-offset-2 hover:underline"
          >
            {HELP_SUPPORT.email}
          </a>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/login" className="link-button-secondary px-4 py-2 text-sm">
              Login
            </Link>
            <Link href="/settings" className="link-button-secondary px-4 py-2 text-sm">
              Account settings
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
