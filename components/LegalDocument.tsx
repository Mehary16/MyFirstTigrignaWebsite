import Link from 'next/link';
import type { LegalSection } from '../lib/legalCopy';
import { Card, CardContent, CardHeader, CardTitle } from './ui';

type LegalDocumentProps = {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export default function LegalDocument({ title, subtitle, lastUpdated, sections }: LegalDocumentProps) {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Legal</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="text-sm text-slate-600">{subtitle}</p>
        <p className="text-xs text-slate-500">Last updated: {lastUpdated}</p>
      </div>

      <Card variant="elevated">
        <CardContent className="space-y-8 pt-6">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets?.length ? (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Related documents</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/privacy" className="link-button-secondary px-4 py-2 text-sm">
            Privacy Policy
          </Link>
          <Link href="/terms" className="link-button-secondary px-4 py-2 text-sm">
            Terms of Service
          </Link>
          <Link href="/" className="link-button-secondary px-4 py-2 text-sm">
            Back to home
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
